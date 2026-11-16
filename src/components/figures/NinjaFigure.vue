<script setup lang="ts">
import { computed } from "vue";
import { THEMES } from "@/data/themes";
import { figureSvg } from "@/lib/figureMarkup";
import type { Element } from "@/types";

const props = withDefaults(
  defineProps<{
    element: Element;
    size?: number;
    glow?: boolean;
  }>(),
  { size: 96, glow: false },
);

const theme = computed(() => THEMES[props.element]);
const markup = computed(() => figureSvg(props.element, { size: props.size, glow: props.glow }));
</script>

<template>
  <div
    class="ninja-figure"
    :style="{ width: `${size}px` }"
    v-html="markup"
    role="img"
    :aria-label="`Ninja ${theme.label}`"
  />
</template>

<style scoped lang="scss">
.ninja-figure {
  line-height: 0;

  :deep(svg) {
    display: block;
    overflow: visible;
  }
}
</style>
