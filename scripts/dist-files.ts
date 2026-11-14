import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/** Tous les fichiers .html sous `dir`, récursivement. */
export function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

/** Un chemin du site existe dans `dist` : un fichier, ou un dossier avec index.html. */
export function pageExists(dist: string, path: string): boolean {
  const target = join(dist, path);
  return existsSync(target) && (statSync(target).isFile() || existsSync(join(target, "index.html")));
}
