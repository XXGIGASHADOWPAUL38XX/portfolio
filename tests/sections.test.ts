import { describe, expect, it } from "vitest";
import { formatIndex, sectionNumber } from "../src/lib/sections";

describe("sectionNumber", () => {
  it("numérote les sections dans l'ordre de la page, sur deux chiffres", () => {
    expect((["a-la-une", "projets", "parcours", "a-propos", "contact"] as const).map(sectionNumber)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
  });
});

describe("formatIndex", () => {
  it("formate un rang (à partir de 0) sur deux chiffres", () => {
    expect([0, 8, 9, 99].map(formatIndex)).toEqual(["01", "09", "10", "100"]);
  });
});
