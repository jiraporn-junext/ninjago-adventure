import type { QuizQuestion } from "@/types";

/**
 * Faktabaserade frågor är hämtade ur platsernas egna OpenStreetMap-taggar
 * (typ av plats, kommun) så att svaren går att kontrollera mot kartan.
 * Ninjatemafrågorna är eget originalinnehåll.
 */
export const QUESTIONS: Record<string, QuizQuestion> = {
  "kommun-nacka": {
    id: "kommun-nacka",
    q: "Vilken kommun ligger Älta i?",
    options: ["Nacka", "Stockholm", "Tyresö", "Huddinge"],
    answer: 0,
    fact: "Älta tillhör Nacka kommun i Stockholms län, strax sydost om Stockholm.",
  },
  "typ-lekplats": {
    id: "typ-lekplats",
    q: "Vilken typ av plats är det här?",
    options: ["Lekplats", "Badplats", "Fotbollsplan", "Parkering"],
    answer: 0,
    fact: "Platsen är en lekplats enligt OpenStreetMap.",
  },
  "typ-park": {
    id: "typ-park",
    q: "Vilken typ av plats är det här?",
    options: ["Park", "Lekplats", "Tennishall", "Simhall"],
    answer: 0,
    fact: "Platsen är en park enligt OpenStreetMap.",
  },
  "typ-isrink": {
    id: "typ-isrink",
    q: "Vad är Älta ishall för slags anläggning?",
    options: ["Isrink", "Simhall", "Baskethall", "Tennishall"],
    answer: 0,
    fact: "Älta ishall är en isrink där det spelas ishockey och bandy.",
  },
  "typ-badplats": {
    id: "typ-badplats",
    q: "Vad är Flatenbadet?",
    options: ["Badplats vid sjön", "Inomhusbassäng", "Spa", "Simhall"],
    answer: 0,
    fact: "Flatenbadet är en badplats vid Flaten sjö, med strand och brygga.",
  },
  "typ-naturreservat": {
    id: "typ-naturreservat",
    q: "Vad är Älta mosse–Strålsjön?",
    options: ["Naturreservat", "Kampanjplats", "Kommunhus", "Kökcentrum"],
    answer: 0,
    fact: "Älta mosse–Strålsjön är ett naturreservat med myr och skog.",
  },
  "typ-sportcentrum": {
    id: "typ-sportcentrum",
    q: "Vilken typ av plats är Äventyrsbanan?",
    options: ["Sportcentrum", "Kemiska apparaten", "Vinterejd", "Kyrka"],
    answer: 0,
    fact: "Äventyrsbanan är ett sport- och äventyrscenter i Nacka.",
  },
  "typ-idrott": {
    id: "typ-idrott",
    q: "Vad finns på Älta IP?",
    options: ["Idrottsplatser", "Hästdagar", "Skipröjsa", "Fiskekiosk"],
    answer: 0,
    fact: "Älta IP är Nackas stora idrottsplats med bland annat fotboll och friidrott.",
  },
  "om-latta": {
    id: "om-latta",
    q: "Älta är ett område i Nacka. Vad finns i området?",
    options: ["Bostadsområden och grönskog", "Bara kontor", "Enbart industri", "Hav och strand"],
    answer: 0,
    fact: "Älta är ett bostadsområde i östra Nacka, omgivet av Järla sjö och grönskog.",
  },
  "spelets-regel": {
    id: "spelets-regel",
    q: "Vad måste du göra för att få en ninjagubbe?",
    options: [
      "Göra uppdrag",
      "Betala pengar",
      "Hitta den och ta med den hem",
      "Vänta på att den dyker upp",
    ],
    answer: 0,
    fact: "Ninjagubbarna är belöningen. Du hittar gubben på platsen och gör sedan uppdraget.",
  },
  "element-blixt": {
    id: "element-blixt",
    q: "Vilket element hör till den gula ninjagubben?",
    options: ["Blixt", "Is", "Jord", "Vind"],
    answer: 0,
    fact: "Gult betyder blixt i Ninjago Adventure. Det är den snabbaste av elementen.",
  },
  "element-gravitation": {
    id: "element-gravitation",
    q: "Vilket element hör till den lila ninjagubben?",
    options: ["Gravitation", "Eld", "Vatten", "Teknik"],
    answer: 0,
    fact: "Lila betyder gravitation. Den gubben drar till sig saker.",
  },
  "avstand": {
    id: "avstand",
    q: "Hur närmare dig måste du vara för att ett uppdrag ska låsa upp?",
    options: ["Inom 40 meter", "Inom 4 kilometer", "Precis på metern", "Från andra sidan staden"],
    answer: 0,
    fact: "Du måste vara inom 40 meter från platsen för att kunna starta uppdraget.",
  },
};
