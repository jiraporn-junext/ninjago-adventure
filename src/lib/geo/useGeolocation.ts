import { geoStore, type PermissionState } from "@/stores/geoStore";
import { gameStore } from "@/stores/gameStore";
import { bearingDegrees, type LatLng } from "./geoMath";
import { describeGeoError, startWatching, type RawFix } from "./geolocationSource";
import { PositionTracker } from "./positionTracker";

const tracker = new PositionTracker();

let watchId: number | null = null;
let previousPosition: LatLng | null = null;

async function refreshPermission(): Promise<void> {
  if (!navigator.permissions?.query) return;

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    const map: Record<string, PermissionState> = {
      granted: "granted",
      denied: "denied",
      prompt: "prompt",
    };
    geoStore.permission = map[status.state] ?? "unknown";
  } catch {
    geoStore.permission = "unknown";
  }
}

function handleFix(fix: RawFix): void {
  const result = tracker.push(fix);
  if (!result.accepted || !result.position) return;

  if (previousPosition) {
    geoStore.heading = bearingDegrees(previousPosition, result.position);
  }
  previousPosition = result.position;

  geoStore.position = result.position;
  geoStore.accuracy = fix.accuracy;
  geoStore.speed = result.speed;
  geoStore.inMotion = result.inMotion;
  geoStore.walkedMeters = result.totalMeters;

  if (result.creditedMeters > 0) {
    gameStore.addWalkMeters(result.creditedMeters);
  }
  gameStore.revealNearby(result.position);
}

export function useGeolocation() {
  function start(): void {
    if (watchId !== null) return;

    geoStore.error = null;
    geoStore.watching = true;

    watchId = startWatching(
      (fix) => {
        geoStore.permission = "granted";
        geoStore.error = null;
        handleFix(fix);
      },
      (error) => {
        geoStore.watching = false;
        geoStore.error = describeGeoError(error);
        if (error.code === 1) geoStore.permission = "denied";
        refreshPermission();
      },
    );
  }

  function stop(): void {
    if (watchId === null) return;
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    geoStore.watching = false;
  }

  function reset(): void {
    tracker.reset();
    previousPosition = null;
    geoStore.position = null;
    geoStore.accuracy = 0;
    geoStore.speed = 0;
    geoStore.inMotion = false;
    geoStore.walkedMeters = 0;
  }

  refreshPermission();

  return { start, stop, reset };
}
