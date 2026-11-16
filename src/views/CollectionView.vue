<script setup lang="ts">
import { computed } from "vue";
import PieceCard from "@/components/collection/PieceCard.vue";
import { PIECES } from "@/data/pieces";
import { gameStore } from "@/stores/gameStore";

const owned = computed(() => gameStore.ownedPieces.value.length);
</script>

<template>
  <div class="collection scroll-area">
    <header class="collection__header">
      <h1 class="collection__title">Samling</h1>
      <p class="collection__count muted">{{ owned }} av {{ PIECES.length }} ninjagubbar</p>
    </header>

    <div class="collection__grid">
      <PieceCard v-for="piece in PIECES" :key="piece.id" :piece="piece" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.collection {
  flex: 1;
  min-height: 0;
  padding: 18px 16px calc(24px + var(--safe-bottom));

  &__header {
    margin-bottom: 16px;
  }

  &__title {
    font-size: 1.4rem;
  }

  &__count {
    font-size: 0.85rem;
    margin-top: 2px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
    gap: 10px;
  }
}
</style>
