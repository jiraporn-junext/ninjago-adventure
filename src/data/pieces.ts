import type { Piece } from "@/types";
import { QUESTIONS } from "./questions";

/**
 * Seed-data: tolv ninjagubbar på riktiga platser i Älta, Nacka.
 * Koordinaterna kommer ur OpenStreetMap (Overpass) och är centrerade på
 * platsen, inte på parkering eller ingång.
 */
export const PIECES: Piece[] = [
  {
    id: "orme",
    name: "Kenta",
    element: "eld",
    lat: 59.259443,
    lng: 18.173173,
    locationName: "Ormparken",
    blurb: "En liten lekpark gömd bland träden, alldeles intill Sjön.",
    steps: [
      { id: "orme-walk", kind: "walk", meters: 250, label: "Gå 250 meter i området" },
      { id: "orme-quiz", kind: "quiz", questions: [QUESTIONS["typ-lekplats"], QUESTIONS["om-latta"]] },
    ],
  },
  {
    id: "alta-ip",
    name: "Rasmus",
    element: "blixt",
    lat: 59.263119,
    lng: 18.178559,
    locationName: "Älta IP",
    blurb: "Nackas stora idrottsplats, där man tränar inför tävlingar.",
    steps: [
      { id: "alta-ip-walk", kind: "walk", meters: 400, label: "Gå 400 meter runt idrottsplatsen" },
    ],
  },
  {
    id: "ishall",
    name: "Fia",
    element: "is",
    lat: 59.259144,
    lng: 18.179686,
    locationName: "Älta ishall",
    blurb: "Is under skorna, och lite skrik från lagens supportrar.",
    steps: [
      { id: "ishall-quiz", kind: "quiz", questions: [QUESTIONS["typ-isrink"], QUESTIONS["kommun-nacka"]] },
    ],
  },
  {
    id: "strandparken",
    name: "Alma",
    element: "vatten",
    lat: 59.259675,
    lng: 18.173077,
    locationName: "Strandparken",
    blurb: "Gräs och grenar precis vid stranden.",
    steps: [
      { id: "strandparken-photo", kind: "photo", prompt: "Fota stranden och skicka med bilden!" },
    ],
  },
  {
    id: "solbergaparken",
    name: "Stig",
    element: "vind",
    lat: 59.256119,
    lng: 18.192204,
    locationName: "Solbergaparken",
    blurb: "Lekplats med en stor rutschkana och gott om skugga.",
    steps: [
      { id: "solbergaparken-walk", kind: "walk", meters: 300, label: "Gå 300 meter i parken" },
      { id: "solbergaparken-photo", kind: "photo", prompt: "Ta ett foto av rutschkan!" },
    ],
  },
  {
    id: "sigfridsborg",
    name: "Nilla",
    element: "teknik",
    lat: 59.259166,
    lng: 18.194315,
    locationName: "Sigfridsborgs lekplats",
    blurb: "Gammal gård med en modern lekplats i trädgården.",
    steps: [
      { id: "sigfridsborg-quiz", kind: "quiz", questions: [QUESTIONS["typ-lekplats"], QUESTIONS["spelets-regel"]] },
    ],
  },
  {
    id: "evalund",
    name: "Olle",
    element: "jord",
    lat: 59.256534,
    lng: 18.192592,
    locationName: "Evalund",
    blurb: "En lugn park där gräset är mjukt och stigen går genom.",
    steps: [
      { id: "evalund-walk", kind: "walk", meters: 200, label: "Gå 200 meter genom parken" },
    ],
  },
  {
    id: "haxparken",
    name: "Vera",
    element: "gravitation",
    lat: 59.258116,
    lng: 18.205621,
    locationName: "Häxparken",
    blurb: "Häxor och troll, eller bara en lekplats med bra namn.",
    steps: [
      { id: "haxparken-photo", kind: "photo", prompt: "Fota något som en riktig ninjagubbe!" },
      { id: "haxparken-walk", kind: "walk", meters: 300, label: "Gå 300 meter i området" },
    ],
  },
  {
    id: "biparken",
    name: "Hugo",
    element: "eld",
    lat: 59.255629,
    lng: 18.204471,
    locationName: "Biparken",
    blurb: "Lekplatsen där barnen springer i varje riktning samtidigt.",
    steps: [
      { id: "biparken-quiz", kind: "quiz", questions: [QUESTIONS["typ-lekplats"], QUESTIONS["element-blixt"]] },
      { id: "biparken-photo", kind: "photo", prompt: "Fota lekplatsen!" },
    ],
  },
  {
    id: "flatenbadet",
    name: "Maja",
    element: "vatten",
    lat: 59.252828,
    lng: 18.159133,
    locationName: "Flatenbadet",
    blurb: "Badplats vid Flaten, med brygga och grunt vatten.",
    steps: [
      { id: "flatenbadet-walk", kind: "walk", meters: 500, label: "Gå 500 meter längs stranden" },
    ],
  },
  {
    id: "alta-mosse",
    name: "Bosse",
    element: "is",
    lat: 59.266381,
    lng: 18.190011,
    locationName: "Älta mosse–Strålsjön",
    blurb: "Myrmark och skog, där naturen får bestämma.",
    steps: [
      { id: "alta-mosse-quiz", kind: "quiz", questions: [QUESTIONS["typ-naturreservat"], QUESTIONS["element-gravitation"]] },
      { id: "alta-mosse-walk", kind: "walk", meters: 350, label: "Gå 350 meter på stigen" },
    ],
  },
  {
    id: "aventyrsbanan",
    name: "Elsa",
    element: "teknik",
    lat: 59.280648,
    lng: 18.183391,
    locationName: "Äventyrsbanan",
    blurb: "Hinderbana i skogen, där det är full fart från början.",
    steps: [
      { id: "aventyrsbanan-walk", kind: "walk", meters: 400, label: "Gå 400 meter genom banan" },
      { id: "aventyrsbanan-quiz", kind: "quiz", questions: [QUESTIONS["typ-sportcentrum"], QUESTIONS["avstand"]] },
    ],
  },
];

export const PIECES_BY_ID: Record<string, Piece> = Object.fromEntries(
  PIECES.map((piece) => [piece.id, piece]),
);
