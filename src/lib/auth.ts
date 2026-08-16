import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';

const HR_API_URL = 'https://hr.gulfcar.com.sa/api/v1/mobile';
const INSTALLATION_ID_KEY = 'auth.installation_id';
const ACCESS_TOKEN_KEY = 'auth.access_token';
const REFRESH_TOKEN_KEY = 'auth.refresh_token';
const TRACKING_TOKEN_KEY = 'auth.tracking_token';
const PROVISIONING_KEY = 'auth.provisioning_profile';
let refreshInFlight: Promise<string> | null = null;
let provisioningProfileCache: ProvisioningProfile | null | undefined;

export async function signOut() {
  refreshInFlight = null;
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  try {
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
  const [accessToken, refreshToken, trackingToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(TRACKING_TOKEN_KEY),
  ]);
  return Boolean(accessToken && refreshToken && trackingToken);
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
  provisioningProfileCache = null;
  return null;
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
  if (!response.ok || !body?.ok) {
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
  const response = await fetch(`${HR_API_URL}/provisioning/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.trim() }),
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
  const login = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: ({ username, password }: { username: string; password: string }) => loginDriver(username, password),
    onSuccess: options.onLoginSuccess,
    onError: options.onLoginError,
  });
  const reset = useMutation({
    mutationKey: ['auth', 'forgot-password'],
    mutationFn: requestPasswordReset,
    onSuccess: options.onResetSuccess,
    onError: options.onResetError,
  });
  const logout = useMutation({ mutationKey: ['auth', 'logout'], mutationFn: signOut, onSuccess: options.onLogoutSuccess, onError: options.onLogoutError });
  const provisioning = useMutation({ mutationKey: ['auth', 'provisioning'], mutationFn: resolveProvisioning, onSuccess: options.onProvisionSuccess, onError: options.onProvisionError });
  return { login, reset, logout, provisioning };
}
