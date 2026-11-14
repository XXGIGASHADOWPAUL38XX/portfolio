import { type CollectionEntry, getCollection, getEntry, render } from "astro:content";
import { entryData } from "./content-entry";
import { splitProjects } from "./projects";

export type Site = CollectionEntry<"site">["data"];
export type Parcours = CollectionEntry<"parcours">["data"];
export type Apropos = CollectionEntry<"apropos">["data"];
export type Projects = ReturnType<typeof splitProjects<CollectionEntry<"projets">>>;

/** Accès au contenu validé. Une entrée manquante est une erreur de build, pas un rendu vide. */
export const getSite = async (): Promise<Site> => entryData(await getEntry("site", "site"), "site.json");
export const getParcours = async (): Promise<Parcours> =>
  entryData(await getEntry("parcours", "parcours"), "parcours.json");
export const getApropos = async (): Promise<Apropos> => entryData(await getEntry("apropos", "apropos"), "apropos.json");
export const getProjects = async (): Promise<Projects> => splitProjects(await getCollection("projets"));

export async function getPage(id: string) {
  const entry = await getEntry("pages", id);
  const page = entryData(entry && { data: entry }, `pages/${id}.md`);
  return { data: page.data, ...(await render(page)) };
}
