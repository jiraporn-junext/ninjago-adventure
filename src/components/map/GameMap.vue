<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ENEMIES } from "@/data/enemies";
import { PIECES } from "@/data/pieces";
import { THEMES } from "@/data/themes";
import { gameStore, REVEAL_RADIUS_M, START_RADIUS_M } from "@/stores/gameStore";
import { geoStore } from "@/stores/geoStore";
import { enemySvg } from "@/lib/enemyMarkup";
import { figureSvg } from "@/lib/figureMarkup";
import { lerpLatLng, type LatLng } from "@/lib/geo/geoMath";
import type { Enemy, Piece } from "@/types";

const emit = defineEmits<{
  (event: "select-piece", pieceId: string): void;
  (event: "select-enemy", enemyId: string): void;
}>();

const DEFAULT_CENTER: LatLng = { lat: 59.2595, lng: 18.18 };
const DEFAULT_ZOOM = 15;
/** Gubbar du står vid ska synas ovanför avataren - belöningen ska synas. */
const NEAR_Z_OFFSET = 1200;
const AVATAR_Z_OFFSET = 1000;
/** Fiender du står vid ska synas ovanför avataren - annars döljs de. */
const ENEMY_Z_OFFSET = 1100;

type MarkerState = "hidden" | "hint" | "near" | "owned";
type EnemyMarkerState = "hidden" | "revealed" | "near" | "defeated";

const mapEl = ref<HTMLElement | null>(null);
const map = shallowRef<L.Map | null>(null);
const follow = ref(true);
const tilesFailed = ref(false);

let avatarMarker: L.Marker | null = null;
let avatarElement: HTMLElement | null = null;
const pieceMarkers = new Map<string, L.Marker>();
const pieceStates = new Map<string, MarkerState>();
const enemyMarkers = new Map<string, L.Marker>();
const enemyStates = new Map<string, EnemyMarkerState>();

let visualPosition: LatLng | null = null;
let rafId = 0;
let lastFrame = 0;
let resizeObserver: ResizeObserver | null = null;

function markerState(piece: Piece): MarkerState {
  const status = gameStore.state.pieces[piece.id]?.status;
  if (status === "owned") return "owned";

  const distance = gameStore.distanceTo(piece, geoStore.position);
  if (distance === null) return "hidden";
  if (distance <= START_RADIUS_M) return "near";
  if (distance <= REVEAL_RADIUS_M) return "hint";
  return "hidden";
}

