import { haversineMeters, lerpLatLng, type LatLng } from "./geoMath";

export interface PositionFix {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export interface TrackerConfig {
  /** Positioner med sämre noggrannhet än detta kastas helt. */
  maxAccuracyMeters: number;
  /** Språng snabbare än detta är GPS-glapp (bil, tunnel) och avvisas. */
  maxPlausibleSpeed: number;
  /** Tidskonstant för EMA-utjämningen av positionen, i sekunder. */
  smoothingTauSeconds: number;
  /** Gap större än detta (skärmen låst) bryter kedjan utan att creditera. */
  maxDtSeconds: number;
  /** Längd på fönstret som riktningen mäts över, i sekunder. */
  windowSeconds: number;
  /** Minsta nettohastighet (m/s) för att rörelse ska räknas som promenad. */
  minSpeed: number;
  /** Minsta andel av sträckan som måste vara riktning (netto/sträcka). */
  minStraightness: number;
  /** Nettoförflyttningen måste överstiga accuracy * denna faktor ... */
  minDisplacementFactor: number;
  /** ... och minst detta antal meter. */
  minDisplacementMeters: number;
}

export const DEFAULT_TRACKER_CONFIG: TrackerConfig = {
  maxAccuracyMeters: 30,
  maxPlausibleSpeed: 8,
  smoothingTauSeconds: 2,
  maxDtSeconds: 5,
  windowSeconds: 20,
  minSpeed: 0.5,
  minStraightness: 0.5,
  minDisplacementFactor: 0.7,
  minDisplacementMeters: 4,
};

export interface TrackerResult {
  accepted: boolean;
  reason?: "accuracy" | "implausible-speed" | "too-soon";
  creditedMeters: number;
  totalMeters: number;
  speed: number;
  straightness: number;
  inMotion: boolean;
  position: LatLng | null;
}

interface Sample {
  t: number;
  pos: LatLng;
}

/**
 * Tar GPS-fixar och räknar ut hur mycket spelaren faktiskt gått.
 *
 * GPS-drift är den stora fienden: en stillastående telefon rör sig "5 meter"
 * ihop spridda fixar. Distansen räknas därför aldrig direkt mellan råa fixar.
 * I stället smoothas positionen (EMA), och rörelse bekräftas över ett
 * tidsfönster: en riktig promenad har hög riktning (netto ≈ sträcka), medan
 * drift sprider sig åt alla håll (netto ≪ sträcka).
 */
export class PositionTracker {
  private readonly config: TrackerConfig;
  private ema: LatLng | null = null;
  private anchor: LatLng | null = null;
  private lastTimestamp: number | null = null;
  private samples: Sample[] = [];
  private totalMeters = 0;

  constructor(config: Partial<TrackerConfig> = {}) {
    this.config = { ...DEFAULT_TRACKER_CONFIG, ...config };
  }

  reset(): void {
    this.ema = null;
    this.anchor = null;
    this.lastTimestamp = null;
    this.samples = [];
    this.totalMeters = 0;
  }

  get position(): LatLng | null {
    return this.ema;
  }

  get walkedMeters(): number {
    return this.totalMeters;
  }

  push(fix: PositionFix): TrackerResult {
    const { config } = this;

    if (!Number.isFinite(fix.lat) || !Number.isFinite(fix.lng)) {
      return this.result(false, "accuracy");
    }
    if (fix.accuracy <= 0 || fix.accuracy > config.maxAccuracyMeters) {
      return this.result(false, "accuracy");
    }

    const raw: LatLng = { lat: fix.lat, lng: fix.lng };

    if (this.ema === null || this.lastTimestamp === null) {
      this.ema = raw;
      this.anchor = raw;
      this.lastTimestamp = fix.timestamp;
      this.samples = [{ t: fix.timestamp, pos: raw }];
      return this.result(true);
    }

    const dt = (fix.timestamp - this.lastTimestamp) / 1000;

    if (dt <= 0) {
      return this.result(false, "too-soon");
    }

    // Långt gap (skärmen låst, appen pausad): bryt kedjan utan att creditera.
    if (dt > config.maxDtSeconds) {
      this.ema = raw;
      this.anchor = raw;
      this.lastTimestamp = fix.timestamp;
      this.samples = [{ t: fix.timestamp, pos: raw }];
      return this.result(true);
    }

    const jump = haversineMeters(this.ema, raw);
    if (jump / dt > config.maxPlausibleSpeed) {
      return this.result(false, "implausible-speed");
    }

    const alpha = 1 - Math.exp(-dt / config.smoothingTauSeconds);
    this.ema = lerpLatLng(this.ema, raw, alpha);
    this.lastTimestamp = fix.timestamp;
    this.samples.push({ t: fix.timestamp, pos: this.ema });

    const window = this.windowStats(fix.timestamp);
    const inMotion =
      window.speed >= config.minSpeed &&
      window.straightness >= config.minStraightness &&
      window.netDisplacement >= Math.max(fix.accuracy * config.minDisplacementFactor, config.minDisplacementMeters);

    let credited = 0;
    if (inMotion && this.anchor) {
      credited = haversineMeters(this.anchor, this.ema);
    }
    this.anchor = this.ema;
    this.totalMeters += credited;

    this.trimSamples(fix.timestamp);

    return {
      ...this.result(true),
      creditedMeters: credited,
      speed: window.speed,
      straightness: window.straightness,
      inMotion,
    };
  }

  private windowStats(now: number) {
    const cutoff = now - this.config.windowSeconds * 1000;
    const inWindow = this.samples.filter((s) => s.t >= cutoff);

    if (inWindow.length < 2) {
      return { speed: 0, straightness: 0, netDisplacement: 0, pathLength: 0 };
    }

    let pathLength = 0;
    for (let i = 1; i < inWindow.length; i++) {
      pathLength += haversineMeters(inWindow[i - 1].pos, inWindow[i].pos);
    }

    const duration = (inWindow[inWindow.length - 1].t - inWindow[0].t) / 1000;
    const netDisplacement = haversineMeters(inWindow[0].pos, inWindow[inWindow.length - 1].pos);
    const straightness = pathLength > 0.5 ? netDisplacement / pathLength : 0;
    const speed = duration > 0 ? netDisplacement / duration : 0;

    return { speed, straightness, netDisplacement, pathLength };
  }

  private trimSamples(now: number): void {
    const cutoff = now - this.config.windowSeconds * 1000;
    let index = 0;
    while (index < this.samples.length - 1 && this.samples[index].t < cutoff) {
      index++;
    }
    if (index > 0) {
      this.samples = this.samples.slice(index);
    }
  }

  private result(accepted: boolean, reason?: TrackerResult["reason"]): TrackerResult {
    return {
      accepted,
      reason,
      creditedMeters: 0,
      totalMeters: this.totalMeters,
      speed: 0,
      straightness: 0,
      inMotion: false,
      position: this.ema,
    };
  }
}
