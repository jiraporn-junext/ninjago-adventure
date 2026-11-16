import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = resolve(root, "public/icons");

const TARGETS = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "maskable-icon-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
];

const svg = await readFile(resolve(root, "public/icon.svg"), "utf8");
await mkdir(iconsDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage();

for (const target of TARGETS) {
  // Maskable ikoner behöver ett säkerhetsutrymme så att ingen detalj kapas.
  const padding = target.maskable ? 0.14 : 0;

  await page.setViewportSize({ width: target.size, height: target.size });
  await page.setContent(
    `<html><body style="margin:0;background:#0f172a;display:grid;place-items:center;height:${target.size}px;overflow:hidden">
       <div style="width:${Math.round(target.size * (1 - padding * 2))}px;height:${Math.round(target.size * (1 - padding * 2))}px">
         ${svg.replace('width="512" height="512"', `width="100%" height="100%"`)}
       </div>
     </body></html>`,
  );

  const buffer = await page.screenshot({ omitBackground: false });
  await writeFile(resolve(iconsDir, target.file), buffer);
  console.log(`Skrev ${target.file} (${target.size}x${target.size})`);
}

await browser.close();