function pieceIcon(piece: Piece, state: MarkerState): L.DivIcon {
  const theme = THEMES[piece.element];

  if (state === "hint") {
    return L.divIcon({
      className: "piece-marker piece-marker--hint",
      html: `<div class="piece-hint" data-piece="${piece.id}" style="--accent:${theme.accent}">?</div>`,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
  }

  return L.divIcon({
    className: `piece-marker piece-marker--${state}`,
    html: `<div class="piece-figure" data-piece="${piece.id}" style="--accent:${theme.accent}">${figureSvg(piece.element, { size: 62 })}</div>`,
    iconSize: [62, 100],
    iconAnchor: [31, 100],
  });
}

function syncPieceMarkers(): void {
  if (!map.value) return;

  for (const piece of PIECES) {
    const state = markerState(piece);

    if (pieceStates.get(piece.id) === state) continue;
    pieceStates.set(piece.id, state);

    let marker = pieceMarkers.get(piece.id);
    if (!marker) {
      marker = L.marker([piece.lat, piece.lng], {
        icon: pieceIcon(piece, state),
        keyboard: false,
        zIndexOffset: state === "near" ? NEAR_Z_OFFSET : 0,
      });
      marker.on("click", () => emit("select-piece", piece.id));
      pieceMarkers.set(piece.id, marker);
    }

    if (state === "hidden") {
      if (map.value.hasLayer(marker)) {
        map.value.removeLayer(marker);
      }
    } else {
      marker.setIcon(pieceIcon(piece, state));
      marker.setZIndexOffset(state === "near" ? NEAR_Z_OFFSET : 0);
      if (!map.value.hasLayer(marker)) {
        marker.addTo(map.value);
      }
    }
  }
}

function enemyMarkerState(enemy: Enemy): EnemyMarkerState {
  if (gameStore.isEnemyDefeated(enemy.id)) return "defeated";

  const distance = gameStore.distanceTo(enemy, geoStore.position);
  if (distance === null) return "hidden";
  if (distance <= START_RADIUS_M) return "near";
  if (distance <= REVEAL_RADIUS_M) return "revealed";
  return "hidden";
}

function enemyIcon(enemy: Enemy, state: EnemyMarkerState): L.DivIcon {
  const theme = THEMES[enemy.element];
  const figure = enemySvg(enemy.kind, enemy.element, { size: 62, name: enemy.name });
  const defeated = state === "defeated" ? " enemy-marker-figure--defeated" : "";
  const badge = state === "defeated" ? '<span class="enemy-badge">✓</span>' : "";

  return L.divIcon({
    className: `enemy-marker enemy-marker--${state}`,
    html: `<div class="enemy-marker-figure${defeated}" data-enemy="${enemy.id}" style="--accent:${theme.accent}">${figure}${badge}</div>`,
    iconSize: [62, 100],
    iconAnchor: [31, 100],
  });
}

/** Fiender du står vid - och besegrade fiender - ska synas ovanför avataren. */
function enemyZOffset(state: EnemyMarkerState): number {
  return state === "near" || state === "defeated" ? ENEMY_Z_OFFSET : 0;
}

function syncEnemyMarkers(): void {
  if (!map.value) return;

  for (const enemy of ENEMIES) {
    const state = enemyMarkerState(enemy);

    if (enemyStates.get(enemy.id) === state) continue;
    enemyStates.set(enemy.id, state);

    let marker = enemyMarkers.get(enemy.id);
    if (!marker) {
      marker = L.marker([enemy.lat, enemy.lng], {
        icon: enemyIcon(enemy, state),
        keyboard: false,
        zIndexOffset: enemyZOffset(state),
      });
      marker.on("click", () => emit("select-enemy", enemy.id));
      enemyMarkers.set(enemy.id, marker);
    }

    if (state === "hidden") {
      if (map.value.hasLayer(marker)) {
        map.value.removeLayer(marker);
      }
    } else {
      marker.setIcon(enemyIcon(enemy, state));
      marker.setZIndexOffset(enemyZOffset(state));
      if (!map.value.hasLayer(marker)) {
        marker.addTo(map.value);
      }
    }
  }
}

function frame(now: number): void {
  const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
  lastFrame = now;

  const target = geoStore.position;
  if (target && avatarMarker) {
    if (!visualPosition) {
      visualPosition = target;
    } else {
      visualPosition = lerpLatLng(visualPosition, target, 1 - Math.exp(-dt / 0.25));
    }
    avatarMarker.setLatLng([visualPosition.lat, visualPosition.lng]);

    if (avatarElement) {
      avatarElement.style.setProperty("--heading", `${geoStore.heading}deg`);
    }
  }

  rafId = requestAnimationFrame(frame);
}

function centerOnPlayer(): void {
  if (!map.value || !geoStore.position) return;
  follow.value = true;
  map.value.setView([geoStore.position.lat, geoStore.position.lng], map.value.getZoom(), {
    animate: true,
  });
}

onMounted(() => {
  if (!mapEl.value) return;

  const instance = L.map(mapEl.value, {
    center: geoStore.position
      ? [geoStore.position.lat, geoStore.position.lng]
      : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
    zoom: DEFAULT_ZOOM,
    zoomControl: false,
    attributionControl: false,
    scrollWheelZoom: false,
  });
  map.value = instance;

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap-bidragsgivare",
  })
    .on("tileerror", () => {
      tilesFailed.value = true;
    })
    .on("load", () => {
      tilesFailed.value = false;
    })
    .addTo(instance);

  L.control.attribution({ prefix: false }).addTo(instance);

  avatarMarker = L.marker([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], {
    icon: L.divIcon({
      className: "avatar-marker",
      html: `<div class="avatar-figure">${figureSvg("blixt", { size: 60 })}</div>`,
      iconSize: [60, 97],
      iconAnchor: [30, 97],
    }),
    keyboard: false,
    interactive: false,
    zIndexOffset: AVATAR_Z_OFFSET,
  }).addTo(instance);

  avatarElement = avatarMarker.getElement()?.querySelector(".avatar-figure") ?? null;

  instance.on("dragstart", () => {
    follow.value = false;
  });

  syncPieceMarkers();
  syncEnemyMarkers();
  rafId = requestAnimationFrame(frame);

  // Kartan ligger i en flex-layout som kan ändra storlek efter att Leaflet
  // startat, så måtten måste uppdateras när containern förändras.
  resizeObserver = new ResizeObserver(() => map.value?.invalidateSize());
  resizeObserver.observe(mapEl.value);

  window.addEventListener("resize", handleResize);
});

