import { type CollectionEntry, getCollection, getEntry, render } from "astro:content";
import { splitProjects } from "./projects";

export type Site = CollectionEntry<"site">["data"];
export type Parcours = CollectionEntry<"parcours">["data"];
export type Apropos = CollectionEntry<"apropos">["data"];
export type Projects = ReturnType<typeof splitProjects<CollectionEntry<"projets">>>;

/** Accès au contenu validé. Une entrée manquante est une erreur de build, pas un rendu vide. */
function missing(file: string): never {
  throw new Error(`Contenu manquant : src/content/${file}`);
}

export async function getSite(): Promise<Site> {
  return (await getEntry("site", "site"))?.data ?? missing("site.json");
}

export async function getParcours(): Promise<Parcours> {
  return (await getEntry("parcours", "parcours"))?.data ?? missing("parcours.json");
}

export async function getApropos(): Promise<Apropos> {
  return (await getEntry("apropos", "apropos"))?.data ?? missing("apropos.json");
}

export async function getProjects(): Promise<Projects> {
  return splitProjects(await getCollection("projets"));
}

export async function getPage(id: string) {
  const entry = (await getEntry("pages", id)) ?? missing(`pages/${id}.md`);
  return { data: entry.data, ...(await render(entry)) };
}
