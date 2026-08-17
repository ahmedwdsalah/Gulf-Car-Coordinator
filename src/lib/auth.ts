import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { isMovementRequest, type Mode, type MovementRequest, type Order } from './orders';

const HR_API_URL = 'https://hr.gulfcar.com.sa/api/v1/mobile';
const TRACKING_URL = 'https://gps.gulfcar.com.sa/location';
const DEFAULT_PROVISIONING_PROFILE: ProvisioningProfile = {
  organization_id: 'gulfcar',
  organization_name: 'Gulf Car',
  hr_api_url: HR_API_URL,
  tracking_url: TRACKING_URL,
};
const INSTALLATION_ID_KEY = 'auth.installation_id';
const ACCESS_TOKEN_KEY = 'auth.access_token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';
const TRACKING_TOKEN_KEY = 'auth.tracking_token';
const PROVISIONING_KEY = 'auth.provisioning_profile';
export const TRACKING_POLICY_KEY = 'auth.tracking_policy';
export const TRACKING_POLICY_FILE = `${FileSystem.documentDirectory}tracking-policy.json`;
let refreshInFlight: Promise<string> | null = null;
let provisioningProfileCache: ProvisioningProfile | null | undefined;


export async function signOut() {
  refreshInFlight = null;
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  try {
    const { stopLocationTrackingAsync } = await import('./tracking');
    await stopLocationTrackingAsync();
    if (accessToken) {
      await fetch(`${await getHrApiUrl()}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  } catch {
    // Local sign-out must still complete when the server is unreachable.
  } finally {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(TRACKING_TOKEN_KEY),
    ]);
  }
}

export async function hasStoredSession() {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  return Boolean(accessToken && refreshToken);
}

type LoginResponse = {
  ok: true;
  session: { access_token: string; refresh_token: string };
  device: { tracking_token: string };
};

type RefreshResponse = {
  ok: true;
  session: { access_token: string; refresh_token: string };
};

type DeviceRegisterResponse = {
  ok: true;
  device: { tracking_token: string; tracking_token_expires_in: number; provisioning_status: string };
};

export type BootstrapData = {
  organization: { id: string; name: string; tracking_url: string };
  user: { id: number; employee_id: number; employee_code: string; username: string; full_name: string; email: string };
  tracking_policy: { mode: string; accuracy: string; interval_seconds: number; fastest_interval_seconds: number; distance_meters: number; heartbeat_seconds: number; dropoff_radius_meters: number; offline_retention_days: number };
};

export function normalizeTrackingAccuracy(value: string): 'High' | 'Balanced' {
  const normalized = value.trim().toLowerCase().replace(/[-_\s]+/g, '');
  return normalized === 'high' || normalized === 'highaccuracy' ? 'High' : 'Balanced';
}

export type ProvisioningProfile = { organization_id: string; organization_name: string; hr_api_url: string; tracking_url: string };
type ProvisioningResponse = { ok: true; profile: ProvisioningProfile };

export async function getProvisioningProfile() {
  if (provisioningProfileCache !== undefined) return provisioningProfileCache;
  const stored = await SecureStore.getItemAsync(PROVISIONING_KEY);
  if (stored) {
    try {
      const profile = JSON.parse(stored) as ProvisioningProfile;
      if (profile.hr_api_url && profile.tracking_url) {
        provisioningProfileCache = profile;
        return profile;
      }
    } catch {}
  }
  provisioningProfileCache = DEFAULT_PROVISIONING_PROFILE;
  return DEFAULT_PROVISIONING_PROFILE;
}

async function getHrApiUrl() {
  const profile = await getProvisioningProfile();
  if (!profile) throw new AuthError('PROVISIONING_REQUIRED', 0);
  return profile.hr_api_url;
}

export class AuthError extends Error {
  constructor(public readonly code: string, public readonly status: number) {
    super(code);
  }
}

async function getInstallationId() {
  const existing = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  if (existing) return existing;

  const installationId = Crypto.randomUUID();
  await SecureStore.setItemAsync(INSTALLATION_ID_KEY, installationId);
  return installationId;
}

export async function loginDriver(username: string, password: string) {
  const response = await fetch(`${await getHrApiUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username.trim(),
      password,
      installation_id: await getInstallationId(),
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      app_version: Constants.expoConfig?.version ?? 'unknown',
      device_name: Device.modelName ?? 'Unknown device',
    }),
  });

  const body = (await response.json().catch(() => null)) as (Partial<LoginResponse> & { code?: string }) | null;
  if (
    !response.ok ||
    !body?.ok ||
    !body.session?.access_token ||
    !body.session.refresh_token ||
    !body.device?.tracking_token
  ) {
    throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
  }

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, body.session!.access_token!),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, body.session!.refresh_token!),
    SecureStore.setItemAsync(TRACKING_TOKEN_KEY, body.device!.tracking_token!),
  ]);
}

