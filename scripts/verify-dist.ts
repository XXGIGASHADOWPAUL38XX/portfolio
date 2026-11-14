// Vérifie le site généré : node scripts/verify-dist.ts [--allow-placeholders]
// Échoue (code 1) si dist/ contient un contenu [à remplacer], un lien vide ou cassé,
// une ressource d'un autre domaine, ou plus de 5 ko de JavaScript client par page.
import { readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  findBrokenAnchors,
  findEmptyLinks,
  findExternalResources,
  findPlaceholders,
  inlineScriptBytes,
} from "./dist-checks.ts";
import { htmlFiles, pageExists } from "./dist-files.ts";

const DIST = "dist";
const MAX_CLIENT_JS_BYTES = 5 * 1024;
const allowPlaceholders = process.argv.includes("--allow-placeholders");

const externalScriptBytes = (html: string) =>
  [...html.matchAll(/<script\b[^>]*\ssrc="(\/[^"]+)"/gi)].reduce(
    (total, match) => total + statSync(join(DIST, match[1] ?? "")).size,
    0,
  );

const problems: string[] = [];
for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, "utf8");
  const page = relative(DIST, file);
  const report = (label: string, items: string[]) => {
    for (const item of items) problems.push(`${page} : ${label} ${item}`);
  };
  if (!allowPlaceholders) report("contenu à remplacer", findPlaceholders(html));
  report("lien vide", findEmptyLinks(html));
  report("lien cassé", findBrokenAnchors(html, (path) => pageExists(DIST, path)));
  report("ressource tierce", findExternalResources(html));
  const jsBytes = inlineScriptBytes(html) + externalScriptBytes(html);
  if (jsBytes >= MAX_CLIENT_JS_BYTES) problems.push(`${page} : ${jsBytes} octets de JS client (max ${MAX_CLIENT_JS_BYTES})`);
  console.log(`${page} : ${jsBytes} octets de JS client`);
}

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`dist/ vérifié${allowPlaceholders ? " (contenus à remplacer tolérés)" : ""} : aucun problème.`);
