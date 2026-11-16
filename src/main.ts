import { createApp } from "vue";
import App from "@/App.vue";
import { router } from "@/router";
import { gameStore } from "@/stores/gameStore";
import "@/styles/global.scss";

gameStore.initialize();

// Appen kan bli avslutad av systemet när den är i bakgrunden, så framsteget
// måste sparas direkt när vi lämnar sidan.
window.addEventListener("pagehide", () => gameStore.flush());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") gameStore.flush();
});

createApp(App).use(router).mount("#app");
