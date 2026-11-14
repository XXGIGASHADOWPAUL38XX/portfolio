// Captures pleine page à 1440, 900 et 390 px, en sombre et en clair.
// Usage : node scripts/screenshots.mjs <url> <dossier> [--theme-url-light=<url>]
// Le thème est fixé par localStorage (clé « theme »), comme le ferait la bascule de la nav.
// Pour une page qui ne lit pas localStorage, --theme-url-light donne l'URL de sa variante claire.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const WIDTHS = [1440, 900, 390];
const THEMES = ["dark", "light"];

const [url, outDir, ...flags] = process.argv.slice(2);
if (!url || !outDir) {
  console.error("Usage : node scripts/screenshots.mjs <url> <dossier> [--theme-url-light=<url>]");
  process.exit(1);
}
const lightUrl = flags.find((f) => f.startsWith("--theme-url-light="))?.split("=")[1] ?? url;

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
for (const theme of THEMES) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
    const page = await context.newPage();
    await page.goto(theme === "light" ? lightUrl : url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const file = `${outDir}/${theme}-${width}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
    await context.close();
  }
}
await browser.close();
