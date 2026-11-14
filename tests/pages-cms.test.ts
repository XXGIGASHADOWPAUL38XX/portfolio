import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { z } from "astro/zod";
import { createFields } from "../src/lib/content-fields";
import { createSchemas } from "../src/lib/content-schemas";

/** Chemins des champs feuilles d'un schéma Zod : « identite.email », « experience.items.debut »… */
function schemaPaths(schema: z.core.$ZodType, prefix = ""): string[] {
  const def = schema._zod.def as unknown as Record<string, unknown> & { type: string };
  switch (def.type) {
    case "object":
      return Object.entries(def.shape as Record<string, z.core.$ZodType>).flatMap(([key, child]) =>
        schemaPaths(child, prefix ? `${prefix}.${key}` : key),
      );
    case "array":
      return schemaPaths(def.element as z.core.$ZodType, prefix);
    case "optional":
    case "nullable":
    case "default":
      return schemaPaths(def.innerType as z.core.$ZodType, prefix);
    case "pipe":
      return schemaPaths(def.in as z.core.$ZodType, prefix);
    case "union": {
      const options = def.options as z.core.$ZodType[];
      const nested = options.filter((option) => option._zod.def.type === "object");
      if (nested.length === 0) return [prefix];
      return [...new Set(nested.flatMap((option) => schemaPaths(option, prefix)))];
    }
    default:
      return [prefix];
  }
}

interface PagesField {
  name: string;
  type?: string;
  fields?: PagesField[];
}

function pagesPaths(fields: PagesField[], prefix = ""): string[] {
  return fields.flatMap((field) => {
    const path = prefix ? `${prefix}.${field.name}` : field.name;
    return field.type === "object" && field.fields ? pagesPaths(field.fields, path) : [path];
  });
}

const config = parse(readFileSync(".pages.yml", "utf8")) as { content: (PagesField & { path: string })[] };
const schemas = createSchemas(createFields({ allowPlaceholders: true, projectRoot: process.cwd() }));

const COVERAGE: [entry: string, schema: z.core.$ZodType, markdownBody: boolean][] = [
  ["site", schemas.site, false],
  ["parcours", schemas.parcours, false],
  ["apropos", schemas.apropos, false],
  ["projets", schemas.projets, true],
  ["mentions-legales", schemas.pages, true],
];

describe(".pages.yml", () => {
  it.each(COVERAGE)("couvre exactement les champs du schéma « %s »", (entry, schema, markdownBody) => {
    const content = config.content.find((item) => item.name === entry);
    const expected = [...schemaPaths(schema), ...(markdownBody ? ["body"] : [])].sort();
    expect(pagesPaths(content?.fields ?? []).sort()).toEqual(expected);
  });
});
