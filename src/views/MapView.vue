<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import GameMap from "@/components/map/GameMap.vue";
import MissionPanel from "@/components/mission/MissionPanel.vue";
import EnemyBattle from "@/components/battle/EnemyBattle.vue";
import AppSheet from "@/components/ui/AppSheet.vue";
import NinjaFigure from "@/components/figures/NinjaFigure.vue";
import { ENEMIES_BY_ID } from "@/data/enemies";
import { PIECES_BY_ID } from "@/data/pieces";
import { gameStore, START_RADIUS_M } from "@/stores/gameStore";
import { geoStore } from "@/stores/geoStore";
import { useGeolocation } from "@/lib/geo/useGeolocation";
import { releaseWakeLock, requestWakeLock } from "@/lib/wakeLock";
import type { Enemy, Piece } from "@/types";

const { start } = useGeolocation();

const sheetPiece = ref<Piece | null>(null);
const sheetEnemy = ref<Enemy | null>(null);
const wakeLockDenied = ref(false);

const sheetOpen = computed(() => sheetPiece.value !== null);
const sheetProgress = computed(() =>
  sheetPiece.value ? gameStore.progressFor(sheetPiece.value.id) : undefined,
);
const sheetOwned = computed(() =>
  sheetPiece.value ? gameStore.isOwned(sheetPiece.value.id) : false,
);
const sheetActive = computed(() => sheetProgress.value?.status === "active");
const sheetDistance = computed(() =>
  sheetPiece.value ? gameStore.distanceTo(sheetPiece.value, geoStore.position) : null,
);
const canStart = computed(
  () => sheetDistance.value !== null && sheetDistance.value <= START_RADIUS_M,
);

const activeMission = computed(() => gameStore.activePiece.value);

const activeMissionLabel = computed(() => {
  const mission = activeMission.value;
  if (!mission) return "";

  const step = mission.steps[mission.steps.length - 1];
  if (!step) return "";
  if (step.kind === "walk") return step.label;
  if (step.kind === "quiz") return `Quiz med ${step.questions.length} frågor`;
  return step.prompt;
});

function openPiece(pieceId: string): void {
  const piece = PIECES_BY_ID[pieceId];
  if (piece) sheetPiece.value = piece;
}

function closeSheet(): void {
  sheetPiece.value = null;
}

function openEnemy(enemyId: string): void {
  const enemy = ENEMIES_BY_ID[enemyId];
  if (enemy) sheetEnemy.value = enemy;
}

function closeEnemySheet(): void {
  sheetEnemy.value = null;
}

function startMission(): void {
  if (!sheetPiece.value || !canStart.value) return;
  gameStore.startMission(sheetPiece.value.id);
}

