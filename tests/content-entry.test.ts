import { describe, expect, it } from "vitest";
import { entryData } from "../src/lib/content-entry";

describe("entryData", () => {
  it("renvoie les données de l'entrée", () => {
    expect(entryData({ data: { titre: "x" } }, "site.json")).toEqual({ titre: "x" });
  });

  it("nomme le fichier manquant", () => {
    expect(() => entryData(undefined, "site.json")).toThrow("Contenu manquant : src/content/site.json");
  });
});