async function refreshSession() {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new AuthError('REFRESH_REJECTED', 401);

    const response = await fetch(`${await getHrApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const body = (await response.json().catch(() => null)) as (Partial<RefreshResponse> & { code?: string }) | null;
    if (!response.ok || !body?.ok || !body.session?.access_token || !body.session.refresh_token) {
      await signOut();
      throw new AuthError(body?.code ?? 'REFRESH_REJECTED', response.status || 401);
    }

    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, body.session.access_token),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, body.session.refresh_token),
    ]);
    return body.session.access_token;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const request = (token: string | null) => {
    const headers = new Headers(init.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return getHrApiUrl().then((baseUrl) => fetch(`${baseUrl}${path}`, { ...init, headers }));
  };

  const response = await request(accessToken);
  if (response.status !== 401) return response;

  const refreshedToken = await refreshSession();
  return request(refreshedToken);
}

export async function getBootstrap(signal?: AbortSignal) {
  const response = await authenticatedFetch('/bootstrap', { signal });
  const body = (await response.json().catch(() => null)) as (Partial<{ ok: true; organization: BootstrapData['organization']; user: BootstrapData['user']; tracking_policy: BootstrapData['tracking_policy'] }> & { code?: string }) | null;
  if (!response.ok || !body?.ok || !body.organization || !body.user || !body.tracking_policy) {
    throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
  }
  const serializedPolicy = JSON.stringify(body.tracking_policy);
  await Promise.all([
    SecureStore.setItemAsync(TRACKING_POLICY_KEY, serializedPolicy),
    FileSystem.writeAsStringAsync(TRACKING_POLICY_FILE, serializedPolicy).catch(() => undefined),
  ]);
  return { organization: body.organization, user: body.user, tracking_policy: body.tracking_policy } satisfies BootstrapData;
}

export function useBootstrapQuery() {
  return useQuery({ queryKey: ['bootstrap'], queryFn: ({ signal }) => getBootstrap(signal), staleTime: 5 * 60 * 1000 });
}

export async function getMovementRequests(status: 'active' | 'completed' | 'all' = 'all', signal?: AbortSignal) {
  const response = await authenticatedFetch(`/movement-requests?status=${status}`, { signal });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; requests?: unknown; code?: string } | null;
  if (!response.ok || !body?.ok || !Array.isArray(body.requests) || !body.requests.every(isMovementRequest)) {
    throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
  }
  return body.requests;
}

type AttendanceState = { checked_in: boolean };

function parseAttendanceState(body: unknown): AttendanceState | null {
  if (!body || typeof body !== 'object') return null;
  const value = body as Record<string, unknown>;
  if (typeof value.checked_in === 'boolean') return { checked_in: value.checked_in };
  if (typeof value.is_checked_in === 'boolean') return { checked_in: value.is_checked_in };
  if (value.state === 'checked_in' || value.status === 'checked_in') return { checked_in: true };
  if (value.state === 'checked_out' || value.status === 'checked_out') return { checked_in: false };
  return null;
}

export async function getAttendanceState(signal?: AbortSignal) {
  const response = await authenticatedFetch('/attendance/state', { signal });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; code?: string } | null;
  const state = parseAttendanceState(body);
  if (!response.ok || !body?.ok || !state) throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
  return state;
}

export async function toggleAttendance() {
  const response = await authenticatedFetch('/attendance/toggle', { method: 'POST' });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; code?: string } | null;
  const state = parseAttendanceState(body);
  if (!response.ok || !body?.ok || !state) throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
  return state;
}

export function useAttendanceStateQuery() {
  return useQuery({ queryKey: ['attendance', 'state'], queryFn: ({ signal }) => getAttendanceState(signal), staleTime: 30 * 1000 });
}

export function useAttendanceToggleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['attendance', 'toggle'],
    mutationFn: toggleAttendance,
    onSuccess: (state) => { queryClient.setQueryData(['attendance', 'state'], state); },
  });
}

export async function registerDevice() {
  const response = await authenticatedFetch('/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      installation_id: await getInstallationId(),
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      app_version: Constants.expoConfig?.version ?? 'unknown',
      device_name: Device.modelName ?? 'Unknown device',
    }),
  });
  const body = (await response.json().catch(() => null)) as (Partial<DeviceRegisterResponse> & { code?: string }) | null;
  if (!response.ok || !body?.ok || !body.device?.tracking_token) {
    throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
  }
  await SecureStore.setItemAsync(TRACKING_TOKEN_KEY, body.device.tracking_token);
  return body.device;
}

export function useRegisterDeviceMutation() {
  return useMutation({ mutationKey: ['devices', 'register'], mutationFn: registerDevice });
}

export type LocationPoint = {
  client_event_id: string;
  captured_at: string;
  latitude: number;
  longitude: number;
  accuracy_m: number;
  speed_mps: number;
  heading_deg: number;
  altitude_m?: number;
  battery_percent?: number;
};

export async function sendLocation(point: LocationPoint) {
  async function send(token: string) {
    const profile = await getProvisioningProfile();
    if (!profile) throw new AuthError('PROVISIONING_REQUIRED', 0);
    const response = await fetch(profile.tracking_url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(point),
    });
    return response;
  }

  let trackingToken = await SecureStore.getItemAsync(TRACKING_TOKEN_KEY);
  if (!trackingToken) trackingToken = (await registerDevice()).tracking_token;
  if (!trackingToken) throw new AuthError('TRACKING_TOKEN_UNAVAILABLE', 0);

  let response = await send(trackingToken);
  if (response.status === 401) {
    trackingToken = (await registerDevice()).tracking_token;
    response = await send(trackingToken);
  } else if (response.status === 500) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    response = await send(trackingToken);
  }

  const body = (await response.json().catch(() => null)) as { ok?: boolean; accepted?: number; duplicates?: number; code?: string } | null;
  if (!response.ok || !body?.ok || ((body.accepted ?? 0) === 0 && (body.duplicates ?? 0) === 0)) {
    throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
  }
  return body;
}

export async function registerPushToken(pushToken: string) {
  const response = await authenticatedFetch('/devices/push-token', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ push_token: pushToken }),
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; code?: string } | null;
  if (!response.ok || !body?.ok) throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
}

export function useRegisterPushTokenMutation() {
  return useMutation({ mutationKey: ['devices', 'push-token'], mutationFn: registerPushToken });
}

async function transitionMovementRequest(action: 'start' | 'complete', id: number, expectedVersion: number) {
  const response = await authenticatedFetch(`/movement-requests/${id}/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': Crypto.randomUUID() },
    body: JSON.stringify({ expected_version: expectedVersion, client_time: new Date().toISOString() }),
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; code?: string } | null;
  if (!response.ok || !body?.ok) throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
}

