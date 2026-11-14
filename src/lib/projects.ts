interface ProjectLike {
  id: string;
  data: { featured: true } | { featured: false; ordre: number };
}

type Featured<P extends ProjectLike> = P & { data: Extract<P["data"], { featured: true }> };
type Other<P extends ProjectLike> = P & { data: Extract<P["data"], { featured: false }> };

/** Le projet à la une (exactement un) et les autres, triés par « ordre » puis par identifiant. */
export function splitProjects<P extends ProjectLike>(projects: P[]): { featured: Featured<P>; others: Other<P>[] } {
  const featured = projects.filter((project): project is Featured<P> => project.data.featured);
  const [first] = featured;
  if (featured.length !== 1 || !first) {
    throw new Error(`Il faut un seul projet à la une (featured: true), trouvé : ${featured.length}.`);
  }
  const others = projects
    .filter((project): project is Other<P> => !project.data.featured)
    .sort((a, b) => a.data.ordre - b.data.ordre || a.id.localeCompare(b.id));
  return { featured: first, others };
}
