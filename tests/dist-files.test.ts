import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { htmlFiles, pageExists } from "../scripts/dist-files";

let dist = "";

beforeAll(() => {
  dist = mkdtempSync(join(tmpdir(), "dist-"));
  mkdirSync(join(dist, "mentions-legales"));
  mkdirSync(join(dist, "_astro"));
  writeFileSync(join(dist, "index.html"), "");
  writeFileSync(join(dist, "mentions-legales", "index.html"), "");
  writeFileSync(join(dist, "favicon.svg"), "");
});

describe("htmlFiles", () => {
  it("liste les pages HTML, sous-dossiers compris, et rien d'autre", () => {
    expect(htmlFiles(dist).map((file) => file.slice(dist.length)).sort()).toEqual([
      "/index.html",
      "/mentions-legales/index.html",
    ]);
  });
});

describe("pageExists", () => {
  it("reconnaît un fichier et un dossier qui contient index.html", () => {
    expect(pageExists(dist, "/favicon.svg")).toBe(true);
    expect(pageExists(dist, "/mentions-legales/")).toBe(true);
    expect(pageExists(dist, "/")).toBe(true);
  });

  it("refuse un chemin absent ou un dossier sans index.html", () => {
    expect(pageExists(dist, "/absent/")).toBe(false);
    expect(pageExists(dist, "/_astro/")).toBe(false);
  });
});
