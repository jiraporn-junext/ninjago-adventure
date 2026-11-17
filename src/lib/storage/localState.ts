import type { SaveState } from "@/types";

const STORAGE_KEY = "ninjago-adventure:v1:state";
const CORRUPT_KEY = "ninjago-adventure:v1:state.corrupt";

export const SAVE_VERSION = 2;

/** Migreringar från version N till N+1. Nyckeln är den version man migrerar från. */
const MIGRATIONS: Record<number, (state: Record<string, unknown>) => Record<string, unknown>> = {
  1: (state) => ({ ...state, version: 2, enemies: {} }),
};

export function createInitialState(): SaveState {
  return {
    version: SAVE_VERSION,
    pieces: {},
    enemies: {},
    totalWalkMeters: 0,
    updatedAt: Date.now(),
  };
}

function migrate(raw: Record<string, unknown>): SaveState {
  let state = raw;
  let version = typeof state.version === "number" ? state.version : 0;

  while (version < SAVE_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break;
    state = step(state);
    version = typeof state.version === "number" ? state.version : version + 1;
  }

  return {
    version: SAVE_VERSION,
    pieces: (state.pieces as SaveState["pieces"]) ?? {},
    enemies: (state.enemies as SaveState["enemies"]) ?? {},
    totalWalkMeters: (state.totalWalkMeters as number) ?? 0,
    updatedAt: (state.updatedAt as number) ?? Date.now(),
  };
}

export function loadState(): SaveState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.version === "number" && parsed.version > SAVE_VERSION) {
      // Sparfilen kommer från en nyare version: starta om hellre än att gå sönder.
      return createInitialState();
    }

    return migrate(parsed);
  } catch {
    try {
      window.localStorage.setItem(CORRUPT_KEY, window.localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      // Kan inte spara korrupt backup - fortsätt ändå med en ren start.
    }
    return createInitialState();
  }
}

export function saveState(state: SaveState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignoreras - spelet fungerar även utan lagring.
  }
}
