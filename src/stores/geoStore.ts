import { reactive } from "vue";
import type { LatLng } from "@/lib/geo/geoMath";

export type PermissionState = "unknown" | "granted" | "denied" | "prompt";

export const geoStore = reactive({
  position: null as LatLng | null,
  accuracy: 0,
  /** Hastighet i m/s, utjämnad över tidsfönstret. */
  speed: 0,
  /** Sant när spåraren bedömer att du faktiskt rör dig. */
  inMotion: false,
  /** Håller reda på vart du går, i grader. */
  heading: 0,
  permission: "unknown" as PermissionState,
  error: null as string | null,
  watching: false,
  /** Meter gångna totalt i det här spelet. */
  walkedMeters: 0,
});
