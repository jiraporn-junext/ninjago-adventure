import type { Element } from "@/types";

export interface ElementTheme {
  id: Element;
  label: string;
  /** Dräktens huvudfärg: huva, torso och armar. */
  primary: string;
  /** Mask och detaljer. */
  secondary: string;
  /** Emblem, sash och bältesbuckle. */
  accent: string;
  /** Hudton för ansiktet. */
  skin: string;
  /** Byxor och skor. */
  trousers: string;
}

export const THEMES: Record<Element, ElementTheme> = {
  eld: {
    id: "eld",
    label: "Eld",
    primary: "#d7263d",
    secondary: "#8c1a2b",
    accent: "#ffb703",
    skin: "#f2c6a0",
    trousers: "#2f2a33",
  },
  is: {
    id: "is",
    label: "Is",
    primary: "#7fd4f5",
    secondary: "#1b6ca8",
    accent: "#e8f7ff",
    skin: "#e8c39e",
    trousers: "#24374a",
  },
  blixt: {
    id: "blixt",
    label: "Blixt",
    primary: "#f7c948",
    secondary: "#1f2937",
    accent: "#fde68a",
    skin: "#f2c6a0",
    trousers: "#2b2b33",
  },
  jord: {
    id: "jord",
    label: "Jord",
    primary: "#4c9a5f",
    secondary: "#2f5d3a",
    accent: "#a7d7a0",
    skin: "#d9a877",
    trousers: "#3b3026",
  },
  vatten: {
    id: "vatten",
    label: "Vatten",
    primary: "#35c4c4",
    secondary: "#12566b",
    accent: "#b2f5f0",
    skin: "#e0b590",
    trousers: "#1f3a44",
  },
  vind: {
    id: "vind",
    label: "Vind",
    primary: "#b8c6d1",
    secondary: "#4a5b6a",
    accent: "#eef3f8",
    skin: "#f2c6a0",
    trousers: "#38424d",
  },
  teknik: {
    id: "teknik",
    label: "Teknik",
    primary: "#2a3d66",
    secondary: "#e11d48",
    accent: "#7dd3fc",
    skin: "#c98f5f",
    trousers: "#1a2338",
  },
  gravitation: {
    id: "gravitation",
    label: "Gravitation",
    primary: "#7b4fa0",
    secondary: "#2b1b40",
    accent: "#d8b4fe",
    skin: "#e8c39e",
    trousers: "#2a1f38",
  },
};

/** "is" blir "isninja" - så gubbarna kan beskrivas i text. */
export function ninjaElementLabel(element: Element): string {
  return `${THEMES[element].label.toLowerCase()}ninja`;
}
