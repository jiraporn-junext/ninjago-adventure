import { describe, expect, it } from "vitest";
import { ENEMIES } from "@/data/enemies";
import type { Enemy } from "@/types";
import { applyAnswer, NINJA_HP, questionsNeeded, startBattle } from "./battle";

const ENEMY: Enemy = {
  id: "testfiende",
  name: "Testfiende",
  kind: "golem",
  element: "vatten",
  weakness: "eld",
  lat: 59.25,
  lng: 18.16,
  locationName: "Testplatsen",
  blurb: "En fiende att testa strider mot.",
  hp: 2,
  minNinjas: 1,
  questions: [],
};

describe("startBattle", () => {
  it("startar med fiendens hälsa och full uthållighet", () => {
    const state = startBattle(ENEMY);

    expect(state.enemyHp).toBe(2);
    expect(state.ninjaHp).toBe(NINJA_HP);
    expect(state.questionIndex).toBe(0);
    expect(state.status).toBe("fighting");
  });
});

describe("applyAnswer", () => {
  it("ett rätt svar skadar fienden", () => {
    const state = applyAnswer(startBattle(ENEMY), true, 1);

    expect(state.enemyHp).toBe(1);
    expect(state.ninjaHp).toBe(NINJA_HP);
    expect(state.status).toBe("fighting");
  });

  it("styrkan avgör hur mycket skada du ger", () => {
    const state = applyAnswer(startBattle(ENEMY), true, 2);

    expect(state.enemyHp).toBe(0);
    expect(state.status).toBe("won");
  });

  it("ett fel svar skadar din ninja men frågan står kvar", () => {
    const state = applyAnswer(startBattle(ENEMY), false, 1);

    expect(state.ninjaHp).toBe(NINJA_HP - 1);
    expect(state.enemyHp).toBe(2);
    expect(state.questionIndex).toBe(0);
    expect(state.status).toBe("fighting");
  });

  it("ninjan faller efter tre felaktiga svar", () => {
    let state = startBattle(ENEMY);
    state = applyAnswer(state, false, 1);
    state = applyAnswer(state, false, 1);
    state = applyAnswer(state, false, 1);

    expect(state.ninjaHp).toBe(0);
    expect(state.status).toBe("lost");
  });

  it("en avslutad strid går inte att ändra", () => {
    const won = applyAnswer(startBattle(ENEMY), true, 2);
    const after = applyAnswer(won, false, 1);

    expect(after).toBe(won);
  });
});

describe("questionsNeeded", () => {
  it("räknar ut hur många rätta svar som krävs", () => {
    expect(questionsNeeded(ENEMY, 1)).toBe(2);
    expect(questionsNeeded(ENEMY, 2)).toBe(1);
  });
});

describe("fienderna", () => {
  it("har tillräckligt med frågor för en strid som går utför", () => {
    for (const enemy of ENEMIES) {
      expect(enemy.questions.length).toBeGreaterThanOrEqual(questionsNeeded(enemy, 1));
    }
  });

  it("har unika fråge-id", () => {
    for (const enemy of ENEMIES) {
      const ids = enemy.questions.map((question) => question.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("kräver fler ninjagubbar ju starkare fienden är", () => {
    for (const enemy of ENEMIES) {
      expect(enemy.minNinjas).toBeGreaterThanOrEqual(1);
      expect(enemy.hp).toBeGreaterThanOrEqual(2);
    }
  });
});
