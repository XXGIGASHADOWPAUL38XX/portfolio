import { describe, expect, it } from "vitest";
import { failingCategories } from "../scripts/lighthouse-scores";

const report = (scores: Record<string, number | null>) => ({
  finalDisplayedUrl: "http://localhost/index.html",
  categories: Object.fromEntries(Object.entries(scores).map(([id, score]) => [id, { title: id, score }])),
});

describe("failingCategories", () => {
  it("ne signale rien quand les 4 axes atteignent le seuil", () => {
    const lhr = report({ performance: 0.95, accessibility: 1, "best-practices": 1, seo: 0.99 });
    expect(failingCategories(lhr, 0.95)).toEqual([]);
  });

  it("signale chaque axe sous le seuil, en pourcentage", () => {
    const lhr = report({ performance: 0.94, accessibility: 1, "best-practices": 0.5, seo: 1 });
    expect(failingCategories(lhr, 0.95)).toEqual([
      "http://localhost/index.html : performance 94 < 95",
      "http://localhost/index.html : best-practices 50 < 95",
    ]);
  });

  it("signale un axe absent ou sans score", () => {
    const lhr = report({ performance: null, accessibility: 1, "best-practices": 1 });
    expect(failingCategories(lhr, 0.95)).toEqual([
      "http://localhost/index.html : performance 0 < 95",
      "http://localhost/index.html : seo 0 < 95",
    ]);
  });
});
