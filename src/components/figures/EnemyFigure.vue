<script setup lang="ts">
import { computed } from "vue";
import { THEMES } from "@/data/themes";
import { enemySvg } from "@/lib/enemyMarkup";
import type { Element, EnemyKind } from "@/types";

const props = withDefaults(
  defineProps<{
    kind: EnemyKind;
    element: Element;
    name?: string;
    size?: number;
    glow?: boolean;
  }>(),
  { name: "", size: 96, glow: false },
);

const theme = computed(() => THEMES[props.element]);
const markup = computed(() =>
  enemySvg(props.kind, props.element, {
    size: props.size,
    name: props.name || theme.value.label,
    glow: props.glow,
  }),
);
</script>

<template>
  <div
    class="enemy-figure"
    :style="{ width: `${size}px` }"
    v-html="markup"
    role="img"
    :aria-label="name || theme.label"
  />
</template>

<style scoped lang="scss">
.enemy-figure {
  line-height: 0;

  :deep(svg) {
    display: block;
    overflow: visible;
  }
}
</style>
