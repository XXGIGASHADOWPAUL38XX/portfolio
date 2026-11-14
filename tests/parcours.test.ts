import { describe, expect, it } from "vitest";
import { formatPeriod, isOngoing, sortByRecency } from "../src/lib/parcours";

describe("formatPeriod", () => {
  it("relie début et fin par une flèche", () => {
    expect(formatPeriod({ debut: 2023, fin: 2024 }, "auj.")).toBe("2023 → 2024");
  });

  it("écrit « aujourd'hui » quand la fin est vide", () => {
    expect(formatPeriod({ debut: 2024, fin: null }, "auj.")).toBe("2024 → auj.");
  });

  it("affiche tel quel un contenu à remplacer", () => {
    expect(formatPeriod({ debut: "[2021]", fin: 2024 }, "auj.")).toBe("[2021] → 2024");
  });
});

describe("isOngoing", () => {
  it("est vrai seulement sans date de fin", () => {
    expect(isOngoing({ fin: null })).toBe(true);
    expect(isOngoing({ fin: 2024 })).toBe(false);
  });
});

describe("sortByRecency", () => {
  it("place l'expérience en cours d'abord, puis par fin puis début décroissants", () => {
    const items = [
      { id: "a", debut: 2018, fin: 2020 },
      { id: "b", debut: 2024, fin: null },
      { id: "c", debut: 2019, fin: 2020 },
      { id: "d", debut: 2021, fin: 2023 },
    ];
    expect(sortByRecency(items).map((item) => item.id)).toEqual(["b", "d", "c", "a"]);
  });

  it("classe un début à remplacer après les débuts connus de même fin", () => {
    const items = [
      { id: "but", debut: "[2021]" as const, fin: 2024 },
      { id: "master", debut: 2022, fin: 2024 },
    ];
    expect(sortByRecency(items).map((item) => item.id)).toEqual(["master", "but"]);
  });

  it("ne modifie pas le tableau reçu", () => {
    const items = [
      { debut: 2018, fin: 2019 },
      { debut: 2020, fin: 2021 },
    ];
    sortByRecency(items);
    expect(items[0]?.debut).toBe(2018);
  });
});
