import { describe, expect, it } from "vitest";
import { createFields, isPlaceholder } from "../src/lib/content-fields";

const strict = createFields({ allowPlaceholders: false, projectRoot: process.cwd() });
const lenient = createFields({ allowPlaceholders: true, projectRoot: process.cwd() });

describe("isPlaceholder", () => {
  it("reconnaît une valeur entièrement entre crochets", () => {
    expect(isPlaceholder("[Intitulé]")).toBe(true);
    expect(isPlaceholder("Intitulé")).toBe(false);
    expect(isPlaceholder(2021)).toBe(false);
  });
});

describe("text", () => {
  it("accepte un texte rempli dans les deux modes", () => {
    expect(strict.text().parse("Développeur IA")).toBe("Développeur IA");
    expect(lenient.text().parse("Développeur IA")).toBe("Développeur IA");
  });

  it("refuse un texte vide", () => {
    expect(strict.text().safeParse("").success).toBe(false);
  });

  it("refuse un crochet en mode strict, même au milieu du texte", () => {
    const result = strict.text().safeParse("Dès aujourd'hui, à Lyon ou [à distance].");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/crochets/);
  });

  it("accepte un crochet quand les contenus manquants sont permis", () => {
    expect(lenient.text().safeParse("Lyon ou [à distance].").success).toBe(true);
  });
});

describe("url", () => {
  it("accepte une URL https", () => {
    expect(strict.url().parse("https://github.com/tristan")).toBe("https://github.com/tristan");
  });

  it("refuse une URL invalide ou un lien vide #", () => {
    expect(strict.url().safeParse("#").success).toBe(false);
    expect(strict.url().safeParse("pas une url").success).toBe(false);
  });

  it("n'accepte un contenu manquant [url] qu'en mode permissif", () => {
    const result = strict.url().safeParse("[GitHub]");
    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(1);
    expect(result.error?.issues[0]?.message).toMatch(/crochets/);
    expect(lenient.url().parse("[GitHub]")).toBe("[GitHub]");
  });
});

describe("year", () => {
  it("accepte une année plausible", () => {
    expect(strict.year().parse(2024)).toBe(2024);
  });

  it("refuse une année hors bornes", () => {
    expect(strict.year().safeParse(1899).success).toBe(false);
    expect(strict.year().safeParse(2024.5).success).toBe(false);
  });

  it("n'accepte [2021] qu'en mode permissif", () => {
    expect(strict.year().safeParse("[2021]").success).toBe(false);
    expect(lenient.year().parse("[2021]")).toBe("[2021]");
  });
});

describe("email", () => {
  it("accepte une adresse valide et refuse le reste", () => {
    expect(strict.email().parse("a@b.fr")).toBe("a@b.fr");
    expect(strict.email().safeParse("[email]").success).toBe(false);
    expect(lenient.email().parse("[email]")).toBe("[email]");
  });
});

describe("file", () => {
  it("nomme la racine du projet quand le fichier y manque", () => {
    expect(strict.file("").safeParse("/absent.pdf").error?.issues[0]?.message).toMatch(/sous la racine/);
  });

  it("accepte un fichier qui existe sous la racine indiquée", () => {
    expect(strict.file("").parse("/package.json")).toBe("/package.json");
  });

  it("refuse un fichier absent", () => {
    const result = strict.file("public").safeParse("/documents/absent.pdf");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/introuvable sous public/);
  });

  it("n'accepte [cv] qu'en mode permissif", () => {
    expect(strict.file("public").safeParse("[CV]").success).toBe(false);
    expect(lenient.file("public").parse("[CV]")).toBe("[CV]");
  });
});