function handleResize(): void {
  map.value?.invalidateSize();
}

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
  window.removeEventListener("resize", handleResize);
  map.value?.remove();
  map.value = null;
});

watch(
  () => geoStore.position,
  (position) => {
    if (!position || !map.value) return;

    if (follow.value) {
      map.value.panTo([position.lat, position.lng], { animate: false });
    }
    syncPieceMarkers();
    syncEnemyMarkers();
  },
);

watch(
  () => [gameStore.state.pieces, gameStore.state.enemies],
  () => {
    syncPieceMarkers();
    syncEnemyMarkers();
  },
  { deep: true },
);

defineExpose({ centerOnPlayer, follow });
</script>

<template>
  <div class="game-map">
    <div ref="mapEl" class="game-map__canvas" />

    <button
      v-if="!follow"
      class="game-map__recenter button button--primary"
      type="button"
      @click="centerOnPlayer"
    >
      Centrera
    </button>

    <p v-if="tilesFailed" class="game-map__offline">
      Kartbrickorna gick inte att hämta. Kör online för att se kartan.
    </p>
  </div>
</template>

<style scoped lang="scss">
.game-map {
  position: absolute;
  inset: 0;
  overflow: hidden;

  &__canvas {
    position: absolute;
    inset: 0;
    background: var(--bg-deep);
  }

  &__recenter {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 500;
    box-shadow: 0 6px 20px rgb(0 0 0 / 45%);
  }

  &__offline {
    position: absolute;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    z-index: 500;
    max-width: 90%;
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    background: rgb(15 23 42 / 92%);
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-size: 0.82rem;
    text-align: center;
  }
}

:global(.leaflet-container) {
  background: var(--bg-deep);
  font-family: var(--font);
}

:global(.leaflet-control-attribution) {
  background: rgb(15 23 42 / 80%) !important;
  color: var(--text-dim) !important;
  font-size: 10px !important;
}

:global(.leaflet-control-attribution a) {
  color: var(--text-muted) !important;
}

:global(.piece-marker) {
  background: none;
  border: none;
}

:global(.piece-hint) {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgb(15 23 42 / 85%);
  border: 2px dashed var(--accent);
  color: var(--accent);
  font-weight: 700;
  font-size: 1.15rem;
  animation: piece-pulse 2.4s ease-in-out infinite;
}

:global(.piece-figure) {
  line-height: 0;
  filter: drop-shadow(0 4px 8px rgb(0 0 0 / 55%));
}

:global(.piece-marker--near .piece-figure) {
  filter: drop-shadow(0 0 12px var(--accent));
}

:global(.enemy-marker) {
  background: none;
  border: none;
}

:global(.enemy-marker-figure) {
  position: relative;
  line-height: 0;
  filter: drop-shadow(0 4px 8px rgb(0 0 0 / 55%));
}

:global(.enemy-marker--near .enemy-marker-figure) {
  filter: drop-shadow(0 0 14px var(--accent));
}

:global(.enemy-marker-figure--defeated .enemy-svg) {
  opacity: 0.38;
  filter: grayscale(1);
}

:global(.enemy-badge) {
  position: absolute;
  top: 0;
  right: 2px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--success);
  color: #052e16;
  font-size: 0.8rem;
  font-weight: 700;
}

:global(.avatar-marker) {
  background: none;
  border: none;
}

:global(.avatar-figure) {
  line-height: 0;
  transform: rotate(var(--heading, 0deg));
  transform-origin: 50% 88%;
  transition: transform 0.35s ease;
  filter: drop-shadow(0 4px 10px rgb(0 0 0 / 60%));
}

@keyframes piece-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.85;
  }
  50% {
    transform: scale(1.12);
    opacity: 1;
  }
}
</style>
