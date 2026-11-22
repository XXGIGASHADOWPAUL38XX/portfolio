import { describe, expect, it } from "vitest";
import { createRng } from "../src/lib/random";
import { readToken, readPxToken } from "../src/lib/tokens";
import { spriteGeometry, revealDelays } from "../src/lib/pixel-art";
import { ledSpectrum, ledStrip, MINI_SPECTRUM } from "../src/lib/led";

describe("createRng", () => {
  it("rejoue la même suite pour la même graine (générateur de la maquette)", () => {
    const a = createRng(5);
    const b = createRng(5);
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect(first[0]).toBeCloseTo(((5 * 1664525 + 1013904223) >>> 0) / 4294967296, 12);
  });

  it("traite une graine nulle comme la graine 1", () => {
    const zero = createRng(0);
    const one = createRng(1);
    expect([zero(), zero()]).toEqual([one(), one()]);
  });

  it("reste dans [0, 1[", () => {
    const rng = createRng(1);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("readToken", () => {
  const css = `:root, [data-theme="dark"] { --bg: #000000; --signal: #48e054; }
[data-theme="light"] { --bg: #ffffff; }
:root { --pixel-unit: 8px; --pixel-pitch: 10px; }`;

  it("lit la première déclaration, celle du thème sombre par défaut", () => {
    expect(readToken(css, "bg")).toBe("#000000");
    expect(readToken(css, "signal")).toBe("#48e054");
  });

  it("ne confond pas deux tokens au préfixe commun", () => {
    expect(readToken(":root { --pixel-pitch: 10px; --pixel: 3px; }", "pixel")).toBe("3px");
  });

  it("convertit un token en pixels", () => {
    expect(readPxToken(css, "pixel-unit")).toBe(8);
  });

  it("échoue clairement si le token manque ou n'est pas en px", () => {
    expect(() => readToken(css, "absent")).toThrow(/--absent/);
    expect(() => readPxToken(css, "bg")).toThrow(/px/);
  });
});

describe("spriteGeometry", () => {
  it("place un carré par pixel allumé, au pas de la grille", () => {
    const geometry = spriteGeometry(["#.", ".#"], { unit: 8, pitch: 10 });
    expect(geometry.cells).toEqual([
      { x: 0, y: 0, shade: 1 },
      { x: 10, y: 10, shade: 1 },
    ]);
  });

  it("mesure le sprite sans l'écart après le dernier pixel", () => {
    const geometry = spriteGeometry(["###", "#.."], { unit: 8, pitch: 10 });
    expect(geometry.width).toBe(28);
    expect(geometry.height).toBe(18);
  });

  it("prend la ligne la plus longue comme largeur et ignore les espaces", () => {
    const geometry = spriteGeometry(["#", "# #"], { unit: 8, pitch: 10 });
    expect(geometry.width).toBe(28);
    expect(geometry.cells).toHaveLength(3);
  });

  it("donne à chaque nuance son intensité et n'affiche pas les pixels éteints", () => {
    const geometry = spriteGeometry(["#+:."], { unit: 8, pitch: 10 });
    expect(geometry.cells).toEqual([
      { x: 0, y: 0, shade: 1 },
      { x: 10, y: 0, shade: 2 / 3 },
      { x: 20, y: 0, shade: 1 / 3 },
    ]);
  });

  it("rend un sprite vide de taille nulle", () => {
    expect(spriteGeometry([], { unit: 8, pitch: 10 })).toEqual({ width: 0, height: 0, cells: [] });
  });
});

describe("revealDelays", () => {
  it("donne un délai entier par pixel, borné par la durée", () => {
    const delays = revealDelays(50, 3, 900);
    expect(delays).toHaveLength(50);
    expect(delays.every((delay) => Number.isInteger(delay) && delay >= 0 && delay <= 900)).toBe(true);
  });

  it("est déterministe et dépend de la graine", () => {
    expect(revealDelays(5, 3, 900)).toEqual(revealDelays(5, 3, 900));
    expect(revealDelays(5, 1, 900)).not.toEqual(revealDelays(5, 3, 900));
  });
});

describe("ledSpectrum", () => {
  const spectrum = ledSpectrum();

  it("produit 113 barres de 1 à 22 cellules", () => {
    expect(spectrum).toHaveLength(113);
    expect(Math.min(...spectrum)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...spectrum)).toBeLessThanOrEqual(22);
  });

  it("reproduit les barres de la maquette (renderVals, graine 5)", () => {
    // Référence calculée en exécutant renderVals() de Main.dc.html.
    expect(spectrum).toEqual([
      22, 22, 19, 20, 19, 17, 16, 14, 13, 15, 12, 12, 12, 12, 10, 12, 10, 9, 10, 8, 10, 8, 9, 8, 8, 8, 9, 8, 8, 7, 7, 9,
      7, 8, 10, 8, 10, 9, 10, 9, 11, 11, 10, 11, 10, 10, 10, 10, 12, 10, 10, 11, 9, 10, 8, 10, 8, 8, 9, 9, 7, 8, 6, 6, 5,
      6, 7, 6, 4, 4, 3, 4, 3, 4, 5, 4, 3, 4, 5, 3, 6, 7, 5, 7, 8, 6, 8, 5, 4, 6, 3, 2, 4, 3, 3, 4, 2, 1, 4, 2, 2, 2, 3, 2,
      1, 3, 3, 1, 1, 2, 3, 2, 2,
    ]);
  });
});

describe("ledStrip", () => {
  it("allume les LED des plages de la maquette", () => {
    const strip = ledStrip();
    expect(strip).toHaveLength(110);
    expect(strip.slice(0, 44).every(Boolean)).toBe(true);
    expect(strip[44]).toBe(false);
    expect([strip[53], strip[54], strip[63], strip[64]]).toEqual([false, true, false, false]);
    expect([strip[90], strip[91], strip[95], strip[96]]).toEqual([false, true, true, false]);
    expect(strip.filter(Boolean)).toHaveLength(44 + 5 + 5);
  });
});

describe("MINI_SPECTRUM", () => {
  it("garde les 20 barres de la maquette", () => {
    expect(MINI_SPECTRUM).toEqual([4, 4, 3, 4, 3, 3, 2, 3, 2, 2, 2, 3, 2, 1, 2, 1, 1, 2, 1, 1]);
  });
});
