// Vérifie les rapports de « lhci collect » : node scripts/check-lighthouse.ts [dossier]
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { failingCategories } from "./lighthouse-scores.ts";

const MIN_SCORE = 0.95;
const dir = process.argv[2] ?? ".lighthouseci";
const reports = readdirSync(dir).filter((file) => /^lhr-.*\.json$/.test(file));
if (reports.length === 0) {
  console.error(`Aucun rapport Lighthouse dans ${dir}.`);
  process.exit(1);
}
const failures = reports.flatMap((file) => failingCategories(JSON.parse(readFileSync(join(dir, file), "utf8")), MIN_SCORE));
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`${reports.length} rapports Lighthouse : les 4 axes sont ≥ ${MIN_SCORE * 100}.`);
