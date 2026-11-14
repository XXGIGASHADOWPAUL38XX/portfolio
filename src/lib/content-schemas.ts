import { z } from "astro/zod";
import type { createFields } from "./content-fields";
import { COVER_SPRITE_NAMES } from "./sprites";

type Fields = ReturnType<typeof createFields>;

/**
 * Schémas du contenu, séparés de content.config.ts pour être testés hors d'Astro.
 * Chaque champ doit avoir son équivalent dans .pages.yml (vérifié par tests/pages-cms.test.ts).
 */
export function createSchemas(field: Fields) {
  const tags = z.array(field.text());
  const stack = z.array(field.text()).min(1);

  const site = z.object({
    meta: z.object({ titre: field.text(), description: field.text() }),
    identite: z.object({
      prenom: field.text(),
      nom: field.text(),
      marque: field.text(),
      intitule: field.text(),
      accroche: field.text(),
      legende: field.text(),
      lieu: field.text(),
      modeTravail: field.text(),
      email: field.email(),
      photo: field.file(""),
      photoAlt: field.text(),
    }),
    liens: z.object({
      github: field.url(),
      linkedin: field.url(),
      cv: field.file("public"),
    }),
    navigation: z.object({
      libelle: field.text(),
      sousNavigation: field.text(),
      evitement: field.text(),
      projets: field.text(),
      parcours: field.text(),
      aPropos: field.text(),
      contact: field.text(),
      boutonContact: field.text(),
      themeClair: field.text(),
    }),
    hero: z.object({
      libelle: field.text(),
      boutonProjets: field.text(),
      boutonCv: field.text(),
    }),
    aLaUne: z.object({
      surtitre: field.text(),
      etudeDeCas: field.text(),
      code: field.text(),
      video: field.text(),
    }),
    projets: z.object({ surtitre: field.text(), titre: field.text() }),
    contact: z.object({
      surtitre: field.text(),
      titre: field.text(),
      texte: field.text(),
      boutonEmail: field.text(),
    }),
    piedDePage: z.object({
      libelle: field.text(),
      phraseTitre: field.text(),
      phrase: field.text(),
      surLaPageTitre: field.text(),
      ailleursTitre: field.text(),
      contactTitre: field.text(),
      cvLibelle: field.text(),
      hautDePage: field.text(),
      signature: field.text(),
      mentionsLegales: field.text(),
    }),
  });

  const experience = z.object({
    debut: field.year(),
    fin: field.year().nullish().transform((value) => value ?? null),
    structure: field.text(),
    intitule: field.text(),
    lieu: field.text(),
    contrat: field.text().optional(),
    description: field.text(),
    stack,
  });

  const formation = z.object({
    debut: field.year(),
    fin: field.year(),
    diplome: field.text(),
    ecole: field.text(),
    parcours: field.text(),
  });

  const parcours = z.object({
    surtitre: field.text(),
    titre: field.text(),
    aujourdhui: field.text(),
    boutonCv: field.text(),
    experience: z.object({
      titre: field.text(),
      colonnes: z.object({
        periode: field.text(),
        structure: field.text(),
        role: field.text(),
        stack: field.text(),
      }),
      items: z.array(experience).min(1),
    }),
    formation: z.object({
      titre: field.text(),
      colonnes: z.object({ periode: field.text(), diplome: field.text(), parcours: field.text() }),
      items: z.array(formation).min(1),
    }),
  });

  const apropos = z.object({
    surtitre: field.text(),
    titre: field.text(),
    etapes: z
      .array(z.object({ periode: field.text(), titre: field.text(), texte: field.text(), tags }))
      .length(3),
    bio: z.object({ accroche: field.text(), texte: field.text() }),
    tuiles: z
      .array(
        z.object({
          kicker: field.text(),
          titre: field.text(),
          texte: field.text(),
          tags: tags.default([]),
          primary: z.boolean().default(false),
        }),
      )
      .min(1)
      .refine((tuiles) => tuiles.filter((tuile) => tuile.primary).length <= 1, {
        message: "Une seule tuile peut être mise en avant (primary).",
      }),
  });

  /** Le graphe d'effet du projet à la une : 5 nœuds disposés en serpentin. */
  const graphNode = z.object({
    categorie: field.text(),
    titre: field.text(),
    detail: field.text().optional(),
    spectre: z.boolean().default(false),
  });

  const featuredProject = z.object({
    featured: z.literal(true),
    titre: field.text(),
    titreAccent: field.text(),
    chiffres: z.array(z.object({ valeur: field.text(), libelle: field.text() })).min(1),
    stack,
    liens: z
      .object({
        etudeDeCas: field.url().optional(),
        code: field.url().optional(),
        video: field.url().optional(),
      })
      .default({}),
    graphe: z.object({
      legende: field.text(),
      description: field.text(),
      noeuds: z.array(graphNode).length(5),
    }),
    spectre: z.object({
      graves: field.text(),
      centre: field.text(),
      aigus: field.text(),
      legende: field.text(),
      debit: field.text(),
    }),
    etapes: z.array(z.object({ titre: field.text(), texte: field.text(), stack: field.text() })).min(1),
  });

  const otherProject = z.object({
    featured: z.literal(false),
    /** Affiché comme « /titre » sur la carte. */
    titre: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "En kebab-case : minuscules, chiffres et tirets."),
    ordre: z.number().int().min(0),
    surtitre: field.text(),
    resultat: field.text(),
    couverture: z.enum(COVER_SPRITE_NAMES),
    couvertureAlt: field.text(),
    lien: field.url().optional(),
  });

  const projets = z.discriminatedUnion("featured", [featuredProject, otherProject]);

  const pages = z.object({ titre: field.text(), description: field.text() });

  return { site, parcours, apropos, projets, pages };
}
