<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { gameStore } from "@/stores/gameStore";
import type { Piece, QuizStep as QuizStepType, StepProgress } from "@/types";

const props = defineProps<{
  piece: Piece;
  step: QuizStepType;
  progress: StepProgress | undefined;
}>();

const currentIndex = ref(0);
const selected = ref<number | null>(null);
const correct = ref(false);
const wrong = ref(false);

const question = computed(() => props.step.questions[currentIndex.value]);
const total = computed(() => props.step.questions.length);
const isLastQuestion = computed(() => currentIndex.value === total.value - 1);

function restore(): void {
  const answers = props.progress?.answers ?? {};

  let index = 0;
  for (const candidate of props.step.questions) {
    if (answers[candidate.id] !== candidate.answer) break;
    index++;
  }

  currentIndex.value = index;
  wrong.value = false;

  if (index >= props.step.questions.length) {
    selected.value = null;
    correct.value = true;
    gameStore.completeStep(props.piece.id, props.step.id);
    return;
  }

  const stored = answers[question.value.id];
  selected.value = stored ?? null;
  correct.value = stored === question.value.answer;
}

// Återställning sker bara när steget öppnas - inte när spelet svarar,
// annars hoppar frågan vid så fort ett rätt svar registreras.
onMounted(restore);
watch(() => props.step.id, restore);

function choose(index: number): void {
  if (correct.value) return;

  selected.value = index;
  const isRight = index === question.value.answer;
  correct.value = isRight;
  wrong.value = !isRight;

  gameStore.answerQuiz(props.piece.id, props.step.id, question.value.id, index);
}

function next(): void {
  if (!correct.value) return;

  if (isLastQuestion.value) {
    gameStore.completeStep(props.piece.id, props.step.id);
    return;
  }

  currentIndex.value++;
  selected.value = null;
  correct.value = false;
  wrong.value = false;
}
</script>

<template>
  <div class="quiz-step">
    <div class="quiz-step__meta muted">
      Fråga {{ currentIndex + 1 }} av {{ total }}
    </div>

    <h3 class="quiz-step__question">{{ question.q }}</h3>

    <ul class="quiz-step__options">
      <li v-for="(option, index) in question.options" :key="option">
        <button
          class="quiz-step__option"
          :class="{
            'quiz-step__option--right': correct && index === question.answer,
            'quiz-step__option--wrong': wrong && index === selected,
            'quiz-step__option--dim': correct && index !== question.answer,
          }"
          type="button"
          :disabled="correct"
          @click="choose(index)"
        >
          {{ option }}
        </button>
      </li>
    </ul>

    <p v-if="correct" class="quiz-step__fact">
      <strong>Rätt!</strong> {{ question.fact }}
    </p>
    <p v-else-if="wrong" class="quiz-step__wrong">Nästan - prova igen.</p>

    <button v-if="correct" class="button button--primary button--block" type="button" @click="next">
      {{ isLastQuestion ? "Klart" : "Nästa fråga" }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.quiz-step {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__meta {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__question {
    font-size: 1.15rem;
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
      animation: quiz-shake 0.35s ease;
    }

    &--dim {
      opacity: 0.45;
    }
  }

  &__fact {
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: rgb(74 222 128 / 10%);
    border: 1px solid rgb(74 222 128 / 28%);
    font-size: 0.9rem;
    line-height: 1.45;

    strong {
      color: var(--success);
    }
  }

  &__wrong {
    color: var(--danger);
    font-size: 0.9rem;
  }
}

@keyframes quiz-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  75% {
    transform: translateX(5px);
  }
}
</style>
