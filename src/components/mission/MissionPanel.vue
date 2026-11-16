<script setup lang="ts">
import { computed } from "vue";
import NinjaFigure from "@/components/figures/NinjaFigure.vue";
import PhotoStep from "@/components/mission/PhotoStep.vue";
import QuizStep from "@/components/mission/QuizStep.vue";
import WalkStep from "@/components/mission/WalkStep.vue";
import { gameStore } from "@/stores/gameStore";
import type { Piece } from "@/types";

const props = defineProps<{
  piece: Piece;
}>();

const progress = computed(() => gameStore.progressFor(props.piece.id));
const owned = computed(() => gameStore.isOwned(props.piece.id));

function stepProgress(stepId: string) {
  return progress.value?.steps[stepId];
}
</script>

<template>
  <div class="mission">
      <header class="mission__header">
        <div class="mission__figure">
          <NinjaFigure :element="piece.element" :size="88" />
        </div>
        <div class="mission__intro">
          <h3 class="mission__name">{{ piece.name }}</h3>
          <p class="mission__blurb muted">{{ piece.blurb }}</p>
        </div>
      </header>

      <p v-if="owned" class="mission__owned">
        <strong>{{ piece.name }} är din!</strong> Gubben står i samlingen.
      </p>

      <ol v-else class="mission__steps">
        <li
          v-for="(step, index) in piece.steps"
          :key="step.id"
          class="mission__step"
          :class="{
            'mission__step--done': stepProgress(step.id)?.status === 'done',
            'mission__step--current': index === progress?.stepIndex,
          }"
        >
          <div class="mission__step-head">
            <span class="mission__step-index">
              {{ stepProgress(step.id)?.status === "done" ? "✓" : index + 1 }}
            </span>
            <span class="mission__step-title">
              <template v-if="step.kind === 'walk'">{{ step.label }}</template>
              <template v-else-if="step.kind === 'quiz'">
                Quiz: {{ step.questions.length }} frågor
              </template>
              <template v-else>Fota platsen</template>
            </span>
          </div>

          <div v-if="index === progress?.stepIndex && stepProgress(step.id)?.status !== 'done'" class="mission__step-body">
            <WalkStep
              v-if="step.kind === 'walk'"
              :step="step"
              :progress="stepProgress(step.id)"
            />
            <QuizStep
              v-else-if="step.kind === 'quiz'"
              :piece="piece"
              :step="step"
              :progress="stepProgress(step.id)"
            />
            <PhotoStep
              v-else
              :piece="piece"
              :step="step"
              :progress="stepProgress(step.id)"
            />
          </div>
        </li>
      </ol>
    </div>
</template>

<style scoped lang="scss">
.mission {
  display: flex;
  flex-direction: column;
  gap: 18px;

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__figure {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 100px;
    padding: 8px;
    border-radius: var(--radius);
    background: radial-gradient(circle at 50% 35%, rgb(244 96 54 / 22%), transparent 70%),
      var(--surface);
    border: 1px solid var(--border);
  }

  &__intro {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__name {
    font-size: 1.25rem;
  }

  &__blurb {
    font-size: 0.9rem;
    line-height: 1.45;
  }

  &__owned {
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    background: rgb(74 222 128 / 12%);
    border: 1px solid rgb(74 222 128 / 30%);
    line-height: 1.5;
  }

  &__steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__step {
    padding: 14px 16px;
    border-radius: var(--radius);
    background: var(--surface);
    border: 1px solid var(--border);

    &--current {
      border-color: var(--accent);
      background: var(--surface-raised);
    }

    &--done {
      opacity: 0.72;
    }
  }

  &__step-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__step-index {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 0.85rem;
    font-weight: 700;
  }

  &__step--done &__step-index {
    background: rgb(74 222 128 / 18%);
    color: var(--success);
  }

  &__step-title {
    font-weight: 600;
    font-size: 0.95rem;
  }

  &__step-body {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
  }
}
</style>
