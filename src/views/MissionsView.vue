<script setup lang="ts">
import { computed, ref } from "vue";
import MissionPanel from "@/components/mission/MissionPanel.vue";
import AppSheet from "@/components/ui/AppSheet.vue";
import NinjaFigure from "@/components/figures/NinjaFigure.vue";
import { gameStore } from "@/stores/gameStore";
import { geoStore } from "@/stores/geoStore";
import type { Piece } from "@/types";

const selected = ref<Piece | null>(null);

const missions = computed(() => gameStore.startedPieces.value);

function stepsDone(piece: Piece): number {
  const progress = gameStore.progressFor(piece.id);
  if (!progress) return 0;
  return piece.steps.filter((step) => progress.steps[step.id]?.status === "done").length;
}

function distanceLabel(piece: Piece): string {
  const distance = gameStore.distanceTo(piece, geoStore.position);
  if (distance === null) return "GPS avstängd";
  if (distance < 1000) return `${Math.round(distance)} m bort`;
  return `${(distance / 1000).toFixed(1)} km bort`;
}
</script>

<template>
  <div class="missions scroll-area">
    <h1 class="missions__title">Uppdrag</h1>

    <p v-if="missions.length === 0" class="missions__empty muted">
      Du har inga pågående uppdrag än. Hitta en ninjagubbe på kartan - den ligger nära en riktig
      plats i Älta.
    </p>

    <ul v-else class="missions__list">
      <li v-for="piece in missions" :key="piece.id">
        <button class="missions__item card" type="button" @click="selected = piece">
          <NinjaFigure :element="piece.element" :size="52" />
          <div class="missions__body">
            <p class="missions__name">{{ piece.locationName }}</p>
            <p class="missions__meta muted">
              {{ stepsDone(piece) }}/{{ piece.steps.length }} steg klara · {{ distanceLabel(piece) }}
            </p>
            <div class="missions__bar">
              <div
                class="missions__fill"
                :style="{ width: `${(stepsDone(piece) / piece.steps.length) * 100}%` }"
              />
            </div>
          </div>
        </button>
      </li>
    </ul>

    <AppSheet :open="selected !== null" :title="selected?.locationName ?? ''" @close="selected = null">
      <MissionPanel v-if="selected" :piece="selected" />
    </AppSheet>
  </div>
</template>

<style scoped lang="scss">
.missions {
  flex: 1;
  min-height: 0;
  padding: 18px 16px calc(24px + var(--safe-bottom));

  &__title {
    font-size: 1.4rem;
    margin-bottom: 16px;
  }

  &__empty {
    line-height: 1.55;
    padding: 12px 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    text-align: left;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-weight: 700;
  }

  &__meta {
    font-size: 0.8rem;
    margin: 2px 0 8px;
  }

  &__bar {
    height: 6px;
    border-radius: 999px;
    background: var(--bg);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 999px;
    background: var(--accent);
    transition: width 0.3s ease;
  }
}
</style>
