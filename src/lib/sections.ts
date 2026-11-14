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

/** Lien vers une section : « #id » sur l'accueil, « /#id » depuis une autre page. */
export const anchor = (id: SectionId | typeof TOP_ID, from: "home" | "page" = "home") =>
  `${from === "home" ? "" : "/"}#${id}`;

/** Liens de navigation, dans l'ordre de la page ; `sections` : les sections où le lien est « courant ». */
export function navLinks(
  labels: Record<"projets" | "parcours" | "aPropos" | "contact", string>,
  from: "home" | "page" = "home",
): { label: string; href: string; sections: readonly SectionId[] }[] {
  return [
    { label: labels.projets, href: anchor("a-la-une", from), sections: ["a-la-une", "projets"] },
    { label: labels.parcours, href: anchor("parcours", from), sections: ["parcours"] },
    { label: labels.aPropos, href: anchor("a-propos", from), sections: ["a-propos"] },
    { label: labels.contact, href: anchor("contact", from), sections: ["contact"] },
  ];
}

/** Page des mentions légales (format de sortie « directory » d'Astro). */
export const LEGAL_PATH = "/mentions-legales/";
