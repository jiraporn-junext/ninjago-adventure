<script setup lang="ts">
import { computed } from "vue";
import type { StepProgress, WalkStep as WalkStepType } from "@/types";

const props = defineProps<{
  step: WalkStepType;
  progress: StepProgress | undefined;
}>();

const walked = computed(() => props.progress?.walkMeters ?? 0);
const ratio = computed(() => Math.min(1, walked.value / props.step.meters));
const done = computed(() => props.progress?.status === "done");
</script>

<template>
  <div class="walk-step" :class="{ 'walk-step--done': done }">
    <div class="walk-step__head">
      <span class="walk-step__icon">👣</span>
      <p class="walk-step__count">
        <strong>{{ Math.round(walked) }}</strong> / {{ step.meters }} meter gånga
      </p>
    </div>

    <div class="walk-step__bar">
      <div class="walk-step__fill" :style="{ width: `${ratio * 100}%` }" />
    </div>

    <p class="walk-step__hint muted">
      {{
        done
          ? "Klart! Gubben är ett steg närmare."
          : "Räknaren går bara när du faktiskt går. Står du still räknas det inte."
      }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.walk-step {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &--done {
    .walk-step__icon {
      filter: grayscale(1) brightness(1.4);
    }
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    font-size: 1.6rem;
  }

  &__label {
    font-weight: 600;
  }

  &__count {
    color: var(--text-muted);
    font-size: 0.9rem;

    strong {
      color: var(--accent);
      font-size: 1.15rem;
    }
  }

  &__bar {
    height: 10px;
    border-radius: 999px;
    background: var(--surface);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, var(--accent), var(--gold));
    transition: width 0.4s ease;
  }

  &__hint {
    font-size: 0.82rem;
  }
}
</style>
