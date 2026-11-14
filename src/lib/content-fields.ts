import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "astro/zod";

/**
 * Contenu manquant : une valeur entièrement entre crochets, comme « [Intitulé] ».
 * La maquette en contient ; ils sont permis en développement et refusés en production.
 */
export type Placeholder = `[${string}]`;

const PLACEHOLDER_PATTERN = /^\[[^\]]*\]$/;
const BRACKET_PATTERN = /[[\]]/;
const BRACKET_MESSAGE = "Contenu à remplacer : retirez les crochets [ ] avant la mise en ligne.";

export function isPlaceholder(value: unknown): value is Placeholder {
  return typeof value === "string" && PLACEHOLDER_PATTERN.test(value);
}

interface FieldOptions {
  /** true en développement (ALLOW_PLACEHOLDERS=true) ; false pour un build de production. */
  allowPlaceholders: boolean;
  /** Dossier depuis lequel les chemins de fichiers sont résolus. */
  projectRoot: string;
}

/** Fabriques de champs Zod qui appliquent la même règle des crochets partout. */
export function createFields({ allowPlaceholders, projectRoot }: FieldOptions) {
  const placeholder = z.custom<Placeholder>(isPlaceholder);

  /**
   * Une valeur typée, ou un contenu manquant toléré seulement en mode permissif.
   * Le type reste l'union dans les deux modes : les composants traitent toujours le cas.
   */
  function orPlaceholder<Output>(schema: z.ZodType<Output>): z.ZodType<Output | Placeholder> {
    if (allowPlaceholders) return z.union([schema, placeholder]);
    return z
      .unknown()
      .refine((value) => !isPlaceholder(value), { message: BRACKET_MESSAGE, abort: true })
      .pipe(schema);
  }

  return {
    text: () =>
      z
        .string()
        .trim()
        .min(1)
        .refine((value) => allowPlaceholders || !BRACKET_PATTERN.test(value), { message: BRACKET_MESSAGE }),
    url: () => orPlaceholder(z.url({ protocol: /^https?$/ })),
    email: () => orPlaceholder(z.email()),
    year: () => orPlaceholder(z.number().int().min(1900).max(2100)),
    /** Chemin écrit par Pages CMS (ex. « /documents/cv.pdf »), résolu sous projectRoot/baseDir. */
    file: (baseDir: string) =>
      orPlaceholder(
        z
          .string()
          .startsWith("/")
          .refine((path) => existsSync(join(projectRoot, baseDir, path)), {
            message: `Fichier introuvable sous ${baseDir || "la racine"}.`,
          }),
      ),
  };
}
