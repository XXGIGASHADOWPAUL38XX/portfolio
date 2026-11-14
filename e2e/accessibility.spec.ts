import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/mentions-legales/"];
const THEMES = ["dark", "light"] as const;
const WIDTHS = [1440, 390];

for (const path of PAGES) {
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      test(`axe : aucune violation sur ${path} (${theme}, ${width} px)`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
          .analyze();
        expect(results.violations.map((v) => `${v.id} : ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
}

test("aucune requête vers un domaine tiers", async ({ page, baseURL }) => {
  const origins = new Set<string>();
  page.on("request", (request) => origins.add(new URL(request.url()).origin));
  for (const path of PAGES) await page.goto(path, { waitUntil: "networkidle" });
  expect([...origins]).toEqual([new URL(baseURL ?? "").origin]);
});
