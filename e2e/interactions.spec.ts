import { expect, test } from "@playwright/test";

test.describe("thème", () => {
  test("suit la préférence système sans choix enregistré", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("bascule au clic, l'annonce par aria-pressed et garde le choix", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Thème clair" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await toggle.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  test("le bouton reste masqué sans JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("[data-theme-toggle]")).toBeHidden();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await context.close();
  });
});

test.describe("navigation", () => {
  test("marque le lien de la section affichée", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Navigation principale" });
    await page.locator("#parcours").scrollIntoViewIfNeeded();
    await expect(nav.getByRole("link", { name: "Parcours" })).toHaveAttribute("aria-current", "location");
    await page.locator("#projets").scrollIntoViewIfNeeded();
    await expect(nav.getByRole("link", { name: "Projets" })).toHaveAttribute("aria-current", "location");
    await expect(nav.locator("[aria-current]")).toHaveCount(1);
  });

  test("le lien d'évitement apparaît au clavier et mène au contenu", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Aller au contenu" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#contenu$/);
  });

  test("tout élément interactif est atteint au clavier, avec un focus visible", async ({ page }) => {
    await page.goto("/");
    const expected = await page
      .locator("a[href], button:not([hidden]), [tabindex='0']")
      .evaluateAll((elements) =>
        elements
          .filter((element) => element.getClientRects().length > 0)
          .map((element, i) => {
            element.setAttribute("data-kb", String(i));
            return `${i} ${element.textContent?.trim().slice(0, 30)}`;
          }),
      );
    const reached = new Set<string>();
    for (let i = 0; i < expected.length + 3; i++) {
      await page.keyboard.press("Tab");
      const focus = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element?.dataset.kb) return null;
        return { kb: element.dataset.kb, outline: getComputedStyle(element).outlineStyle };
      });
      if (!focus) continue;
      expect(focus.outline, `focus visible sur ${focus.kb}`).toBe("solid");
      reached.add(focus.kb);
    }
    expect(expected.filter((label) => !reached.has(label.split(" ")[0] ?? ""))).toEqual([]);
  });

  test("≤ 720 px : liens de la nav masqués, sous-navigation affichée", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Parcours" })).toBeHidden();
    await expect(page.getByRole("navigation", { name: "Sections" })).toBeVisible();
  });
});

test.describe("pixels", () => {
  test("s'allument quand l'illustration entre à l'écran", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const cover = page.locator("#projets svg.px-reveal").first();
    await expect(cover).not.toHaveClass(/is-in/);
    await cover.scrollIntoViewIfNeeded();
    await expect(cover).toHaveClass(/is-in/);
    await expect(cover.locator("rect").last()).toHaveCSS("opacity", "1", { timeout: 3000 });
  });

  test("restent affichés sans animation avec prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const rect = page.locator("#projets svg.px-reveal rect").first();
    await expect(rect).toHaveCSS("opacity", "1");
    await expect(page.locator("html")).not.toHaveClass(/px-motion/);
  });
});
