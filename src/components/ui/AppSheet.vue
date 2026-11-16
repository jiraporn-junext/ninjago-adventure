<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    dismissible?: boolean;
  }>(),
  { title: "", dismissible: true },
);

const emit = defineEmits<{ (event: "close"): void }>();
</script>

<template>
  <Transition name="sheet">
    <div v-if="open" class="sheet">
      <button class="sheet__scrim" type="button" aria-label="Stäng" @click="dismissible && emit('close')" />

      <section class="sheet__panel" role="dialog" aria-modal="true">
        <div class="sheet__handle" />
        <header v-if="title" class="sheet__header">
          <h2>{{ title }}</h2>
          <button
            v-if="dismissible"
            class="sheet__close"
            type="button"
            aria-label="Stäng"
            @click="emit('close')"
          >
            ✕
          </button>
        </header>
        <div class="sheet__body scroll-area">
          <slot />
        </div>
      </section>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.sheet {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  &__scrim {
    position: absolute;
    inset: 0;
    border: none;
    background: rgb(2 6 23 / 65%);
    backdrop-filter: blur(2px);
  }

  &__panel {
    position: relative;
    max-height: 88dvh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    border-top-left-radius: var(--radius-lg);
    border-top-right-radius: var(--radius-lg);
    border-top: 1px solid var(--border);
    box-shadow: 0 -12px 40px rgb(0 0 0 / 55%);
  }

  &__handle {
    width: 42px;
    height: 4px;
    margin: 10px auto 4px;
    border-radius: 2px;
    background: var(--border);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 20px 12px;
    border-bottom: 1px solid var(--border);

    h2 {
      font-size: 1.1rem;
    }
  }

  &__close {
    width: var(--tap);
    height: var(--tap);
    border-radius: 50%;
    color: var(--text-muted);
    font-size: 1.1rem;
  }

  &__body {
    padding: 18px 20px calc(24px + var(--safe-bottom));
  }
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;

  .sheet__panel {
    transition: transform 0.25s ease;
  }
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;

  .sheet__panel {
    transform: translateY(24px);
  }
}
</style>
