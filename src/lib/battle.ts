import type { Enemy } from "@/types";

/** Så här många felaktiga svar en ninja tål innan hon faller. */
export const NINJA_HP = 3;

export type BattleStatus = "fighting" | "won" | "lost";

export interface BattleState {
  /** Fiendens återstående hälsa. */
  enemyHp: number;
  /** Din ninjas återstående uthållighet. */
  ninjaHp: number;
  /** Index i fiendens frågelista. */
  questionIndex: number;
  status: BattleStatus;
}

export function startBattle(enemy: Enemy): BattleState {
  return {
    enemyHp: enemy.hp,
    ninjaHp: NINJA_HP,
    questionIndex: 0,
    status: "fighting",
  };
}

/**
 * Ett rätt svar ger fienden skada. Ett fel svar ger din ninja skada men
 * frågan står kvar, så du kan försöka igen - men varje försök kostar en
 * träff. Frågan byts först när spelaren går vidare till nästa.
 */
export function applyAnswer(
  state: BattleState,
  correct: boolean,
  strength: number,
): BattleState {
  if (state.status !== "fighting") return state;

  if (correct) {
    const enemyHp = Math.max(0, state.enemyHp - strength);
    return {
      ...state,
      enemyHp,
      status: enemyHp === 0 ? "won" : "fighting",
    };
  }

  const ninjaHp = Math.max(0, state.ninjaHp - 1);
  return {
    ...state,
    ninjaHp,
    status: ninjaHp === 0 ? "lost" : "fighting",
  };
}

/** Hur många frågor fienden behöver för att besegra en ninja med styrkan. */
export function questionsNeeded(enemy: Enemy, strength: number): number {
  return Math.ceil(enemy.hp / Math.max(1, strength));
}
