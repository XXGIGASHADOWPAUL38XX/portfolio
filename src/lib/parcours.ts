import type { Placeholder } from "./content-fields";

type Year = number | Placeholder;

interface Period {
  debut: Year;
  fin: Year | null;
}

/** « 2024 → auj. » quand la période est en cours, « 2023 → 2024 » sinon. */
export function formatPeriod({ debut, fin }: Period, today: string): string {
  return `${debut} → ${fin === null ? today : fin}`;
}

export function isOngoing({ fin }: Pick<Period, "fin">): boolean {
  return fin === null;
}

/** Une année à remplacer passe après les années connues ; « en cours » passe avant tout. */
const yearRank = (year: Year): number => (typeof year === "number" ? year : -Infinity);
const endRank = (fin: Year | null): number => (fin === null ? Infinity : yearRank(fin));

/** Du plus récent au plus ancien : fin décroissante (en cours d'abord), puis début décroissant. */
export function sortByRecency<T extends Period>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => endRank(b.fin) - endRank(a.fin) || yearRank(b.debut) - yearRank(a.debut));
}
