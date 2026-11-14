import { describe, expect, it } from "vitest";
import { anchor, formatIndex, navLinks, sectionNumber } from "../src/lib/sections";

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

describe("anchor", () => {
  it("pointe vers la section sur l'accueil, et vers l'accueil depuis une autre page", () => {
    expect(anchor("contact")).toBe("#contact");
    expect(anchor("contact", "page")).toBe("/#contact");
  });
});

describe("navLinks", () => {
  const labels = { projets: "Projets", parcours: "Parcours", aPropos: "À propos", contact: "Contact" };

  it("mène « Projets » au projet à la une et suit l'ordre de la page", () => {
    expect(navLinks(labels)).toEqual([
      { label: "Projets", href: "#a-la-une" },
      { label: "Parcours", href: "#parcours" },
      { label: "À propos", href: "#a-propos" },
      { label: "Contact", href: "#contact" },
    ]);
  });

  it("revient à l'accueil depuis une autre page", () => {
    expect(navLinks(labels, "page").map((link) => link.href)).toEqual([
      "/#a-la-une",
      "/#parcours",
      "/#a-propos",
      "/#contact",
    ]);
  });
});
