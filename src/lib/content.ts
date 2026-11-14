import { getCollection, getEntry, render } from "astro:content";
import { splitProjects } from "./projects";

/** Accès au contenu validé. Une entrée manquante est une erreur de build, pas un rendu vide. */
async function required<C extends "site" | "parcours" | "apropos">(collection: C) {
  const entry = await getEntry(collection, collection);
  if (!entry) throw new Error(`Contenu manquant : src/content/${collection}.json`);
  return entry.data;
}

export const getSite = () => required("site");
export const getParcours = () => required("parcours");
export const getApropos = () => required("apropos");

export async function getProjects() {
  return splitProjects(await getCollection("projets"));
}

export async function getPage(id: string) {
  const entry = await getEntry("pages", id);
  if (!entry) throw new Error(`Page manquante : src/content/pages/${id}.md`);
  return { data: entry.data, ...(await render(entry)) };
}
