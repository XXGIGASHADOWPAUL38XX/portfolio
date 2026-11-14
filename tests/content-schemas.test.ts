import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { createFields } from "../src/lib/content-fields";
import { createSchemas } from "../src/lib/content-schemas";

const schemas = createSchemas(createFields({ allowPlaceholders: true, projectRoot: process.cwd() }));

const json = (file: string) => JSON.parse(readFileSync(`src/content/${file}`, "utf8"));
const frontmatter = (file: string) => parse(readFileSync(`src/content/${file}`, "utf8").split("---")[1] ?? "");

describe("contenu actuel", () => {
  it.each([
    ["site", () => schemas.site.safeParse(json("site.json"))],
    ["parcours", () => schemas.parcours.safeParse(json("parcours.json"))],
    ["apropos", () => schemas.apropos.safeParse(json("apropos.json"))],
    ["led-tristan", () => schemas.projets.safeParse(frontmatter("projets/led-tristan.md"))],
    ["reco-streaming", () => schemas.projets.safeParse(frontmatter("projets/reco-streaming.md"))],
    ["mentions-legales", () => schemas.pages.safeParse(frontmatter("pages/mentions-legales.md"))],
  ])("« %s » est valide en mode brouillon", (_, parseContent) => {
    expect(parseContent().error).toBeUndefined();
  });
});

describe("parcours", () => {
  const base = json("parcours.json");
  const withExperience = (patch: object) => ({
    ...base,
    experience: { ...base.experience, items: [{ ...base.experience.items[0], ...patch }] },
  });

  it("traite une fin absente comme « aujourd'hui » (null)", () => {
    const { fin: _fin, ...sansFin } = base.experience.items[0];
    const result = schemas.parcours.parse({ ...base, experience: { ...base.experience, items: [sansFin] } });
    expect(result.experience.items[0]?.fin).toBeNull();
  });

  it("garde une année de fin renseignée", () => {
    expect(schemas.parcours.parse(withExperience({ fin: 2025 })).experience.items[0]?.fin).toBe(2025);
  });

  it("exige au moins une techno par expérience, une expérience et une formation", () => {
    expect(schemas.parcours.safeParse(withExperience({ stack: [] })).success).toBe(false);
    expect(schemas.parcours.safeParse({ ...base, experience: { ...base.experience, items: [] } }).success).toBe(false);
    expect(schemas.parcours.safeParse({ ...base, formation: { ...base.formation, items: [] } }).success).toBe(false);
  });
});

describe("apropos", () => {
  const base = json("apropos.json");

  it("exige exactement trois étapes", () => {
    expect(schemas.apropos.safeParse({ ...base, etapes: base.etapes.slice(0, 2) }).success).toBe(false);
  });

  it("refuse deux tuiles mises en avant", () => {
    const tuiles = base.tuiles.map((tuile: object) => ({ ...tuile, primary: true }));
    const result = schemas.apropos.safeParse({ ...base, tuiles });
    expect(result.error?.issues[0]?.message).toMatch(/Une seule tuile/);
  });

  it("accepte une seule tuile mise en avant, ou aucune", () => {
    const tuiles = base.tuiles.map((tuile: object) => ({ ...tuile, primary: false }));
    expect(schemas.apropos.safeParse({ ...base, tuiles }).success).toBe(true);
  });

  it("donne par défaut une tuile non mise en avant et sans tags", () => {
    const { primary: _primary, tags: _tags, ...tuile } = base.tuiles[1];
    const result = schemas.apropos.parse({ ...base, tuiles: [tuile] });
    expect(result.tuiles[0]).toMatchObject({ primary: false, tags: [] });
  });

  it("exige au moins une tuile", () => {
    expect(schemas.apropos.safeParse({ ...base, tuiles: [] }).success).toBe(false);
  });
});

describe("projets", () => {
  const featured = frontmatter("projets/led-tristan.md");
  const other = frontmatter("projets/reco-streaming.md");

  it("exige cinq nœuds dans le graphe", () => {
    const graphe = { ...featured.graphe, noeuds: featured.graphe.noeuds.slice(0, 4) };
    expect(schemas.projets.safeParse({ ...featured, graphe }).success).toBe(false);
  });

  it("n'affiche le mini-spectre que sur les nœuds qui le demandent", () => {
    const result = schemas.projets.parse(featured);
    expect(result.featured && result.graphe.noeuds.map((noeud) => noeud.spectre)).toEqual([
      false,
      true,
      false,
      false,
      false,
    ]);
  });

  it("exige au moins un chiffre, une techno et une étape", () => {
    expect(schemas.projets.safeParse({ ...featured, chiffres: [] }).success).toBe(false);
    expect(schemas.projets.safeParse({ ...featured, stack: [] }).success).toBe(false);
    expect(schemas.projets.safeParse({ ...featured, etapes: [] }).success).toBe(false);
  });

  it("donne des liens vides par défaut", () => {
    const { liens: _liens, ...sansLiens } = featured;
    const result = schemas.projets.parse(sansLiens);
    expect(result.featured && result.liens).toEqual({});
  });

  it("exige un titre de carte en kebab-case et un ordre positif", () => {
    expect(schemas.projets.safeParse({ ...other, titre: "Reco Streaming" }).success).toBe(false);
    expect(schemas.projets.safeParse({ ...other, ordre: -1 }).success).toBe(false);
    expect(schemas.projets.safeParse({ ...other, ordre: 0 }).success).toBe(true);
  });

  it("n'accepte qu'une illustration de la bibliothèque", () => {
    expect(schemas.projets.safeParse({ ...other, couverture: "inconnue" }).success).toBe(false);
  });
});
