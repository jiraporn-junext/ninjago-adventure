<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { ENEMIES } from "@/data/enemies";
import { PIECES } from "@/data/pieces";
import { gameStore } from "@/stores/gameStore";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const installEvent = ref<InstallPromptEvent | null>(null);
const canInstall = ref(false);

function onBeforeInstallPrompt(event: Event): void {
  event.preventDefault();
  installEvent.value = event as InstallPromptEvent;
  canInstall.value = true;
}

async function install(): Promise<void> {
  if (!installEvent.value) return;
  await installEvent.value.prompt();
  await installEvent.value.userChoice;
  installEvent.value = null;
  canInstall.value = false;
}

onMounted(() => {
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", () => {
    canInstall.value = false;
  });
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
});

const tabs = [
  { to: "/", label: "Karta", icon: "🗺️" },
  { to: "/uppdrag", label: "Uppdrag", icon: "📜" },
  { to: "/samling", label: "Samling", icon: "🏆" },
  { to: "/mer", label: "Mer", icon: "⚙️" },
];
</script>

<template>
  <div class="app-shell">
    <header class="app-shell__bar">
      <div class="app-shell__brand">
        <span class="app-shell__logo">🥷</span>
        <div>
          <p class="app-shell__title">Ninjago Adventure</p>
          <p class="app-shell__subtitle muted">
            {{ gameStore.ownedPieces.value.length }}/{{ PIECES.length }} samlat ·
            {{ gameStore.defeatedEnemies.value.length }}/{{ ENEMIES.length }} fiender ·
            {{ Math.round(gameStore.state.totalWalkMeters) }} m gått
          </p>
        </div>
      </div>

      <button
        v-if="canInstall"
        class="button button--primary app-shell__install"
        type="button"
        @click="install"
      >
        Installera
      </button>
    </header>

    <main class="app-shell__main">
      <RouterView />
    </main>

    <nav class="app-shell__nav">
      <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" class="app-shell__tab">
        <span class="app-shell__tab-icon">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;

  &__bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: calc(10px + var(--safe-top)) 16px 10px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    z-index: 600;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__logo {
    font-size: 1.6rem;
  }

  &__title {
    font-weight: 700;
    font-size: 1.05rem;
    letter-spacing: -0.01em;
  }

  &__subtitle {
    font-size: 0.76rem;
  }

  &__install {
    padding: 0 14px;
    font-size: 0.85rem;
  }

  &__main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  &__nav {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: var(--bg);
    border-top: 1px solid var(--border);
    padding-bottom: var(--safe-bottom);
    z-index: 600;
  }

  &__tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 56px;
    padding: 6px 4px;
    color: var(--text-dim);
    font-size: 0.7rem;
    font-weight: 600;
    text-decoration: none;

    &.router-link-active {
      color: var(--accent);
    }
  }

  &__tab-icon {
    font-size: 1.25rem;
  }
}
</style>