function formatDistance(meters: number | null): string {
  if (meters === null) return "okänt avstånd";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function activateGps(): void {
  start();
}

watch(
  () => activeMission.value?.id,
  async (pieceId) => {
    if (pieceId) {
      const held = await requestWakeLock();
      wakeLockDenied.value = !held;
    } else {
      releaseWakeLock();
      wakeLockDenied.value = false;
    }
  },
);

onMounted(() => {
  if (geoStore.permission === "granted" && !geoStore.watching) {
    start();
  }
});

onBeforeUnmount(() => {
  releaseWakeLock();
});
</script>

<template>
  <div class="map-view">
    <GameMap @select-piece="openPiece" @select-enemy="openEnemy" />

    <div v-if="!geoStore.watching" class="map-view__gps card">
      <div class="map-view__gps-text">
        <strong>Aktivera GPS</strong>
        <p class="muted">
          {{
            geoStore.error ??
            "Spelet behöver din plats för att veta var du är och hur långt du gått."
          }}
        </p>
      </div>
      <button class="button button--primary" type="button" @click="activateGps">Starta</button>
    </div>

    <div v-if="wakeLockDenied" class="map-view__wakelock">
      Håll skärmen tänd under promenaden - annars pausas spelet.
    </div>

    <button
      v-if="activeMission"
      class="map-view__mission card"
      type="button"
      @click="openPiece(activeMission.id)"
    >
      <NinjaFigure :element="activeMission.element" :size="44" />
      <div class="map-view__mission-text">
        <p class="map-view__mission-title">{{ activeMission.locationName }}</p>
        <p class="map-view__mission-sub muted">
          {{ activeMissionLabel }}
        </p>
      </div>
      <span class="map-view__mission-arrow">›</span>
    </button>

    <AppSheet :open="sheetOpen" :title="sheetPiece?.locationName ?? ''" @close="closeSheet">
      <template v-if="sheetPiece">
        <MissionPanel v-if="sheetOwned || sheetActive" :piece="sheetPiece" />

        <div v-else class="preview">
          <div class="preview__figure">
            <NinjaFigure :element="sheetPiece.element" :size="96" />
          </div>

          <h3 class="preview__name">{{ sheetPiece.name }}</h3>
          <p class="preview__blurb muted">{{ sheetPiece.blurb }}</p>

          <ul class="preview__steps">
            <li v-for="(step, index) in sheetPiece.steps" :key="step.id">
              <span class="preview__index">{{ index + 1 }}</span>
              <span>
                <template v-if="step.kind === 'walk'">{{ step.label }}</template>
                <template v-else-if="step.kind === 'quiz'">
                  Svara på {{ step.questions.length }} frågor
                </template>
                <template v-else>{{ step.prompt }}</template>
              </span>
            </li>
          </ul>

          <p class="preview__distance muted">
            <template v-if="canStart">Du är på platsen. Nu kan du starta uppdraget.</template>
            <template v-else>
              {{ formatDistance(sheetDistance) }} bort - kom närmare för att kunna starta uppdraget.
            </template>
          </p>

          <button
            class="button button--primary button--block"
            type="button"
            :disabled="!canStart"
            @click="startMission"
          >
            Starta uppdraget
          </button>
        </div>
      </template>
    </AppSheet>

    <AppSheet
      :open="sheetEnemy !== null"
      :title="sheetEnemy?.locationName ?? ''"
      @close="closeEnemySheet"
    >
      <EnemyBattle v-if="sheetEnemy" :enemy="sheetEnemy" @close="closeEnemySheet" />
    </AppSheet>
  </div>
</template>

<style scoped lang="scss">
.map-view {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;

  &__gps {
    position: absolute;
    top: 14px;
    left: 14px;
    right: 14px;
    z-index: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgb(30 41 59 / 96%);
    box-shadow: 0 8px 28px rgb(0 0 0 / 45%);
  }

  &__gps-text {
    flex: 1;

    p {
      font-size: 0.82rem;
      line-height: 1.4;
    }
  }

  &__wakelock {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 500;
    padding: 8px 14px;
    border-radius: 999px;
    background: rgb(247 201 72 / 92%);
    color: #422006;
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
  }

  &__mission {
    position: absolute;
    left: 14px;
    right: 14px;
    bottom: 14px;
    z-index: 500;
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    background: rgb(30 41 59 / 96%);
    box-shadow: 0 8px 28px rgb(0 0 0 / 45%);
  }

  &__mission-text {
    flex: 1;
    min-width: 0;
  }

  &__mission-title {
    font-weight: 700;
  }

  &__mission-sub {
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__mission-arrow {
    font-size: 1.5rem;
    color: var(--text-dim);
  }
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;

  &__figure {
    display: grid;
    place-items: center;
    width: 120px;
    padding: 10px;
    border-radius: var(--radius);
    background: radial-gradient(circle at 50% 35%, rgb(244 96 54 / 22%), transparent 70%),
      var(--surface);
    border: 1px solid var(--border);
  }

  &__name {
    font-size: 1.3rem;
  }

  &__blurb {
    font-size: 0.9rem;
    line-height: 1.45;
  }

  &__steps {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 6px 0 2px;
    text-align: left;
  }

  &__steps li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    border: 1px solid var(--border);
    font-size: 0.9rem;
  }

  &__index {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 0.75rem;
    font-weight: 700;
  }

  &__distance {
    font-size: 0.85rem;
  }
}
</style>
