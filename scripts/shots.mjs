import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const BASE = "http://localhost:4173";
const OUT = "/tmp/shots";
const ORME = { lat: 59.259443, lng: 18.173173 };

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();

await page.addInitScript(() => {
  const listeners = [];
  window.__pushFix = (fix) => {
    listeners.forEach((cb) =>
      cb({
        coords: {
          latitude: fix.lat,
          longitude: fix.lng,
          accuracy: fix.accuracy ?? 8,
          speed: null,
          heading: null,
        },
        timestamp: fix.timestamp,
      }),
    );
  };
  navigator.geolocation.watchPosition = (success) => {
    listeners.push(success);
    return listeners.length;
  };
});

await page.goto(BASE);
await page.locator(".map-view__gps button").click();

const T = 1_700_000_000_000;
await page.evaluate(
  ({ start, meters, speed, t }) => {
    const steps = Math.ceil(meters / speed);
    for (let i = 0; i <= steps; i++) {
      window.__pushFix({
        lat: start.lat + (i * speed) / 111320,
        lng: start.lng,
        accuracy: 8,
        timestamp: t + i * 1000,
      });
    }
  },
  { start: { lat: ORME.lat - 200 / 111320, lng: ORME.lng }, meters: 180, speed: 1.4, t: T },
);

await page.waitForTimeout(1200);
await page.screenshot({ path: "/tmp/shots/1-karta.png" });

await page.locator('[data-piece="orme"]').click();
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/shots/2-plats.png" });

await page.getByRole("button", { name: "Starta uppdraget" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: "/tmp/shots/3-uppdrag.png" });

await page.locator(".sheet__close").click();
await page.waitForTimeout(400);
await page.getByRole("link", { name: /Samling/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/shots/4-samling.png" });

await page.getByRole("link", { name: /Mer/ }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: "/tmp/shots/5-mer.png" });

await browser.close();
console.log("klart");
