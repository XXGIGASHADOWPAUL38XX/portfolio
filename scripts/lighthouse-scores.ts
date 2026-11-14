/** Les 4 axes Lighthouse exigés par la définition de fini. */
const CATEGORIES = ["performance", "accessibility", "best-practices", "seo"] as const;

interface LighthouseReport {
  finalDisplayedUrl: string;
  categories: Record<string, { score: number | null } | undefined>;
}

/** Axes sous le seuil (0–1) ; un axe absent ou sans score compte pour 0. */
export function failingCategories(report: LighthouseReport, minScore: number): string[] {
  return CATEGORIES.flatMap((id) => {
    const reported = report.categories[id]?.score;
    const score = typeof reported === "number" ? reported : 0;
    const percent = (value: number) => Math.round(value * 100);
    return score < minScore ? [`${report.finalDisplayedUrl} : ${id} ${percent(score)} < ${percent(minScore)}`] : [];
  });
}
