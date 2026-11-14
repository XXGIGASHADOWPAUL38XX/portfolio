import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { createFields } from "./lib/content-fields";
import { createSchemas } from "./lib/content-schemas";

/*
 * Tout le texte, les liens et les chiffres du site viennent de src/content,
 * édité par Tristan via Pages CMS (.pages.yml).
 * ALLOW_PLACEHOLDERS=true tolère les contenus [à remplacer] (développement uniquement).
 */
const schemas = createSchemas(
  createFields({
    allowPlaceholders: process.env.ALLOW_PLACEHOLDERS === "true",
    projectRoot: process.cwd(),
  }),
);

export const collections = {
  site: defineCollection({ loader: glob({ base: "./src/content", pattern: "site.json" }), schema: schemas.site }),
  parcours: defineCollection({
    loader: glob({ base: "./src/content", pattern: "parcours.json" }),
    schema: schemas.parcours,
  }),
  apropos: defineCollection({
    loader: glob({ base: "./src/content", pattern: "apropos.json" }),
    schema: schemas.apropos,
  }),
  projets: defineCollection({ loader: glob({ base: "./src/content/projets", pattern: "*.md" }), schema: schemas.projets }),
  pages: defineCollection({ loader: glob({ base: "./src/content/pages", pattern: "*.md" }), schema: schemas.pages }),
};