export function useMovementRequestsQuery(status: 'active' | 'completed' | 'all' = 'all') {
  return useQuery({
    queryKey: ['movement-requests', status],
    queryFn: async ({ signal }) => {
      return getMovementRequests(status, signal);
    },
    staleTime: 30 * 1000,
  });
}

export function useOrdersQuery(language: 'ar' | 'en', mode: Mode) {
  const select = useCallback((requests: MovementRequest[]): Order[] => requests.filter((request) => mode === 'All' || mode === 'Assigned' ? (mode === 'All' || request.status === 'assigned') : mode === 'In progress' ? request.status === 'in_progress' : mode === 'Completed' ? request.status === 'completed' : request.status === 'cancelled').map((request) => ({
    id: request.id,
    version: request.version,
    status: request.status,
    name: request.passenger_names,
    time: request.scheduled_at ? new Date(request.scheduled_at).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit', hour12: false }) : '—',
    from: request.pickup.label,
    to: request.dropoff.label,
    fromCoordinate: { latitude: request.pickup.lat, longitude: request.pickup.lng },
    toCoordinate: { latitude: request.dropoff.lat, longitude: request.dropoff.lng },
  })), [language, mode]);
  return useQuery({
    queryKey: ['movement-requests', 'all'],
    queryFn: async ({ signal }) => {
      const requests = await getMovementRequests('all', signal);
      return requests;
    },
    select,
    staleTime: 30 * 1000,
  });
}

