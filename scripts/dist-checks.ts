/**
 * Contrôles du HTML généré (dist/), sans dépendance : utilisés par scripts/verify-dist.ts en CI.
 * Les expressions régulières suffisent ici : le HTML vient du build d'Astro, pas d'une source libre.
 */

/** Groupes capturés par chaque correspondance (le premier défini, pour les alternatives). */
function captures(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].flatMap((match) =>
    match.slice(1).filter((group): group is string => group !== undefined).slice(0, 1),
  );
}

const SCRIPT_OR_STYLE = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const CLASS_OR_STYLE_ATTRIBUTE = /\s(?:class|style)="[^"]*"/gi;
const PLACEHOLDER = /\[[^\]<>"]*\]/g;
const HREF = /<a\b[^>]*\shref="([^"]*)"/gi;
const ID = /\sid="([^"]+)"/g;

/** Contenus « [à remplacer] » restés dans le texte ou les attributs (hors classes, styles et scripts). */
export function findPlaceholders(html: string): string[] {
  const visible = html.replace(SCRIPT_OR_STYLE, "").replace(CLASS_OR_STYLE_ATTRIBUTE, "");
  return [...visible.matchAll(PLACEHOLDER)].map((match) => match[0]);
}

/** Liens sans destination : href="" ou href="#". */
export function findEmptyLinks(html: string): string[] {
  return captures(html, HREF)
    .filter((href) => href === "" || href === "#")
    .map((href) => `href="${href}"`);
}

/**
 * Liens internes cassés : une ancre « #id » sans élément id dans la page,
 * ou un chemin « /… » que `pageExists` ne connaît pas. Les ancres vers une autre page ne sont pas suivies.
 */
export function findBrokenAnchors(html: string, pageExists: (path: string) => boolean): string[] {
  const ids = new Set(captures(html, ID));
  return captures(html, HREF).filter((href) => {
    if (href.startsWith("#") && href.length > 1) return !ids.has(href.slice(1));
    if (href.startsWith("/") && !href.startsWith("//")) return !pageExists(new URL(href, "http://site").pathname);
    return false;
  });
}

const EXTERNAL = /^(?:https?:)?\/\//i;
const RESOURCE_ATTRIBUTE = /<(?:script|img|iframe|source|video|audio)\b[^>]*\ssrc="([^"]+)"|<link\b[^>]*\shref="([^"]+)"/gi;
const CSS_URL = /url\(\s*['"]?([^'")\s]+)/gi;

/** Ressources chargées depuis un autre domaine (scripts, styles, images, polices…), hors liens <a>. */
export function findExternalResources(html: string): string[] {
  return [...captures(html, RESOURCE_ATTRIBUTE), ...captures(html, CSS_URL)].filter((url) => EXTERNAL.test(url));
}

const INLINE_SCRIPT = /<script\b(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;

/** Poids des scripts écrits dans la page, en octets. */
export function inlineScriptBytes(html: string): number {
  return captures(html, INLINE_SCRIPT).reduce((total, script) => total + new TextEncoder().encode(script).length, 0);
}
