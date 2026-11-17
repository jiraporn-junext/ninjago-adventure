# Ninjago Adventure i Älta

Ett platsbasat spel där du går runt i verkligheten med telefonen. En ninjagubbe i
spelet rör sig i takt med din GPS, och ninjagubbar sitter på riktiga platser runt
Älta i Nacka. **Du gör uppdragen — gubbarna är belöningen.**

Varje gubbe har sitt eget uppdrag med ett eller flera steg:

- **Gå X meter** – promenaden räknas automatiskt, GPS-drift räknas inte.
- **Quiz** – flervalsfrågor om platsen och om ninjatemaet.
- **Fota platsen** – kameran öppnas och bilden sparas i samlingen.

Ingen backend, ingen databas, inga konton. Allt ligger i webbläsarens lagring på
din telefon, och spelet är en installerbar PWA som fungerar offline.

## Fiender

Utanför gubbarna finns **fiender** utspridda på samma riktiga platser. En fiend
syns på kartan när du är inom 250 meter, och du kan bara utmana den när du
står vid den.

För att besegra en fiend behöver du de ninjagubbar du redan har samlat:

- **Rätt element** - varje fiend är svag mot ett element. Fighta med en ninja
  med det elementet, annars går det inte att utmana den.
- **Tillräckligt många ninjor** - de starkare fienderna kräver att du har
  samlat flera gubbar.

Striden går till så här:

1. Fienden ställer frågor. Ett **rätt svar** ger fienden skada.
2. Ett **fel svar** ger fienden ett svep - din ninja har tre hjärtskärvor att
   spendera. Frågan står kvar, så du kan försöka igen.
3. När fiendens hälsa är noll är den besegrad. Ninjan du fightade med blir
   **starkare** (styrka 1 från början), och en starkare ninja träffar hårdare.

Förlorar du får du försöka igen - fienden blir inte svagare av att du gissar.

## Kom igång

```bash
npm install
npm run dev          # utvecklingsserver på http://localhost:5173
npm run build        # bygger till dist/ och genererar service worker
npm run preview      # kör bygget lokalt på http://localhost:4173
```

GPS kräver en säker kontext. `localhost` räknas som säker, så `npm run preview`
fungerar i datorns webbläsare. Adressen `http://192.168.x.x` räknas **inte** som
säker och webbläsaren kommer därför att blockera GPS på telefonen.

### Tester

```bash
npm test             # enhetstester för geologi och driftfiltret
npm run test:e2e     # Playwright med mockad GPS
npm run typecheck
```

## Ta spelet på telefonen

Spelet är en statisk webbapp, så det räcker med en HTTPS-adress. Tre vägar:

### 1. Netlify Drop (enklast)

```bash
npm run build
```

