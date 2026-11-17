import { THEMES } from "@/data/themes";
import type { Element, EnemyKind } from "@/types";

export interface EnemyFigureOptions {
  size?: number;
  /** Namnet på fienden, används som alt-text. */
  name?: string;
  /** Lysande ring under fienden, som markören för en ninjagubbe. */
  glow?: boolean;
}

/**
 * Fiendefigurerna i samma stil som ninjafiguren, men egna silhuetter.
 * Samma markup-sträng som för ninjafigurerna så att kartmarkörerna kan
 * återanvända dem utan att duplicera SVG:t.
 */
export function enemySvg(
  kind: EnemyKind,
  element: Element,
  options: EnemyFigureOptions = {},
): string {
  const theme = THEMES[element];
  const size = options.size ?? 96;
  const height = Math.round(size * 1.62);
  const label = options.name ?? theme.label;
  const glow = options.glow
    ? `<circle cx="50" cy="82" r="46" stroke="${theme.accent}" stroke-width="2" opacity="0.55" stroke-dasharray="6 8"/>`
    : "";

  const body = SHAPES[kind](theme.primary, theme.secondary, theme.accent);

  return `<svg width="${size}" height="${height}" viewBox="0 0 100 162" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" class="enemy-svg">
  <ellipse cx="50" cy="155" rx="28" ry="5" fill="#000" opacity="0.3"/>
  ${body}
  ${glow}
</svg>`;
}

type Shape = (primary: string, secondary: string, accent: string) => string;

/** En vargliknande fiende med fyra ben, ryggrad och svans. */
const wolf: Shape = (primary, secondary, accent) => `
  <path d="M78 88 C94 80 96 58 88 46" stroke="${primary}" stroke-width="9" stroke-linecap="round"/>
  <path d="M64 100 L69 140" stroke="${secondary}" stroke-width="14" stroke-linecap="round"/>
  <path d="M50 102 L48 140" stroke="${secondary}" stroke-width="14" stroke-linecap="round"/>
  <path d="M26 104 C26 72 44 60 64 64 C80 67 86 86 80 104 Z" fill="${primary}"/>
  <path d="M34 66 L41 48 L49 62 L57 46 L65 60 L73 44 L79 60 Z" fill="${secondary}"/>
  <path d="M40 100 L36 140" stroke="${primary}" stroke-width="14" stroke-linecap="round"/>
  <path d="M28 102 L26 140" stroke="${primary}" stroke-width="14" stroke-linecap="round"/>
  <path d="M32 88 C14 86 6 74 10 58 C15 40 33 33 46 42 C57 50 58 66 50 82 Z" fill="${primary}"/>
  <path d="M24 46 L19 26 L36 38 Z" fill="${secondary}"/>
  <path d="M11 62 L1 70 L13 78 Z" fill="${secondary}"/>
  <path d="M8 78 L12 87 L16 78 Z" fill="#f8fafc"/>
  <circle cx="25" cy="60" r="3.8" fill="${accent}"/>`;

/** En klumpig stenfigur med lysande kärna i bröstet. */
const golem: Shape = (primary, secondary, accent) => `
  <rect x="30" y="100" width="16" height="44" rx="5" fill="${secondary}"/>
  <rect x="54" y="100" width="16" height="44" rx="5" fill="${secondary}"/>
  <rect x="14" y="66" width="15" height="44" rx="7" fill="${primary}"/>
  <rect x="71" y="66" width="15" height="44" rx="7" fill="${primary}"/>
  <path d="M26 64 L38 44 L62 44 L74 64 L66 104 L34 104 Z" fill="${primary}"/>
  <path d="M26 64 L40 62 L38 44 Z" fill="#000" opacity="0.12"/>
  <path d="M34 104 L66 104 L62 118 L38 118 Z" fill="${secondary}"/>
  <circle cx="50" cy="80" r="15" stroke="${accent}" stroke-width="2" opacity="0.4"/>
  <circle cx="50" cy="80" r="8" fill="${accent}"/>
  <rect x="42" y="34" width="16" height="14" fill="${secondary}"/>
  <rect x="36" y="12" width="28" height="26" rx="6" fill="${primary}"/>
  <path d="M36 16 L64 16 L64 22 L36 22 Z" fill="#000" opacity="0.15"/>
  <circle cx="43" cy="28" r="3.4" fill="${accent}"/>
  <circle cx="57" cy="28" r="3.4" fill="${accent}"/>`;

/** En bevingad drake med horn och lång svans. */
const drake: Shape = (primary, secondary, accent) => `
  <path d="M68 104 C88 110 92 130 80 140" stroke="${primary}" stroke-width="9" stroke-linecap="round"/>
  <path d="M60 88 C78 64 92 54 98 58 C94 70 88 76 92 80 C86 84 80 92 76 102 C70 98 64 94 60 88 Z" fill="${secondary}"/>
  <path d="M40 88 C22 64 8 54 2 58 C6 70 12 76 8 80 C14 84 20 92 24 102 C30 98 36 94 40 88 Z" fill="${secondary}"/>
  <path d="M44 118 L40 146" stroke="${secondary}" stroke-width="11" stroke-linecap="round"/>
  <path d="M58 118 L62 146" stroke="${secondary}" stroke-width="11" stroke-linecap="round"/>
  <ellipse cx="50" cy="102" rx="21" ry="23" fill="${primary}"/>
  <path d="M42 62 L58 62 L56 84 L44 84 Z" fill="${primary}"/>
  <path d="M32 40 C32 56 40 63 50 63 C60 63 68 56 68 40 L60 47 L50 38 L40 47 Z" fill="${primary}"/>
  <path d="M36 46 L30 28 L44 41 Z" fill="${secondary}"/>
  <path d="M64 46 L70 28 L56 41 Z" fill="${secondary}"/>
  <path d="M40 68 L60 68 L56 76 L44 76 Z" fill="#f8fafc" opacity="0.85"/>
  <circle cx="41" cy="56" r="3.4" fill="${accent}"/>
  <circle cx="59" cy="56" r="3.4" fill="${accent}"/>`;

const SHAPES: Record<EnemyKind, Shape> = {
  varg: wolf,
  golem,
  drake,
};
