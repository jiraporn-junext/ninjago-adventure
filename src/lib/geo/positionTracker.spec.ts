import { describe, expect, it } from "vitest";
import { destinationPoint, haversineMeters, type LatLng } from "./geoMath";
import { PositionTracker, type PositionFix } from "./positionTracker";

const START: LatLng = { lat: 59.259443, lng: 18.173173 };

/** Deterministisk PRNG så att jitter-testerna är reproducerbara. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function fixAt(pos: LatLng, accuracy: number, timestamp: number): PositionFix {
  return { lat: pos.lat, lng: pos.lng, accuracy, timestamp };
}

describe("haversineMeters", () => {
  it("mäter noll för samma punkt", () => {
    expect(haversineMeters(START, START)).toBe(0);
  });

  it("är symmetriskt", () => {
    const other = destinationPoint(START, 47, 500);
    expect(haversineMeters(START, other)).toBeCloseTo(haversineMeters(other, START), 6);
  });

  it("mäter kända avstånd korrekt", () => {
    const hundredMeters = destinationPoint(START, 0, 100);
    expect(haversineMeters(START, hundredMeters)).toBeCloseTo(100, 0);
  });

  it("ger ungefär 111 km per latitudgrad", () => {
    const oneDegree = { lat: START.lat + 1, lng: START.lng };
    expect(haversineMeters(START, oneDegree)).toBeGreaterThan(110_000);
    expect(haversineMeters(START, oneDegree)).toBeLessThan(112_000);
  });
});

describe("PositionTracker", () => {
  it("kastar bort fixar med dålig noggrannhet", () => {
    const tracker = new PositionTracker();
    const result = tracker.push(fixAt(START, 45, 1_000_000));
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("accuracy");
    expect(result.totalMeters).toBe(0);
  });

  it("kastar bort fixar utan accuracy-värde", () => {
    const tracker = new PositionTracker();
    const result = tracker.push(fixAt(START, 0, 1_000_000));
    expect(result.accepted).toBe(false);
  });

  it("räknar inte GPS-drift som promenad", () => {
    const tracker = new PositionTracker();
    const random = seededRandom(42);
    const accuracy = 10;
    let timestamp = 1_700_000_000_000;

    for (let i = 0; i < 60; i++) {
      timestamp += 1000;
      const angle = random() * 2 * Math.PI;
      const radius = random() * accuracy;
      const jittered = destinationPoint(START, (angle * 180) / Math.PI, radius);
      tracker.push(fixAt(jittered, accuracy, timestamp));
    }

    expect(tracker.walkedMeters).toBeLessThan(5);
  });

  it("räknar inte långsam drift som promenad", () => {
    const tracker = new PositionTracker();
    const accuracy = 10;
    let timestamp = 1_700_000_000_000;

    for (let i = 0; i < 60; i++) {
      timestamp += 1000;
      const moved = destinationPoint(START, 90, i * 0.3);
      tracker.push(fixAt(moved, accuracy, timestamp));
    }

    expect(tracker.walkedMeters).toBeLessThan(5);
  });

  it("räknar en rak promenad", () => {
    const tracker = new PositionTracker();
    const accuracy = 8;
    const speed = 1.4;
    let timestamp = 1_700_000_000_000;

    for (let i = 1; i <= 60; i++) {
      timestamp += 1000;
      const moved = destinationPoint(START, 90, i * speed);
      tracker.push(fixAt(moved, accuracy, timestamp));
    }

    expect(tracker.walkedMeters).toBeGreaterThan(60);
    expect(tracker.walkedMeters).toBeLessThan(95);
  });

  it("räknar en promenad i en kurva", () => {
    const tracker = new PositionTracker();
    const accuracy = 8;
    let timestamp = 1_700_000_000_000;

    for (let i = 1; i <= 60; i++) {
      timestamp += 1000;
      const bearing = (i * 6) % 360;
      const moved = destinationPoint(START, bearing, i * 1.2);
      tracker.push(fixAt(moved, accuracy, timestamp));
    }

    expect(tracker.walkedMeters).toBeGreaterThan(20);
  });

  it("avvisar ett hopp på 200 meter", () => {
    const tracker = new PositionTracker();
    let timestamp = 1_700_000_000_000;

    for (let i = 1; i <= 10; i++) {
      timestamp += 1000;
      tracker.push(fixAt(destinationPoint(START, 90, i * 1.4), 8, timestamp));
    }
    const before = tracker.walkedMeters;

    timestamp += 1000;
    const result = tracker.push(fixAt(destinationPoint(START, 90, 200), 8, timestamp));

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("implausible-speed");
    expect(tracker.walkedMeters).toBe(before);
  });

  it("avvisar en fix på 40 km/h", () => {
    const tracker = new PositionTracker();
    let timestamp = 1_700_000_000_000;

    timestamp += 1000;
    tracker.push(fixAt(START, 8, timestamp));

    timestamp += 1000;
    const result = tracker.push(fixAt(destinationPoint(START, 90, 11.2), 8, timestamp));

    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("implausible-speed");
  });

  it("bryter kedjan när appen varit pausad", () => {
    const tracker = new PositionTracker();
    let timestamp = 1_700_000_000_000;

    for (let i = 1; i <= 5; i++) {
      timestamp += 1000;
      tracker.push(fixAt(destinationPoint(START, 90, i * 1.4), 8, timestamp));
    }
    const before = tracker.walkedMeters;

    timestamp += 30_000;
    tracker.push(fixAt(destinationPoint(START, 90, 5 * 1.4 + 1.4), 8, timestamp));

    expect(tracker.walkedMeters - before).toBeLessThan(1);
  });
});
