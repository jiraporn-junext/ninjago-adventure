let sentinel: WakeLockSentinel | null = null;

export function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

/**
 * Håller skärmen tänd under en promenad. Safari saknar stödet, där returnerar
 * detta false och appen visar en varning i stället.
 */
export async function requestWakeLock(): Promise<boolean> {
  if (!isWakeLockSupported()) return false;

  try {
    sentinel = await navigator.wakeLock.request("screen");
    sentinel.addEventListener("release", () => {
      sentinel = null;
    });
    return true;
  } catch {
    return false;
  }
}

export function releaseWakeLock(): void {
  sentinel?.release().catch(() => undefined);
  sentinel = null;
}
