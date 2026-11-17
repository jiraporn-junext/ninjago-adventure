import type { Page } from "@playwright/test";

export const METERS_PER_DEG_LAT = 111320;

export interface Fix {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

declare global {
  interface Window {
    __pushFix: (fix: Fix) => void;
  }
}

export function offsetMeters(
  origin: { lat: number; lng: number },
  northMeters: number,
  eastMeters = 0,
): { lat: number; lng: number } {
  const dLat = northMeters / METERS_PER_DEG_LAT;
  const dLng = eastMeters / (METERS_PER_DEG_LAT * Math.cos((origin.lat * Math.PI) / 180));
  return { lat: origin.lat + dLat, lng: origin.lng + dLng };
}

/**
 * Byter ut navigator.geolocation mot en spelad sekvens av fixar. Eftersom
 * spåraren räknar på fix.timestamp kan vi köra en hel promenad på en gång.
 */
export async function installFakeGeolocation(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const listeners: Array<(position: unknown) => void> = [];

    window.__pushFix = (fix) => {
      const position = {
        coords: {
          latitude: fix.lat,
          longitude: fix.lng,
          accuracy: fix.accuracy ?? 8,
          speed: null,
          heading: null,
        },
        timestamp: fix.timestamp,
      };
      listeners.forEach((callback) => callback(position));
    };

    navigator.geolocation.watchPosition = ((success: (position: unknown) => void) => {
      listeners.push(success);
      return listeners.length;
    }) as typeof navigator.geolocation.watchPosition;

    navigator.geolocation.clearWatch = (() => undefined) as typeof navigator.geolocation.clearWatch;
  });
}

export async function pushFix(
  page: Page,
  position: { lat: number; lng: number },
  timestamp: number,
  accuracy = 8,
): Promise<void> {
  await page.evaluate(
    (fix) => window.__pushFix(fix),
    { lat: position.lat, lng: position.lng, accuracy, timestamp },
  );
}

export async function pushWalk(
  page: Page,
  start: { lat: number; lng: number },
  meters: number,
  speed: number,
  startTimestamp: number,
): Promise<void> {
  await page.evaluate(
    ({ start, meters, speed, startTimestamp }) => {
      const steps = Math.ceil(meters / speed);
      for (let i = 1; i <= steps; i++) {
        const north = i * speed;
        window.__pushFix({
          lat: start.lat + north / 111320,
          lng: start.lng,
          accuracy: 8,
          timestamp: startTimestamp + i * 1000,
        });
      }
    },
    { start, meters, speed, startTimestamp },
  );
}
