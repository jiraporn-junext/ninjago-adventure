export type Element = "eld" | "is" | "blixt" | "jord" | "vatten" | "vind" | "teknik" | "gravitation";

export interface QuizQuestion {
  id: string;
  q: string;
  options: string[];
  answer: number;
  fact: string;
}

export interface WalkStep {
  id: string;
  kind: "walk";
  meters: number;
  label: string;
}

export interface QuizStep {
  id: string;
  kind: "quiz";
  questions: QuizQuestion[];
}

export interface PhotoStep {
  id: string;
  kind: "photo";
  prompt: string;
}

export type MissionStep = WalkStep | QuizStep | PhotoStep;

export interface Piece {
  id: string;
  name: string;
  element: Element;
  lat: number;
  lng: number;
  locationName: string;
  blurb: string;
  steps: MissionStep[];
}

export type PieceStatus = "hidden" | "available" | "active" | "owned";

export interface StepProgress {
  status: "pending" | "done";
  /** Gått i det här steget, i meter. */
  walkMeters?: number;
  /** Global distansräknare när steget startade - skillnaden är gången. */
  walkBase?: number;
  /** Valda svar per fråge-id. */
  answers?: Record<string, number>;
  photoId?: string;
  completedAt?: number;
}

export interface PieceProgress {
  status: PieceStatus;
  stepIndex: number;
  steps: Record<string, StepProgress>;
  startedAt?: number;
  completedAt?: number;
}

export interface SaveState {
  version: number;
  pieces: Record<string, PieceProgress>;
  totalWalkMeters: number;
  updatedAt: number;
}
