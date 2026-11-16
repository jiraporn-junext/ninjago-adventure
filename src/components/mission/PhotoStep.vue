<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { gameStore } from "@/stores/gameStore";
import { compressPhoto } from "@/lib/photos/capture";
import { getPhoto, savePhoto } from "@/lib/storage/photosDb";
import type { PhotoStep as PhotoStepType, Piece, StepProgress } from "@/types";

const props = defineProps<{
  piece: Piece;
  step: PhotoStepType;
  progress: StepProgress | undefined;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const error = ref<string | null>(null);
const busy = ref(false);

const done = computed(() => props.progress?.status === "done");

function photoId(): string {
  return `${props.piece.id}:${props.step.id}`;
}

async function loadPreview(): Promise<void> {
  const existing = props.progress?.photoId;
  if (!existing) {
    previewUrl.value = null;
    return;
  }

  const blob = await getPhoto(existing);
  if (!blob) {
    previewUrl.value = null;
    return;
  }

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = URL.createObjectURL(blob);
}

watch(() => props.progress?.photoId, loadPreview, { immediate: true });

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});

async function onFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  busy.value = true;
  error.value = null;

  try {
    const blob = await compressPhoto(file);
    const id = photoId();
    await savePhoto(id, blob);
    gameStore.attachPhoto(props.piece.id, props.step.id, id);
  } catch {
    error.value = "Kunde inte spara fotot. Prova igen eller välj en annan bild.";
  } finally {
    busy.value = false;
    input.value = "";
  }
}
</script>

<template>
  <div class="photo-step">
    <p class="photo-step__prompt">{{ step.prompt }}</p>

    <div v-if="previewUrl" class="photo-step__preview">
      <img :src="previewUrl" alt="Ditt foto" />
      <span v-if="done" class="photo-step__badge">Sparad</span>
    </div>

    <input
      ref="fileInput"
      class="photo-step__input"
      type="file"
      accept="image/*"
      capture="environment"
      @change="onFile"
    />

    <button
      class="button button--primary button--block"
      type="button"
      :disabled="busy"
      @click="fileInput?.click()"
    >
      {{ busy ? "Sparar..." : done ? "Ta ett nytt foto" : "Ta foto" }}
    </button>

    <p v-if="error" class="photo-step__error">{{ error }}</p>
    <p v-else class="photo-step__hint muted">
      Bilden sparas på din telefon och visas i samlingen när du samlat gubben.
    </p>
  </div>
</template>

<style scoped lang="scss">
.photo-step {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__prompt {
    font-weight: 600;
    line-height: 1.4;
  }

  &__input {
    display: none;
  }

  &__preview {
    position: relative;
    border-radius: var(--radius);
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--surface);

    img {
      display: block;
      width: 100%;
      max-height: 320px;
      object-fit: cover;
    }
  }

  &__badge {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgb(74 222 128 / 92%);
    color: #052e16;
    font-size: 0.75rem;
    font-weight: 700;
  }

  &__hint {
    font-size: 0.82rem;
  }

  &__error {
    color: var(--danger);
    font-size: 0.85rem;
  }
}
</style>
