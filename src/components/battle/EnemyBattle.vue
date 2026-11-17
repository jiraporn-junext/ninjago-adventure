<script setup lang="ts">
import { computed, ref } from "vue";
import EnemyFigure from "@/components/figures/EnemyFigure.vue";
import NinjaFigure from "@/components/figures/NinjaFigure.vue";
import { PIECES } from "@/data/pieces";
import { ninjaElementLabel } from "@/data/themes";
import { gameStore, START_RADIUS_M } from "@/stores/gameStore";
import { geoStore } from "@/stores/geoStore";
import { applyAnswer, startBattle, type BattleState } from "@/lib/battle";
import type { Enemy, Piece } from "@/types";

const props = defineProps<{
  enemy: Enemy;
}>();

const emit = defineEmits<{ (event: "close"): void }>();

type Phase = "prep" | "fight" | "won" | "lost";

const phase = ref<Phase>("prep");
const fighter = ref<Piece | null>(null);
const battle = ref<BattleState | null>(null);
const selected = ref<number | null>(null);
const feedback = ref<"correct" | "wrong" | null>(null);

const defeated = computed(() => gameStore.isEnemyDefeated(props.enemy.id));
const ownedCount = computed(() => gameStore.ownedPieces.value.length);
const candidates = computed(() => gameStore.ninjasWithElement(props.enemy.weakness));
const missing = computed(() =>
  PIECES.filter(
    (piece) => piece.element === props.enemy.weakness && !gameStore.isOwned(piece.id),
  ),
);
const missingHint = computed(() =>
  missing.value.map((piece) => `${piece.locationName} (${piece.name})`).join(", "),
);

const distance = computed(() => gameStore.distanceTo(props.enemy, geoStore.position));
const tooFar = computed(() => distance.value === null || distance.value > START_RADIUS_M);
const hasTeam = computed(() => ownedCount.value >= props.enemy.minNinjas);
const hasFighter = computed(() => candidates.value.length > 0);

const question = computed(() => {
  if (!battle.value) return null;
  return props.enemy.questions[battle.value.questionIndex] ?? null;
});
const hp = computed(() => ({
  enemy: battle.value?.enemyHp ?? 0,
  ninja: battle.value?.ninjaHp ?? 0,
}));
const strength = computed(() =>
  fighter.value ? gameStore.ninjaStrength(fighter.value.id) : 1,
);

function startFight(piece: Piece): void {
  fighter.value = piece;
  battle.value = startBattle(props.enemy);
  selected.value = null;
  feedback.value = null;
  phase.value = "fight";
}

function choose(index: number): void {
  if (!battle.value || !question.value || feedback.value === "correct") return;

  selected.value = index;

  if (index === question.value.answer) {
    feedback.value = "correct";
    battle.value = applyAnswer(battle.value, true, strength.value);

    if (battle.value.status === "won" && fighter.value) {
      gameStore.defeatEnemy(props.enemy.id, fighter.value.id);
      phase.value = "won";
    }
    return;
  }

  feedback.value = "wrong";
  battle.value = applyAnswer(battle.value, false, strength.value);

  if (battle.value.status === "lost") phase.value = "lost";
}

/** Efter ett rätt svar går nästa fråga fram. */
function nextQuestion(): void {
  if (!battle.value) return;
  battle.value = { ...battle.value, questionIndex: battle.value.questionIndex + 1 };
  selected.value = null;
  feedback.value = null;
}

function retry(): void {
  if (!fighter.value) return;
  battle.value = startBattle(props.enemy);
  selected.value = null;
  feedback.value = null;
  phase.value = "fight";
}

