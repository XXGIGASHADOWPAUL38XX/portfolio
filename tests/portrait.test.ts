import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ditherToSprite, loadPortraitSprite } from "../src/lib/portrait";
import { SHADES } from "../src/lib/sprites";

describe("ditherToSprite", () => {
  it("allume le blanc et éteint le noir", () => {
    expect(ditherToSprite(Uint8Array.from([255, 0, 0, 255]), 2, 2, ".#")).toEqual(["#.", ".#"]);
  });

  it("allume à partir du seuil de 128", () => {
    expect(ditherToSprite(Uint8Array.from([128]), 1, 1, ".#")).toEqual(["#"]);
    expect(ditherToSprite(Uint8Array.from([127]), 1, 1, ".#")).toEqual(["."]);
  });

  it("reporte 7/16 de l'erreur à droite", () => {
    // 100 éteint (erreur 100) ; voisin : 100 + 43,75 = 143,75 → allumé.
    expect(ditherToSprite(Uint8Array.from([100, 100]), 2, 1, ".#")).toEqual([".#"]);
  });

  it("reporte 5/16 de l'erreur en dessous", () => {
    // 100 + 31,25 = 131,25 → allumé.
    expect(ditherToSprite(Uint8Array.from([100, 100]), 1, 2, ".#")).toEqual([".", "#"]);
  });

  it("reporte 3/16 de l'erreur en bas à gauche", () => {
    // (1,0) = 100 éteint : (0,1) reçoit 18,75 → 110 + 18,75 = 128,75 → allumé.
    expect(ditherToSprite(Uint8Array.from([0, 100, 110, 0]), 2, 2, ".#")).toEqual(["..", "#."]);
  });

  it("reporte 1/16 de l'erreur en bas à droite", () => {
    // (0,0) = 64 éteint : (1,1) reçoit 4 → 124 + 4 = 128 → allumé ; (1,0) = 0 + 28 reste éteint
    // et renvoie 28 × 5/16 = 8,75 de plus vers (1,1) ; (0,1) = 0 + 20 renvoie 8,75 à droite.
    expect(ditherToSprite(Uint8Array.from([64, 0, 0, 107]), 2, 2, ".#")).toEqual(["..", ".#"]);
    expect(ditherToSprite(Uint8Array.from([0, 0, 0, 127]), 2, 2, ".#")).toEqual(["..", ".."]);
  });

  it("ne déborde pas d'une ligne à la suivante ni hors de l'image", () => {
    // L'erreur du dernier pixel d'une ligne ne doit pas « sauter » au début de la ligne suivante.
    expect(ditherToSprite(Uint8Array.from([0, 120, 120, 0]), 2, 2, ".#")).toEqual(["..", ".."].map((row, y) => (y === 1 ? "#." : row)));
    expect(ditherToSprite(Uint8Array.from([0, 0, 0, 120]), 2, 2, ".#")).toEqual(["..", ".."]);
  });

  it("produit la trame de référence d'un dégradé", () => {
    const width = 8;
    const height = 4;
    const gradient = Uint8Array.from({ length: width * height }, (_, i) => Math.round(((i % width) / (width - 1)) * 255));
    expect(ditherToSprite(gradient, width, height, ".#")).toMatchInlineSnapshot(`
      [
        "...#.###",
        "...#.###",
        "..#.####",
        "...#.#.#",
      ]
    `);
  });

  it("restitue un gris moyen par une trame d'environ un pixel sur deux", () => {
    const width = 20;
    const height = 20;
    const sprite = ditherToSprite(new Uint8Array(width * height).fill(128), width, height, ".#");
    const lit = sprite.join("").split("").filter((pixel) => pixel === "#").length;
    expect(lit / (width * height)).toBeGreaterThan(0.4);
    expect(lit / (width * height)).toBeLessThan(0.6);
  });

  it("diffuse l'erreur vers les voisins (pas un simple seuil)", () => {
    // Un gris clair uniforme sous le seuil : un seuil simple n'allumerait rien.
    const sprite = ditherToSprite(new Uint8Array(16).fill(100), 4, 4, ".#");
    expect(sprite.join("")).toContain("#");
    expect(sprite.join("")).toContain(".");
  });

  it("choisit la nuance la plus proche dans la palette", () => {
    expect(ditherToSprite(Uint8Array.from([0, 85, 170, 255]), 4, 1, SHADES)).toEqual([".:+#"]);
  });

  it("garde un gris intermédiaire uniforme sur une seule nuance, sans trame", () => {
    expect(ditherToSprite(new Uint8Array(9).fill(85), 3, 3, SHADES)).toEqual([":::", ":::", ":::"]);
  });

  it("refuse un tampon qui ne correspond pas aux dimensions", () => {
    expect(() => ditherToSprite(new Uint8Array(3), 2, 2, ".#")).toThrow(/dimensions/);
  });
});

describe("loadPortraitSprite", () => {
  it("recadre la photo sur la grille demandée", async () => {
    const dir = mkdtempSync(join(tmpdir(), "portrait-"));
    const file = join(dir, "photo.png");
    await sharp({ create: { width: 300, height: 200, channels: 3, background: "#ffffff" } })
      .png()
      .toFile(file);
    const sprite = await loadPortraitSprite(file, { columns: 6, rows: 8 });
    expect(sprite).toHaveLength(8);
    expect(sprite.every((row) => row === "######")).toBe(true);
  });

  it("rend les tons moyens de la photo en nuances intermédiaires", async () => {
    const dir = mkdtempSync(join(tmpdir(), "portrait-"));
    const file = join(dir, "gradient.png");
    const width = 16;
    const pixels = Buffer.from(Array.from({ length: width * 4 }, (_, i) => Math.round(((i % width) / (width - 1)) * 255)));
    await sharp(pixels, { raw: { width, height: 4, channels: 1 } }).png().toFile(file);
    const shades = new Set((await loadPortraitSprite(file, { columns: width, rows: 4 })).join(""));
    expect(shades).toEqual(new Set(SHADES));
  });
});
