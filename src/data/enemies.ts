import type { Enemy } from "@/types";
import { QUESTIONS } from "./questions";

/**
 * Fiender på riktiga platser i Älta, Nacka - samma slags platser som
 * ninjagubbarna sitter på, men fienderna är spridda över ett större område.
 * Koordinaterna kommer ur OpenStreetMap (Overpass) och är centrerade på
 * platsen, inte på parkering eller ingång.
 */
export const ENEMIES: Enemy[] = [
  {
    id: "skuggvargen",
    name: "Skuggvargen",
    kind: "varg",
    element: "gravitation",
    weakness: "blixt",
    lat: 59.264405,
    lng: 18.211749,
    locationName: "Skogshyddan",
    blurb: "Något stort rör sig bland granarna. Det väntar på den som törs gå in.",
    hp: 2,
    minNinjas: 1,
    questions: [
      QUESTIONS["skogshyddan"],
      QUESTIONS["fiende-svag"],
      QUESTIONS["element-blixt"],
      QUESTIONS["fiende-flera"],
    ],
  },
  {
    id: "vattengiganten",
    name: "Vattengiganten",
    kind: "golem",
    element: "vatten",
    weakness: "eld",
    lat: 59.255162,
    lng: 18.156331,
    locationName: "Mellanbadet",
    blurb: "Vattnet står stilla, men det är inte tomt. En vattensten har vaknat.",
    hp: 2,
    minNinjas: 1,
    questions: [
      QUESTIONS["mellanbadet"],
      QUESTIONS["typ-badplats"],
      QUESTIONS["fiende-fel"],
      QUESTIONS["element-eld"],
    ],
  },
  {
    id: "sanddraken",
    name: "Sanddraken",
    kind: "golem",
    element: "jord",
    weakness: "vind",
    lat: 59.253725,
    lng: 18.172259,
    locationName: "Safariparken",
    blurb: "Sanden virvlar till sig i små högar. Det är inte vinden som gör det.",
    hp: 2,
    minNinjas: 2,
    questions: [
      QUESTIONS["safariparken"],
      QUESTIONS["fiende-styrka"],
      QUESTIONS["element-jord"],
      QUESTIONS["element-vind"],
    ],
  },
  {
    id: "vindhexan",
    name: "Vindhexan",
    kind: "drake",
    element: "vind",
    weakness: "gravitation",
    lat: 59.260408,
    lng: 18.197305,
    locationName: "Lokparken",
    blurb: "Hon hänger i luften över gungorna och skrattar åt dig.",
    hp: 2,
    minNinjas: 2,
    questions: [
      QUESTIONS["lokparken"],
      QUESTIONS["fiende-hjalte"],
      QUESTIONS["element-gravitation"],
      QUESTIONS["element-vind"],
    ],
  },
  {
    id: "elddraken",
    name: "Elddraken",
    kind: "drake",
    element: "eld",
    weakness: "is",
    lat: 59.253578,
    lng: 18.161288,
    locationName: "Flatenbadets utegym",
    blurb: "Luften blir varm och metallen glöder. Något stort rör sig vid stångerna.",
    hp: 3,
    minNinjas: 2,
    questions: [
      QUESTIONS["flatenutegym"],
      QUESTIONS["element-eld"],
      QUESTIONS["element-is"],
      QUESTIONS["fiende-svag"],
      QUESTIONS["fiende-flera"],
    ],
  },
  {
    id: "isbjornen",
    name: "Isbjörnen",
    kind: "varg",
    element: "is",
    weakness: "eld",
    lat: 59.26609,
    lng: 18.199725,
    locationName: "Strålsjöberget",
    blurb: "På bergets topp sitter en vit silhuett. Den har väntat länge.",
    hp: 3,
    minNinjas: 3,
    questions: [
      QUESTIONS["stralsjoberget"],
      QUESTIONS["element-is"],
      QUESTIONS["element-eld"],
      QUESTIONS["fiende-fel"],
      QUESTIONS["fiende-styrka"],
    ],
  },
];

export const ENEMIES_BY_ID: Record<string, Enemy> = Object.fromEntries(
  ENEMIES.map((enemy) => [enemy.id, enemy]),
);