export function useMovementRequestMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => { void queryClient.invalidateQueries({ queryKey: ['movement-requests'] }); };
  const onError = (error: unknown) => {
    if (error instanceof AuthError && error.status === 409) {
      void queryClient.invalidateQueries({ queryKey: ['movement-requests'] });
    }
  };
  return {
    start: useMutation({ mutationKey: ['movement-requests', 'start'], mutationFn: ({ id, expectedVersion }: { id: number; expectedVersion: number }) => transitionMovementRequest('start', id, expectedVersion), onSuccess, onError }),
    complete: useMutation({ mutationKey: ['movement-requests', 'complete'], mutationFn: ({ id, expectedVersion }: { id: number; expectedVersion: number }) => transitionMovementRequest('complete', id, expectedVersion), onSuccess, onError }),
  };
}

export async function requestPasswordReset(username: string) {
  const response = await fetch(`${await getHrApiUrl()}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim() }),
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean } | null;
  if (response.status !== 202 || !body?.ok) {
    throw new AuthError('REQUEST_FAILED', response.status);
  }
}

export async function resolveProvisioning(code: string) {
  const normalizedCode = code.trim();
  const response = await fetch(`${HR_API_URL}/provisioning/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: normalizedCode }),
  });

  const body = (await response.json().catch(() => null)) as (Partial<ProvisioningResponse> & { code?: string }) | null;
  if (!response.ok || !body?.ok || !body.profile?.hr_api_url || !body.profile.tracking_url) {
    throw new AuthError(body?.code ?? 'REQUEST_FAILED', response.status);
  }
  await SecureStore.setItemAsync(PROVISIONING_KEY, JSON.stringify(body.profile));
  provisioningProfileCache = body.profile;
  return body.profile;
}

export function useAuthMutations(options: {
  onLoginSuccess?: () => void | Promise<void>;
  onLoginError?: (error: unknown) => void;
  onResetSuccess?: () => void;
  onResetError?: () => void;
  onLogoutSuccess?: () => void | Promise<void>;
  onLogoutError?: (error: unknown) => void;
  onProvisionSuccess?: (profile: ProvisioningProfile) => void | Promise<void>;
  onProvisionError?: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();
  const login = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: ({ username, password }: { username: string; password: string }) => loginDriver(username, password),
    onSuccess: async () => {
      queryClient.removeQueries();
      await options.onLoginSuccess?.();
    },
    onError: options.onLoginError,
  });
  const reset = useMutation({
    mutationKey: ['auth', 'forgot-password'],
    mutationFn: requestPasswordReset,
    onSuccess: options.onResetSuccess,
    onError: options.onResetError,
  });
  const logout = useMutation({ mutationKey: ['auth', 'logout'], mutationFn: signOut, onSuccess: async () => { queryClient.removeQueries(); await options.onLogoutSuccess?.(); }, onError: options.onLogoutError });
  const provisioning = useMutation({ mutationKey: ['auth', 'provisioning'], mutationFn: resolveProvisioning, onSuccess: options.onProvisionSuccess, onError: options.onProvisionError });
  return { login, reset, logout, provisioning };
}
