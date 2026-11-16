import { computed, reactive, readonly } from "vue";
import { PIECES, PIECES_BY_ID } from "@/data/pieces";
import { createInitialState, loadState, saveState } from "@/lib/storage/localState";
import type { Piece, PieceProgress, SaveState, StepProgress } from "@/types";
import { haversineMeters, type LatLng } from "@/lib/geo/geoMath";

/** Så här nära måste du vara för att ett uppdrag ska gå att starta. */
export const START_RADIUS_M = 40;
/** Så här nära måste du vara för att platsen ska synas som en ? på kartan. */
export const REVEAL_RADIUS_M = 250;

const state = reactive<SaveState>(createInitialState());
const storageFull = reactive({ warning: false });

let persistTimer: ReturnType<typeof setTimeout> | undefined;

function persist(): void {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(flush, 400);
}

/** Skriver direkt - används när appen kan bli avslutad utan förvarning. */
function flush(): void {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = undefined;
  }
  state.updatedAt = Date.now();
  if (!saveState(state)) {
    storageFull.warning = true;
  }
}

function ensurePieceProgress(pieceId: string): PieceProgress {
  let progress = state.pieces[pieceId];
  if (!progress) {
    progress = reactive({
      status: "hidden",
      stepIndex: 0,
      steps: {},
    }) as PieceProgress;
    state.pieces[pieceId] = progress;
  }
  return progress;
}

function ensureStepProgress(piece: Piece, stepId: string): StepProgress {
  const progress = ensurePieceProgress(piece.id);
  let step = progress.steps[stepId];
  if (!step) {
    step = reactive({ status: "pending", answers: {} }) as StepProgress;
    progress.steps[stepId] = step;
  }
  return step;
}

function initializeStep(piece: Piece, stepId: string): void {
  const pieceProgress = ensurePieceProgress(piece.id);
  const step = piece.steps.find((candidate) => candidate.id === stepId);
  if (!step) return;

  const stepProgress = ensureStepProgress(piece, stepId);
  if (step.kind === "walk" && stepProgress.walkBase === undefined) {
    stepProgress.walkBase = state.totalWalkMeters;
    stepProgress.walkMeters = 0;
  }
  pieceProgress.stepIndex = piece.steps.indexOf(step);
}

function advanceIfComplete(piece: Piece): void {
  const pieceProgress = ensurePieceProgress(piece.id);
  const steps = piece.steps;
  const allDone = steps.every((step) => pieceProgress.steps[step.id]?.status === "done");

  if (allDone) {
    pieceProgress.status = "owned";
    pieceProgress.completedAt = Date.now();
    return;
  }

  const nextIndex = steps.findIndex((step) => pieceProgress.steps[step.id]?.status !== "done");
  if (nextIndex !== -1 && nextIndex !== pieceProgress.stepIndex) {
    pieceProgress.stepIndex = nextIndex;
    initializeStep(piece, steps[nextIndex].id);
  }
}

export const gameStore = {
  state: readonly(state),
  storageFull: readonly(storageFull),

  ownedPieces: computed(() =>
    PIECES.filter((piece) => state.pieces[piece.id]?.status === "owned"),
  ),

  startedPieces: computed(() =>
    PIECES.filter((piece) => {
      const status = state.pieces[piece.id]?.status;
      return status === "available" || status === "active";
    }),
  ),

  activePiece: computed(() =>
    PIECES.find((piece) => state.pieces[piece.id]?.status === "active"),
  ),

  initialize(): void {
    const loaded = loadState();
    state.pieces = loaded.pieces;
    state.totalWalkMeters = loaded.totalWalkMeters;
    state.updatedAt = loaded.updatedAt;
  },

  flush,

  progressFor(pieceId: string): PieceProgress | undefined {
    return state.pieces[pieceId];
  },

  isOwned(pieceId: string): boolean {
    return state.pieces[pieceId]?.status === "owned";
  },

  distanceTo(piece: Piece, position: LatLng | null): number | null {
    if (!position) return null;
    return haversineMeters(position, { lat: piece.lat, lng: piece.lng });
  },

  /** Markera platser som du står på, så att de syns i uppgiftslistan. */
  revealNearby(position: LatLng | null): void {
    if (!position) return;

    for (const piece of PIECES) {
      const progress = state.pieces[piece.id];
      if (progress && progress.status !== "hidden") continue;

      const distance = this.distanceTo(piece, position);
      if (distance !== null && distance <= START_RADIUS_M) {
        ensurePieceProgress(piece.id).status = "available";
        persist();
      }
    }
  },

  startMission(pieceId: string): boolean {
    const piece = PIECES_BY_ID[pieceId];
    if (!piece) return false;

    const progress = ensurePieceProgress(pieceId);
    if (progress.status === "owned") return false;

    if (progress.status === "hidden") progress.status = "available";
    progress.status = "active";
    progress.startedAt ??= Date.now();

    initializeStep(piece, piece.steps[progress.stepIndex]?.id ?? piece.steps[0].id);
    persist();
    return true;
  },

  answerQuiz(pieceId: string, stepId: string, questionId: string, answerIndex: number): void {
    const piece = PIECES_BY_ID[pieceId];
    if (!piece) return;

    const stepProgress = ensureStepProgress(piece, stepId);
    stepProgress.answers = { ...(stepProgress.answers ?? {}), [questionId]: answerIndex };
    persist();
  },

  completeStep(pieceId: string, stepId: string): void {
    const piece = PIECES_BY_ID[pieceId];
    if (!piece) return;

    const stepProgress = ensureStepProgress(piece, stepId);
    stepProgress.status = "done";
    stepProgress.completedAt = Date.now();

    advanceIfComplete(piece);
    persist();
  },

  /** Foton som sparats i IndexedDB kopplas till steget härifrån. */
  attachPhoto(pieceId: string, stepId: string, photoId: string): void {
    const piece = PIECES_BY_ID[pieceId];
    if (!piece) return;

    const stepProgress = ensureStepProgress(piece, stepId);
    stepProgress.photoId = photoId;
    stepProgress.status = "done";
    stepProgress.completedAt = Date.now();

    advanceIfComplete(piece);
    persist();
  },

  addWalkMeters(meters: number): void {
    if (meters <= 0) return;

    state.totalWalkMeters += meters;

    for (const piece of PIECES) {
      const pieceProgress = state.pieces[piece.id];
      if (pieceProgress?.status !== "active") continue;

      const step = piece.steps[pieceProgress.stepIndex];
      if (!step || step.kind !== "walk") continue;

      const stepProgress = pieceProgress.steps[step.id];
      if (!stepProgress || stepProgress.status === "done") continue;

      stepProgress.walkMeters = Math.max(0, state.totalWalkMeters - (stepProgress.walkBase ?? 0));
      if (stepProgress.walkMeters >= step.meters) {
        stepProgress.status = "done";
        stepProgress.completedAt = Date.now();
        advanceIfComplete(piece);
      }
    }

    persist();
  },

  reset(): void {
    state.pieces = {};
    state.totalWalkMeters = 0;
    storageFull.warning = false;
    persist();
  },

  exportSave(): string {
    return JSON.stringify(state, null, 2);
  },

  importSave(json: string): boolean {
    try {
      const parsed = JSON.parse(json.replace(/^﻿/, "")) as Partial<SaveState>;
      if (!parsed || typeof parsed !== "object" || !parsed.pieces) return false;

      state.pieces = parsed.pieces as SaveState["pieces"];
      state.totalWalkMeters = parsed.totalWalkMeters ?? 0;
      state.updatedAt = Date.now();
      persist();
      return true;
    } catch {
      return false;
    }
  },
};
