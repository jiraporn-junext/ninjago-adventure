import { expect, test } from "@playwright/test";
import { installFakeGeolocation, offsetMeters, pushFix, pushWalk } from "./geolocation";

const ORME = { lat: 59.259443, lng: 18.173173 };
const HAXPARKEN = { lat: 59.258116, lng: 18.205621 };

test.beforeEach(async ({ page }) => {
  await installFakeGeolocation(page);
});

test.afterEach(async ({ page }) => {
  await page.evaluate(async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  });
});

test("kartan laddar och gubben visas", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator(".app-shell__title")).toHaveText("Ninjago Adventure");
  await expect(page.locator(".avatar-marker")).toBeVisible();
  await expect(page.getByRole("link", { name: /Karta/ })).toBeVisible();

  // Kartan måste ha en faktisk höjd, annars syns inga brickor alls.
  const size = await page.locator(".game-map").evaluate((el) => ({
    width: el.clientWidth,
    height: el.clientHeight,
  }));
  expect(size.height).toBeGreaterThan(200);
});

test("uppdraget kan fullbordas och gubben hamnar i samlingen", async ({ page }) => {
  await page.goto("/");

  await page.locator(".map-view__gps button").click();

  const startTimestamp = 1_700_000_000_000;
  const approach = offsetMeters(ORME, -200);

  // 200 meter bort: bara frågetecknet syns.
  await pushFix(page, approach, startTimestamp);
  await expect(page.locator('.piece-hint[data-piece="orme"]')).toBeVisible();

  // Gå fram till gubben. Positionen utjämnas, så enstaka fixar räcker inte.
  await pushWalk(page, approach, 180, 1.4, startTimestamp);
  await expect(page.locator('.piece-figure[data-piece="orme"]')).toBeVisible({ timeout: 10_000 });

  // Öppna gubben och starta uppdraget.
  await page.locator('[data-piece="orme"]').click();
  await expect(page.getByRole("button", { name: "Starta uppdraget" })).toBeEnabled();
  await page.getByRole("button", { name: "Starta uppdraget" }).click();

  // Steg ett: gå 250 meter.
  await expect(page.locator(".walk-step__count")).toContainText("/ 250 m");

  await pushWalk(page, offsetMeters(ORME, -20), 320, 1.4, startTimestamp + 130_000);

  // Gångsteget är klart och panelen går vidare till quizet.
  await expect(page.locator(".mission__step").first().locator(".mission__step-index")).toHaveText("✓", {
    timeout: 10_000,
  });
  await expect(page.locator(".mission__step--current .mission__step-title")).toContainText("Quiz");

  // Steg två: quizet.
  await page.getByRole("button", { name: "Lekplats" }).click();
  await expect(page.getByText("Rätt!")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Nästa fråga" }).click();

  await page.getByRole("button", { name: "Bostadsområden och grönskog" }).click();
  await expect(page.getByText("Rätt!")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Klart" }).click();
  await expect(page.getByText("Kenta är din!")).toBeVisible({ timeout: 10_000 });

  // Gubben ska nu finnas i samlingen.
  await page.locator(".sheet__close").click();
  await page.getByRole("link", { name: /Samling/ }).click();
  await expect(page.getByText("Kenta")).toBeVisible();
  await expect(page.getByText("Ormparken")).toBeVisible();
});

test("framsteg överlever en omladdning", async ({ page }) => {
  await page.goto("/");
  await page.locator(".map-view__gps button").click();

  const startTimestamp = 1_700_000_000_000;
  const approach = offsetMeters(ORME, -200);

  await pushFix(page, approach, startTimestamp);
  await pushWalk(page, approach, 180, 1.4, startTimestamp);
  await expect(page.locator('.piece-figure[data-piece="orme"]')).toBeVisible({ timeout: 10_000 });

  await page.locator('[data-piece="orme"]').click();
  await page.getByRole("button", { name: "Starta uppdraget" }).click();

  await expect(page.locator(".walk-step__count")).toContainText("/ 250 m");

  await page.reload();
  await page.locator(".map-view__gps button").click();

  await page.getByRole("link", { name: /Uppdrag/ }).click();
  await expect(page.getByText("Ormparken")).toBeVisible();
  await expect(page.getByText("0/2 steg klara")).toBeVisible();
});

test("gubbar långt bort syns inte på kartan", async ({ page }) => {
  await page.goto("/");
  await page.locator(".map-view__gps button").click();

  await pushFix(page, offsetMeters(ORME, -2000), 1_700_000_000_000);

  await expect(page.locator('[data-piece="orme"]')).toHaveCount(0);
  await expect(page.locator('[data-piece="flatenbadet"]')).toHaveCount(0);
});

test("fotosteget sparar bilden och gubben blir din", async ({ page }) => {
  await page.goto("/");
  await page.locator(".map-view__gps button").click();

  const startTimestamp = 1_700_000_000_000;
  const approach = offsetMeters(HAXPARKEN, -200);

  await pushFix(page, approach, startTimestamp);
  await pushWalk(page, approach, 180, 1.4, startTimestamp);
  await expect(page.locator('.piece-figure[data-piece="haxparken"]')).toBeVisible({
    timeout: 10_000,
  });

  await page.locator('[data-piece="haxparken"]').click();
  await page.getByRole("button", { name: "Starta uppdraget" }).click();

  // Steg ett: fota platsen.
  await page.locator(".photo-step__input").setInputFiles("tests/e2e/fixtures/photo.png");
  await expect(page.getByText("Fota något som en riktig ninjagubbe!")).toHaveCount(0, {
    timeout: 10_000,
  });

  // Steg två: gå 300 meter.
  await expect(page.locator(".walk-step__count")).toBeVisible({ timeout: 10_000 });
  await pushWalk(page, HAXPARKEN, 320, 1.4, startTimestamp + 130_000);

  await expect(page.getByText("Vera är din!")).toBeVisible({ timeout: 10_000 });

  // Fotot ska finnas kvar i samlingen.
  await page.locator(".sheet__close").click();
  await page.getByRole("link", { name: /Samling/ }).click();
  await expect(page.getByText("Vera")).toBeVisible();
  await expect(page.locator(".piece-card__photo")).toBeVisible();
});