function formatDistance(meters: number | null): string {
  if (meters === null) return "okänt avstånd";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
</script>

<template>
  <div class="battle">
    <template v-if="phase === 'prep'">
      <div class="battle__figure">
        <EnemyFigure :kind="enemy.kind" :element="enemy.element" :name="enemy.name" :size="96" />
      </div>

      <h3 class="battle__name">{{ enemy.name }}</h3>
      <p class="battle__blurb muted">{{ enemy.blurb }}</p>

      <div v-if="defeated" class="battle__result battle__result--won">
        <strong>{{ enemy.name }} är besegrad!</strong> Fienden ligger kvar på kartan med ett
        kryss över sig.
      </div>

      <template v-else>
        <div class="battle__stats">
          <span class="battle__hearts battle__hearts--enemy">
            <span v-for="n in enemy.hp" :key="n">♥</span>
          </span>
          <span class="muted">Fiendens hälsa - den svarar rätt på {{ enemy.hp }} frågor</span>
        </div>

        <p class="battle__weakness">
          <strong>Fienden är svag mot {{ ninjaElementLabel(enemy.weakness) }}.</strong>
          Fighta med en ninja som har det elementet, så träffar du hårt.
        </p>

        <ul class="battle__requirements">
          <li :class="{ 'is-ok': hasTeam }">
            <span class="battle__check">{{ hasTeam ? "✓" : "✗" }}</span>
            <span>
              <template v-if="enemy.minNinjas === 1">Minst en ninjagubbe</template>
              <template v-else>Minst {{ enemy.minNinjas }} ninjagubbar</template>
              i samlingen
              <span class="muted">(du har {{ ownedCount }})</span>
            </span>
          </li>
          <li :class="{ 'is-ok': hasFighter }">
            <span class="battle__check">{{ hasFighter ? "✓" : "✗" }}</span>
            <span>
              En {{ ninjaElementLabel(enemy.weakness) }} att fighta med
              <span class="muted">(du har {{ candidates.length }})</span>
            </span>
          </li>
          <li :class="{ 'is-ok': !tooFar }">
            <span class="battle__check">{{ tooFar ? "✗" : "✓" }}</span>
            <span>
              Du måste stå vid fienden
              <span class="muted">({{ formatDistance(distance) }} bort)</span>
            </span>
          </li>
        </ul>

        <p v-if="missing.length" class="battle__hint muted">
          Du hittar en {{ ninjaElementLabel(enemy.weakness) }} på {{ missingHint }}.
        </p>

        <div v-if="candidates.length" class="battle__fighters">
          <p class="battle__fighters-title">Välj din ninja:</p>
          <ul class="battle__fighters-list">
            <li v-for="piece in candidates" :key="piece.id">
              <button class="battle__fighter" type="button" @click="startFight(piece)">
                <NinjaFigure :element="piece.element" :size="48" />
                <span class="battle__fighter-text">
                  <strong>{{ piece.name }}</strong>
                  <span class="muted">
                    {{ ninjaElementLabel(piece.element) }} · styrka
                    {{ gameStore.ninjaStrength(piece.id) }}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </div>
      </template>
    </template>

    <template v-else-if="phase === 'fight'">
      <div class="battle__duel">
        <div class="battle__side">
          <EnemyFigure :kind="enemy.kind" :element="enemy.element" :name="enemy.name" :size="72" />
          <span class="battle__hearts battle__hearts--enemy">
            <span v-for="n in hp.enemy" :key="n">♥</span>
          </span>
        </div>

        <span class="battle__vs">mot</span>

        <div class="battle__side">
          <NinjaFigure v-if="fighter" :element="fighter.element" :size="72" />
          <span class="battle__hearts battle__hearts--ninja">
            <span v-for="n in hp.ninja" :key="n">♥</span>
          </span>
        </div>
      </div>

      <template v-if="question">
        <p class="battle__meta muted">
          Fråga {{ (battle?.questionIndex ?? 0) + 1 }} av {{ enemy.questions.length }} ·
          {{ fighter?.name }} (styrka {{ strength }})
        </p>

        <h3 class="battle__question">{{ question.q }}</h3>

        <ul class="battle__options">
          <li v-for="(option, index) in question.options" :key="option">
            <button
              class="battle__option"
              :class="{
                'battle__option--right': feedback === 'correct' && index === question.answer,
                'battle__option--wrong': feedback === 'wrong' && index === selected,
                'battle__option--dim': feedback === 'correct' && index !== question.answer,
              }"
              type="button"
              :disabled="feedback === 'correct'"
              @click="choose(index)"
            >
              {{ option }}
            </button>
          </li>
        </ul>

        <p v-if="feedback === 'correct'" class="battle__feedback battle__feedback--right">
          <strong>Träff!</strong> {{ question.fact }}
        </p>
        <p v-else-if="feedback === 'wrong'" class="battle__feedback battle__feedback--wrong">
          Fienden träffar din ninja - du har {{ hp.ninja }} hjärtskärvor kvar. Försök igen!
        </p>

        <button
          v-if="feedback === 'correct'"
          class="button button--primary button--block"
          type="button"
          @click="nextQuestion"
        >
          Nästa fråga
        </button>
      </template>
    </template>

    <template v-else-if="phase === 'won'">
      <div class="battle__result battle__result--won">
        <strong>{{ enemy.name }} är besegrad!</strong>
        <p v-if="fighter">
          {{ fighter.name }} blev starkare - styrka {{ strength }}. En starkare ninja träffar
          hårdare nästa gång.
        </p>
      </div>

      <div class="battle__trophy">
        <EnemyFigure :kind="enemy.kind" :element="enemy.element" :name="enemy.name" :size="72" />
        <span class="battle__trophy-badge">✓</span>
      </div>

      <button class="button button--primary button--block" type="button" @click="emit('close')">
        Stäng
      </button>
    </template>

    <template v-else>
      <div class="battle__result battle__result--lost">
        <strong>Din ninja föll.</strong>
        <p>
          Fienden är kvar och du kan försöka igen. En ninja som gissar förlorar - läs frågan
          och ta den säkert.
        </p>
      </div>

      <button class="button button--primary button--block" type="button" @click="retry">
        Försök igen
      </button>
    </template>
  </div>
