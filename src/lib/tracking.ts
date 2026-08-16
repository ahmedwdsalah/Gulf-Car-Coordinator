import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import * as Crypto from 'expo-crypto';
import { normalizeTrackingAccuracy, sendLocation, TRACKING_POLICY_KEY, type LocationPoint, type BootstrapData } from './auth';

export const LOCATION_TASK = 'gulf-car-location';
const QUEUE_KEY = 'tracking.location_queue';
const QUEUE_FILE = `${FileSystem.documentDirectory}${QUEUE_KEY}.json`;
const MAX_QUEUE_SIZE = 500;

async function readQueue() {
  try {
    const value = await FileSystem.readAsStringAsync(QUEUE_FILE);
    return JSON.parse(value) as LocationPoint[];
  } catch { return []; }
}

async function writeQueue(queue: LocationPoint[]) {
  await FileSystem.writeAsStringAsync(QUEUE_FILE, JSON.stringify(queue.slice(-MAX_QUEUE_SIZE)));
}

async function flushQueue(queue: LocationPoint[]) {
  while (queue.length) {
    try { await sendLocation(queue[0]); queue.shift(); } catch { break; }
  }
  await writeQueue(queue);
}

async function getTrackingPolicy(): Promise<BootstrapData['tracking_policy'] | null> {
  const value = await SecureStore.getItemAsync(TRACKING_POLICY_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as BootstrapData['tracking_policy']; } catch { return null; }
}

async function pruneQueue(queue: LocationPoint[]) {
  const retentionDays = (await getTrackingPolicy())?.offline_retention_days;
  if (!retentionDays || retentionDays <= 0) return queue;
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  return queue.filter((point) => Date.parse(point.captured_at) >= cutoff);
}

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const locations = (data as { locations?: Location.LocationObject[] }).locations ?? [];
  const queue = await readQueue();
  for (const location of locations) {
    queue.push({
      client_event_id: `${Date.now()}-${Crypto.randomUUID()}`,
      captured_at: new Date(location.timestamp).toISOString(),
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy_m: location.coords.accuracy ?? 0,
      speed_mps: Math.max(0, location.coords.speed ?? 0),
      heading_deg: Math.max(0, Math.min(360, location.coords.heading ?? 0)),
      altitude_m: location.coords.altitude ?? undefined,
    });
  }
  const retainedQueue = await pruneQueue(queue);
  await writeQueue(retainedQueue);
  await flushQueue(retainedQueue);
});

export async function startLocationTrackingAsync() {
  const policy = await getTrackingPolicy();
  if (policy?.mode === 'disabled') {
    await stopLocationTrackingAsync();
    return false;
  }
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== Location.PermissionStatus.GRANTED) return false;
  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== Location.PermissionStatus.GRANTED) return false;
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) return true;
  const intervalSeconds = policy?.interval_seconds ?? 15;
  const heartbeatSeconds = policy?.heartbeat_seconds ?? intervalSeconds;
  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: normalizeTrackingAccuracy(policy?.accuracy ?? 'Balanced') === 'High' ? Location.Accuracy.High : Location.Accuracy.Balanced,
    activityType: Location.ActivityType.AutomotiveNavigation,
    timeInterval: Math.min(intervalSeconds, heartbeatSeconds) * 1000,
    distanceInterval: policy?.distance_meters ?? 25,
    deferredUpdatesInterval: heartbeatSeconds * 1000,
    deferredUpdatesDistance: policy?.distance_meters ?? 25,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: { notificationTitle: 'Gulf Car', notificationBody: 'Live location tracking is active.' },
  });
  return true;
}

export async function stopLocationTrackingAsync() {
  if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}
