import { createRouter, createWebHistory } from "vue-router";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "karta", component: () => import("@/views/MapView.vue") },
    { path: "/uppdrag", name: "uppdrag", component: () => import("@/views/MissionsView.vue") },
    { path: "/samling", name: "samling", component: () => import("@/views/CollectionView.vue") },
    { path: "/mer", name: "mer", component: () => import("@/views/SettingsView.vue") },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});
