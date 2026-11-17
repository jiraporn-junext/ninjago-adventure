import { expect, test } from "@playwright/test";
import { installFakeGeolocation, offsetMeters, pushFix, pushWalk } from "./geolocation";

const SKOGSHYDDAN = { lat: 59.264405, lng: 18.211749 };
const START_TIMESTAMP = 1_700_000_000_000;

/** En sparfil där blixtninjan Rasmus redan ligger i samlingen. */
const SAVE_WITH_RAZMUS = {
  version: 2,
  pieces: {
    "alta-ip": { status: "owned", stepIndex: 0, steps: {} },
  },
  enemies: {},
  totalWalkMeters: 0,
  updatedAt: START_TIMESTAMP,
};

test.beforeEach(async ({ page }) => {
  await installFakeGeolocation(page);
});

test.afterEach(async ({ page }) => {
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  });
});

test("fiender syns på kartan och kan besegras med samlade ninjor", async ({ page }) => {
  await page.addInitScript((save) => {
    window.localStorage.setItem("ninjago-adventure:v1:state", JSON.stringify(save));
  }, SAVE_WITH_RAZMUS);

  await page.goto("/");
  await page.locator(".map-view__gps button").click();

  // 200 meter bort syns fienden.
  await pushFix(page, offsetMeters(SKOGSHYDDAN, -200), START_TIMESTAMP);
  await expect(page.locator('[data-enemy="skuggvargen"]')).toBeVisible({ timeout: 10_000 });

  // Gå fram till fienden så att striden kan startas.
  await pushWalk(page, offsetMeters(SKOGSHYDDAN, -200), 180, 1.4, START_TIMESTAMP);
  await page.locator('[data-enemy="skuggvargen"]').click();

  await expect(page.locator(".battle__name")).toHaveText("Skuggvargen");
  await expect(page.locator(".battle__weakness")).toContainText("svag mot blixtninja");

  // Välj den samlade ninjan och fighta.
  await page.locator(".battle__fighter", { hasText: "Rasmus" }).click();
  await expect(page.locator(".battle__question")).toHaveText("Vad är Skogshyddan?");

  await page.getByRole("button", { name: "En picknickplats i skogen" }).click();
  await expect(page.locator(".battle__feedback")).toContainText("Träff!");
  await page.getByRole("button", { name: "Nästa fråga" }).click();

  await page.getByRole("button", { name: "Att en ninja med det elementet ger mer skada" }).click();
  await expect(page.locator(".battle__result--won")).toContainText("Skuggvargen är besegrad!");

  // Fienden ska vara krossad på kartan och ninjan starkare.
  await page.locator(".battle").getByRole("button", { name: "Stäng" }).click();
  await expect(page.locator('[data-enemy="skuggvargen"] .enemy-badge')).toBeVisible();

  await page.getByRole("link", { name: /Samling/ }).click();
  await expect(page.locator(".piece-card__power")).toHaveText("Styrka 2");
});

test("fienden syns inte långt bort", async ({ page }) => {
  await page.goto("/");
  await page.locator(".map-view__gps button").click();

  await pushFix(page, offsetMeters(SKOGSHYDDAN, -2000), START_TIMESTAMP);

  await expect(page.locator('[data-enemy="skuggvargen"]')).toHaveCount(0);
});

test("utan ninjor går det inte att utmana en fiende", async ({ page }) => {
  await page.goto("/");
  await page.locator(".map-view__gps button").click();

  await pushWalk(page, offsetMeters(SKOGSHYDDAN, -200), 180, 1.4, START_TIMESTAMP);
  await page.locator('[data-enemy="skuggvargen"]').click();

  await expect(page.locator(".battle__requirements")).toContainText("du har 0");
  await expect(page.locator(".battle__hint")).toContainText("Älta IP");
  await expect(page.locator(".battle__fighters")).toHaveCount(0);
});
