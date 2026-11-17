<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import NinjaFigure from "@/components/figures/NinjaFigure.vue";
import { gameStore } from "@/stores/gameStore";
import { getPhoto } from "@/lib/storage/photosDb";
import type { Piece } from "@/types";

const props = defineProps<{
  piece: Piece;
}>();

const photoUrl = ref<string | null>(null);
const owned = computed(() => gameStore.isOwned(props.piece.id));

async function loadPhoto(): Promise<void> {
  const progress = gameStore.progressFor(props.piece.id);
  const photoId = Object.values(progress?.steps ?? {}).find((step) => step.photoId)?.photoId;
  if (!photoId) {
    photoUrl.value = null;
    return;
  }

  const blob = await getPhoto(photoId);
  if (!blob) {
    photoUrl.value = null;
    return;
  }

  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value);
  photoUrl.value = URL.createObjectURL(blob);
}

watch(() => props.piece.id, loadPhoto, { immediate: true });

onBeforeUnmount(() => {
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value);
});
</script>

<template>
  <article class="piece-card" :class="{ 'piece-card--owned': owned }">
    <div class="piece-card__figure">
      <NinjaFigure v-if="owned" :element="piece.element" :size="72" />
      <div v-else class="piece-card__unknown">?</div>
    </div>

    <p class="piece-card__name">{{ owned ? piece.name : "Okänd ninja" }}</p>
    <p class="piece-card__place muted">{{ owned ? piece.locationName : "Hittad inte" }}</p>
    <p v-if="owned" class="piece-card__power">Styrka {{ gameStore.ninjaStrength(piece.id) }}</p>

    <img v-if="photoUrl" class="piece-card__photo" :src="photoUrl" alt="Ditt foto" />
  </article>
</template>

<style scoped lang="scss">
.piece-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--border);
  text-align: center;

  &--owned {
    border-color: rgb(244 96 54 / 45%);
    background: linear-gradient(180deg, rgb(244 96 54 / 10%), transparent 60%), var(--surface);
  }

  &__figure {
    display: grid;
    place-items: center;
    height: 116px;
  }

  &__unknown {
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 2px dashed var(--border);
    color: var(--text-dim);
    font-size: 1.5rem;
    font-weight: 700;
  }

  &__name {
    font-weight: 700;
    font-size: 0.95rem;
  }

  &__place {
    font-size: 0.78rem;
  }

  &__power {
    margin-top: 2px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--accent-soft);
    color: var(--accent);
    font-size: 0.7rem;
    font-weight: 700;
  }

  &__photo {
    width: 100%;
    margin-top: 8px;
    border-radius: var(--radius-sm);
    object-fit: cover;
    max-height: 96px;
  }
}
</style>
