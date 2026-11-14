/** Ancres des sections, dans l'ordre de la page : les numéros 01, 02… en découlent. */
export const SECTIONS = ["a-la-une", "projets", "parcours", "a-propos", "contact"] as const;
export type SectionId = (typeof SECTIONS)[number];

/** Ancre du hero, cible de « Haut de page ». */
export const TOP_ID = "top";

/** Rang (à partir de 0) sur deux chiffres : 0 → « 01 ». */
export function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function sectionNumber(id: SectionId): string {
  return formatIndex(SECTIONS.indexOf(id));
}

/** Lien interne vers une section. */
export const anchor = (id: SectionId | typeof TOP_ID) => `#${id}`;