Dra sedan `dist/` till [app.netlify.com/drop](https://app.netlify.com/drop). Du
får en permanent HTTPS-adress direkt. Öppna den i Chrome på din Android-telefon
och tryck **Installera** i toppen (eller menyn ⋮ → *Lägg till på startskärmen*).
Appen ligger då på startskärmen och fungerar även utan nät.

### 2. Cloudflare Pages eller GitHub Pages

Samma sak, men via respektive plattforms vanliga flöde. `dist/` är allt som
behövs publiceras. `public/_redirects` ser till att appen fungerar när man
bookmärker en djupare route.

### 3. Tunnel under utveckling

```bash
npm run preview
cloudflared tunnel --url http://localhost:4173
```

Ger en HTTPS-adress direkt, men tunneln måste vara igång under promenaden.

## Projektstruktur

```
src/
├── components/
│   ├── figures/     NinjaFigure och EnemyFigure - egna figurerna i SVG
│   ├── map/         GameMap - Leaflet, följande kamera, markörer
│   ├── mission/     MissionPanel, WalkStep, QuizStep, PhotoStep
│   ├── battle/      EnemyBattle - striden mot en fiend
│   └── collection/  PieceCard
├── data/            pieces.ts (gubbar), enemies.ts (fiender), questions.ts, themes.ts
├── types.ts         Typerna för gubbar, fiender, steg och sparfiler
├── lib/
│   ├── battle.ts    Stridsreglerna - ren logik utan Vue
│   ├── enemyMarkup.ts Fiendefigurerna som markup-sträng
│   ├── geo/         geoMath, positionTracker, useGeolocation
│   ├── photos/      capture - nedskalning av kamerabilder
│   └── storage/     localState, photosDb
├── stores/          gameStore (framsteg), geoStore (position)
└── views/           MapView, MissionsView, CollectionView, SettingsView
```

### Lägga till fler gubbar

Allt innehåll ligger i `src/data/pieces.ts`. En gubbe behöver ett id, ett namn,
ett element, koordinater, en platsnamn, en beskrivning och en lista med steg:

```ts
{
  id: "ny-plats",
  name: "Sixten",
  element: "vind",
  lat: 59.2595,
  lng: 18.174,
  locationName: "Ny lekplats",
  blurb: "En ny plats att upptäcka.",
  steps: [
    { id: "ny-plats-walk", kind: "walk", meters: 250, label: "Gå 250 meter" },
    { id: "ny-plats-quiz", kind: "quiz", questions: [QUESTIONS["typ-lekplats"]] },
  ],
}
```

Koordinaterna för de befintliga gubbarna kommer ur OpenStreetMap (Overpass) och
ligger centrerade på platsen. En gubbe som hamnar fel i kartan förstör
spelloopen, så kontrollera koordinaten på plats innan du lägger till den.

### Lägga till fler fiender

Fienderna ligger i `src/data/enemies.ts`. En fiend behöver ett id, ett namn, en
silhuett (`varg`, `golem` eller `drake`), ett element, det element den är svag
mot, koordinater, ett platsnamn, en beskrivning, hälsa, antal ninjagubbar som
krävs och en frågelista:

```ts
{
  id: "ny-fiend",
  name: "Ny fiend",
  kind: "varg",
  element: "vind",         // hur fienden ser ut
  weakness: "jord",        // elementet den är svag mot
  lat: 59.2595,
  lng: 18.174,
  locationName: "Ny plats",
  blurb: "Beskrivning av fienden.",
  hp: 2,                   // antal rätta svar som krävs
  minNinjas: 1,            // minst så många gubbar i samlingen
  questions: [QUESTIONS["typ-park"]],
}
```

Frågelistan måste rymma minst `hp` frågor - en ninja med styrka 1 behöver `hp`
rätta svar för att besegra fienden.

## Så fungerar GPS-mätningen

Det svåraste i spelet är att veta hur långt spelaren faktiskt gått. En
stillastående telefon rör sig "flera meter" i hopa spridda GPS-fixar, så
distansen kan inte räknas direkt mellan råa fixar.

`src/lib/geo/positionTracker.ts` gör det i tre steg:

1. **Filtrera** – fixar med sämre noggrannhet än 30 m kastas, och hopp snabbare
   än 8 m/s avvisas som GPS-glapp (bil, tunnel).
2. **Utjämna** – positionen filtreras med ett tidsviktat medelvärde (EMA) med
   tidskonstant 2 s.
3. **Bekräfta rörelse** – rörelse räknas bara om farten är minst 0,5 m/s, den
   går i en riktning (nettoförflyttning/sträcka över ett 20-sekundersfönster är
   minst 0,5) och förflyttningen är större än GPS-noggrannheten.

Drift sprids åt alla håll och har låg riktning, så den filtreras bort. En riktig
promenad har hög riktning och räknas. Enhetstesterna i
`positionTracker.spec.ts` täcker båda fallen.

## Kända begränsningar

- **Ingen backup i molnet.** Framsteget ligger bara på telefonen. Ladda ner en
  sparfil under *Mer* ibland, annars kan webbläsaren rensa den.
- **Offline-karta saknas.** OpenStreetMaps policy tillåter inte att brickor
  cachas för offline-bruk, så kartan kräver nät. Spelet i sig fungerar offline.
- **Skärmen måste vara tänd** under en promenad, annars pausas appen och GPS:en
  stannar. Spelet använder Wake Lock där webbläsaren stöder det.
- **Karaktärerna är egna.** Figurerna är original i LEGO-inspirerad stil. Inga
  Ninjago-logotyper eller officiella karaktärer används.
