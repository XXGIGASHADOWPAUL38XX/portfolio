import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ASCII_CELL, ASCII_RAMP, ditherToText, loadPortraitAscii } from "../src/lib/portrait";

describe("ditherToText", () => {
  it("allume le blanc et éteint le noir", () => {
    expect(ditherToText(Uint8Array.from([255, 0, 0, 255]), 2, 2, ".#")).toEqual(["#.", ".#"]);
  });

  it("allume à partir du seuil de 128", () => {
    expect(ditherToText(Uint8Array.from([128]), 1, 1, ".#")).toEqual(["#"]);
    expect(ditherToText(Uint8Array.from([127]), 1, 1, ".#")).toEqual(["."]);
  });

  it("reporte 7/16 de l'erreur à droite", () => {
    // 100 éteint (erreur 100) ; voisin : 100 + 43,75 = 143,75 → allumé.
    expect(ditherToText(Uint8Array.from([100, 100]), 2, 1, ".#")).toEqual([".#"]);
  });

  it("reporte 5/16 de l'erreur en dessous", () => {
    // 100 + 31,25 = 131,25 → allumé.
    expect(ditherToText(Uint8Array.from([100, 100]), 1, 2, ".#")).toEqual([".", "#"]);
  });

  it("reporte 3/16 de l'erreur en bas à gauche", () => {
    // (1,0) = 100 éteint : (0,1) reçoit 18,75 → 110 + 18,75 = 128,75 → allumé.
    expect(ditherToText(Uint8Array.from([0, 100, 110, 0]), 2, 2, ".#")).toEqual(["..", "#."]);
  });

  it("reporte 1/16 de l'erreur en bas à droite", () => {
    // (0,0) = 64 éteint : (1,1) reçoit 4 → 124 + 4 = 128 → allumé ; (1,0) = 0 + 28 reste éteint
    // et renvoie 28 × 5/16 = 8,75 de plus vers (1,1) ; (0,1) = 0 + 20 renvoie 8,75 à droite.
    expect(ditherToText(Uint8Array.from([64, 0, 0, 107]), 2, 2, ".#")).toEqual(["..", ".#"]);
    expect(ditherToText(Uint8Array.from([0, 0, 0, 127]), 2, 2, ".#")).toEqual(["..", ".."]);
  });

  it("ne déborde pas d'une ligne à la suivante ni hors de l'image", () => {
    // L'erreur du dernier pixel d'une ligne ne doit pas « sauter » au début de la ligne suivante.
    expect(ditherToText(Uint8Array.from([0, 120, 120, 0]), 2, 2, ".#")).toEqual(["..", ".."].map((row, y) => (y === 1 ? "#." : row)));
    expect(ditherToText(Uint8Array.from([0, 0, 0, 120]), 2, 2, ".#")).toEqual(["..", ".."]);
  });

  it("produit la trame de référence d'un dégradé", () => {
    const width = 8;
    const height = 4;
    const gradient = Uint8Array.from({ length: width * height }, (_, i) => Math.round(((i % width) / (width - 1)) * 255));
    expect(ditherToText(gradient, width, height, ".#")).toMatchInlineSnapshot(`
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
    const sprite = ditherToText(new Uint8Array(width * height).fill(128), width, height, ".#");
    const lit = sprite.join("").split("").filter((pixel) => pixel === "#").length;
    expect(lit / (width * height)).toBeGreaterThan(0.4);
    expect(lit / (width * height)).toBeLessThan(0.6);
  });

  it("diffuse l'erreur vers les voisins (pas un simple seuil)", () => {
    // Un gris clair uniforme sous le seuil : un seuil simple n'allumerait rien.
    const sprite = ditherToText(new Uint8Array(16).fill(100), 4, 4, ".#");
    expect(sprite.join("")).toContain("#");
    expect(sprite.join("")).toContain(".");
  });

  it("choisit le caractère le plus proche dans la rampe ASCII, du sombre au clair", () => {
    const steps = Uint8Array.from(ASCII_RAMP, (_, i) => Math.round((i * 255) / (ASCII_RAMP.length - 1)));
    expect(ditherToText(steps, ASCII_RAMP.length, 1, ASCII_RAMP)).toEqual([ASCII_RAMP]);
  });

  it("garde un gris intermédiaire uniforme sur un seul caractère, sans trame", () => {
    const step = 255 / (ASCII_RAMP.length - 1);
    const char = ASCII_RAMP[3];
    expect(ditherToText(new Uint8Array(9).fill(Math.round(3 * step)), 3, 3, ASCII_RAMP)).toEqual([char.repeat(3), char.repeat(3), char.repeat(3)]);
  });

  it("refuse un tampon qui ne correspond pas aux dimensions", () => {
    expect(() => ditherToText(new Uint8Array(3), 2, 2, ".#")).toThrow(/dimensions/);
  });
});

describe("loadPortraitAscii", () => {
  it("recadre la photo sur la grille demandée", async () => {
    const dir = mkdtempSync(join(tmpdir(), "portrait-"));
    const file = join(dir, "photo.png");
    await sharp({ create: { width: 300, height: 200, channels: 3, background: "#ffffff" } })
      .png()
      .toFile(file);
    const lines = await loadPortraitAscii(file, { columns: 6, rows: 8 });
    const brightest = ASCII_RAMP.at(-1) ?? "";
    expect(lines).toEqual(Array.from({ length: 8 }, () => brightest.repeat(6)));
  });

  it("rend chaque ton de la photo par un caractère de la rampe", async () => {
    const dir = mkdtempSync(join(tmpdir(), "portrait-"));
    const file = join(dir, "gradient.png");
    // Image déjà aux proportions de la grille (16 × 6 px par 4 × 10 px) : aucun recadrage.
    const grid = { columns: 16, rows: 4 };
    const [width, height] = [grid.columns * ASCII_CELL.width, grid.rows * ASCII_CELL.height];
    const pixels = Buffer.from(Array.from({ length: width * height }, (_, i) => Math.round(((i % width) / (width - 1)) * 255)));
    await sharp(pixels, { raw: { width, height, channels: 1 } }).png().toFile(file);
    const chars = new Set((await loadPortraitAscii(file, grid)).join(""));
    expect(chars).toEqual(new Set(ASCII_RAMP));
  });
});
