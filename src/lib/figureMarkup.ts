import { THEMES } from "@/data/themes";
import type { Element } from "@/types";

export interface FigureOptions {
  glow?: boolean;
  size?: number;
}

/**
 * Samma ninjafigur som i NinjaFigure.vue, men som en markup-sträng så att
 * kartmarkörer kan återanvända den utan att duplicera SVG:t.
 */
export function figureSvg(element: Element, options: FigureOptions = {}): string {
  const theme = THEMES[element];
  const size = options.size ?? 96;
  const height = Math.round(size * 1.62);
  const glow = options.glow
    ? `<circle cx="50" cy="82" r="46" stroke="${theme.accent}" stroke-width="2" opacity="0.55" stroke-dasharray="6 8"/>`
    : "";

  return `<svg width="${size}" height="${height}" viewBox="0 0 100 162" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ninja ${theme.label}" class="ninja-figure">
  <ellipse cx="50" cy="156" rx="26" ry="5" fill="#000" opacity="0.28"/>
  <rect x="35" y="102" width="14" height="48" rx="4" fill="${theme.trousers}"/>
  <rect x="51" y="102" width="14" height="48" rx="4" fill="${theme.trousers}"/>
  <rect x="35" y="144" width="14" height="8" rx="3" fill="#15171c"/>
  <rect x="51" y="144" width="14" height="8" rx="3" fill="#15171c"/>
  <rect x="19" y="68" width="13" height="38" rx="6" fill="${theme.primary}"/>
  <rect x="68" y="68" width="13" height="38" rx="6" fill="${theme.primary}"/>
  <circle cx="25.5" cy="107" r="6" fill="${theme.skin}"/>
  <circle cx="74.5" cy="107" r="6" fill="${theme.skin}"/>
  <path d="M34 62 H66 L70 106 H30 Z" fill="${theme.primary}"/>
  <path d="M34 62 H44 L38 106 H30 Z" fill="#000" opacity="0.1"/>
  <rect x="32" y="66" width="2" height="42" fill="#000" opacity="0.18"/>
  <rect x="66" y="66" width="2" height="42" fill="#000" opacity="0.18"/>
  <path d="M33 66 L67 100 L60 108 L33 78 Z" fill="${theme.accent}" opacity="0.95"/>
  <rect x="30" y="96" width="40" height="9" rx="2" fill="${theme.secondary}"/>
  <rect x="46" y="96" width="8" height="9" rx="1" fill="${theme.accent}"/>
  <path d="M28 48 C28 26 38 14 50 14 C62 14 72 26 72 48 L72 56 L28 56 Z" fill="${theme.primary}"/>
  <path d="M28 48 C28 26 38 14 50 14 C42 18 36 30 36 48 L36 56 L28 56 Z" fill="#000" opacity="0.12"/>
  <ellipse cx="50" cy="47" rx="15" ry="14" fill="${theme.skin}"/>
  <path d="M35 51 H65 V64 H35 Z" fill="${theme.secondary}"/>
  <path d="M35 51 L65 51 L65 55 L35 55 Z" fill="#000" opacity="0.18"/>
  <ellipse cx="44.5" cy="44" rx="2.8" ry="3.3" fill="#1f2937"/>
  <ellipse cx="55.5" cy="44" rx="2.8" ry="3.3" fill="#1f2937"/>
  <circle cx="45.5" cy="43" r="1" fill="#fff" opacity="0.85"/>
  <circle cx="56.5" cy="43" r="1" fill="#fff" opacity="0.85"/>
  <path d="M50 22 L55 30 L50 38 L45 30 Z" fill="${theme.accent}"/>
  ${glow}
</svg>`;
}