</template>

<style scoped lang="scss">
.battle {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__figure {
    display: grid;
    place-items: center;
    width: 120px;
    padding: 10px;
    border-radius: var(--radius);
    background: radial-gradient(circle at 50% 35%, rgb(248 113 113 / 22%), transparent 70%),
      var(--surface);
    border: 1px solid var(--border);
  }

  &__name {
    font-size: 1.3rem;
    text-align: center;
  }

  &__blurb {
    font-size: 0.9rem;
    line-height: 1.45;
    text-align: center;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.85rem;
  }

  &__hearts {
    display: inline-flex;
    gap: 2px;
    font-size: 1.2rem;
    line-height: 1;

    &--enemy {
      color: var(--danger);
    }

    &--ninja {
      color: var(--accent);
    }
  }

  &__weakness {
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: var(--accent-soft);
    border: 1px solid rgb(244 96 54 / 30%);
    font-size: 0.9rem;
    line-height: 1.45;
  }

  &__requirements {
    display: flex;
    flex-direction: column;
    gap: 8px;

    li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      background: var(--surface);
      border: 1px solid var(--border);
      font-size: 0.88rem;
      line-height: 1.4;
    }

    .is-ok {
      border-color: rgb(74 222 128 / 35%);
    }
  }

  &__check {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border-radius: 50%;
    background: rgb(248 113 113 / 18%);
    color: var(--danger);
    font-size: 0.78rem;
    font-weight: 700;
  }

  .is-ok &__check {
    background: rgb(74 222 128 / 18%);
    color: var(--success);
  }

  &__hint {
    font-size: 0.85rem;
    line-height: 1.45;
  }

  &__fighters-title {
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 8px;
  }

  &__fighters-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__fighter {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--border);
    text-align: left;

    &:active {
      transform: scale(0.985);
    }
  }

  &__fighter-text {
    display: flex;
    flex-direction: column;
    font-size: 0.88rem;
  }

  &__duel {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 12px 0;
    border-radius: var(--radius);
    background: var(--surface);
    border: 1px solid var(--border);
  }

  &__side {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  &__vs {
    font-size: 0.8rem;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__meta {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__question {
    font-size: 1.12rem;
    line-height: 1.35;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__option {
    width: 100%;
    text-align: left;
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--border);
    font-weight: 500;
    transition: border-color 0.15s ease, background 0.15s ease, transform 0.1s ease;

    &:active {
      transform: scale(0.985);
    }

    &--right {
      border-color: var(--success);
      background: rgb(74 222 128 / 14%);
    }

    &--wrong {
      border-color: var(--danger);
      background: rgb(248 113 113 / 14%);
    }

    &--dim {
      opacity: 0.45;
    }
  }

  &__feedback {
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
    line-height: 1.45;

    &--right {
      background: rgb(74 222 128 / 10%);
      border: 1px solid rgb(74 222 128 / 28%);

      strong {
        color: var(--success);
      }
    }

    &--wrong {
      background: rgb(248 113 113 / 10%);
      border: 1px solid rgb(248 113 113 / 28%);
      color: var(--danger);
    }
  }

  &__result {
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    font-size: 0.92rem;
    line-height: 1.5;

    p {
      margin-top: 6px;
    }

    &--won {
      background: rgb(74 222 128 / 12%);
      border: 1px solid rgb(74 222 128 / 30%);
    }

    &--lost {
      background: rgb(248 113 113 / 12%);
      border: 1px solid rgb(248 113 113 / 30%);
    }
  }

  &__trophy {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    opacity: 0.6;
  }

  &__trophy-badge {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--success);
    color: #052e16;
    font-size: 1rem;
    font-weight: 700;
  }
}
</style>
