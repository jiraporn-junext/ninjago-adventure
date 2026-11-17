<script setup lang="ts">
import { computed, ref } from "vue";
import { gameStore } from "@/stores/gameStore";
import { geoStore } from "@/stores/geoStore";
import { downloadSave, readSaveFile } from "@/lib/saver";
import { isWakeLockSupported } from "@/lib/wakeLock";

const version = __APP_VERSION__;

const fileInput = ref<HTMLInputElement | null>(null);
const message = ref<string | null>(null);

const permissionLabel = computed(() => {
  switch (geoStore.permission) {
    case "granted":
      return "Godkänd";
    case "denied":
      return "Nekad";
    case "prompt":
      return "Väntar på ditt svar";
    default:
      return "Okänd";
  }
});

function exportSave(): void {
  downloadSave(gameStore.exportSave());
  message.value = "Sparfilen är nedladdad.";
}

async function importSave(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const text = await readSaveFile(file);
  const ok = gameStore.importSave(text);
  message.value = ok
    ? "Framsteget är importerat."
    : "Kunde inte läsa sparfilen. Kontrollera att det är en sparfil från spelet.";
  input.value = "";
}

function resetProgress(): void {
  if (!window.confirm("Vill du nollställa allt framsteg? Det går inte att ångra.")) return;
  gameStore.reset();
  message.value = "Framsteget är nollställt.";
}
</script>

<template>
  <div class="settings scroll-area">
    <h1 class="settings__title">Mer</h1>

    <section class="card settings__section">
      <h2 class="settings__heading">Installera på telefonen</h2>
      <ol class="settings__steps">
        <li>Öppna spelet i Chrome på din Android-telefon.</li>
        <li>Tryck på "Installera" i toppen, eller menyen ⋮ och "Lägg till på startskärmen".</li>
        <li>Appen ligger då på din startskärm och fungerar även utan nät.</li>
      </ol>
    </section>

    <section class="card settings__section">
      <h2 class="settings__heading">GPS</h2>
      <dl class="settings__facts">
        <div>
          <dt>Behörighet</dt>
          <dd>{{ permissionLabel }}</dd>
        </div>
        <div>
          <dt>Noggrannhet</dt>
          <dd>{{ geoStore.accuracy ? `${Math.round(geoStore.accuracy)} m` : "–" }}</dd>
        </div>
        <div>
          <dt>Gångdistans</dt>
          <dd>{{ Math.round(gameStore.state.totalWalkMeters) }} m</dd>
        </div>
        <div>
          <dt>Skärmen kan hållas tänd</dt>
          <dd>{{ isWakeLockSupported() ? "Ja" : "Nej" }}</dd>
        </div>
      </dl>
      <p v-if="!isWakeLockSupported()" class="settings__note muted">
        Browsern saknar stöd för att hålla skärmen tänd. Håll skärmen ljus under promenaden.
      </p>
    </section>

    <section class="card settings__section">
      <h2 class="settings__heading">Framsteg</h2>
      <p class="muted settings__note">
        Spelet saknar server, så framsteget ligger bara på den här telefonen. Ladda ner en
        sparfil ibland så att du inte tappar den.
      </p>
      <div class="settings__actions">
        <button class="button" type="button" @click="exportSave">Ladda ner sparfil</button>
        <button class="button" type="button" @click="fileInput?.click()">Importera sparfil</button>
      </div>
      <input
        ref="fileInput"
        class="settings__input"
        type="file"
        accept="application/json,.json"
        @change="importSave"
      />
      <p v-if="message" class="settings__message">{{ message }}</p>
    </section>

    <section class="card settings__section">
      <h2 class="settings__heading">Om appen</h2>
      <dl class="settings__facts">
        <div>
          <dt>Version</dt>
          <dd>{{ version }}</dd>
        </div>
      </dl>
      <p class="settings__note muted">
        När det finns en ny version hämtas den automatiskt nästa gång du startar appen. Vill du
        se den direkt? Avsluta appen helt och starta om den.
      </p>
    </section>

    <section class="card settings__section">
      <h2 class="settings__heading">Nollställ</h2>
      <button class="button button--danger button--block" type="button" @click="resetProgress">
        Rensa allt framsteg
      </button>
    </section>
  </div>
</template>

<style scoped lang="scss">
.settings {
  flex: 1;
  min-height: 0;
  padding: 18px 16px calc(24px + var(--safe-bottom));
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    font-size: 1.4rem;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__heading {
    font-size: 1rem;
  }

  &__steps {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 18px;
    list-style: decimal;
    color: var(--text-muted);
    font-size: 0.88rem;
    line-height: 1.5;
  }

  &__facts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;

    div {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }

    dt {
      color: var(--text-muted);
      font-size: 0.88rem;
    }

    dd {
      margin: 0;
      font-weight: 600;
      font-size: 0.88rem;
    }
  }

  &__note {
    font-size: 0.82rem;
    line-height: 1.5;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__input {
    display: none;
  }

  &__message {
    font-size: 0.85rem;
    color: var(--success);
  }
}
</style>
