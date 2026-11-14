import { describe, expect, it } from "vitest";
import { splitProjects } from "../src/lib/projects";

const featured = (id: string) => ({ id, data: { featured: true as const } });
const other = (id: string, ordre: number) => ({ id, data: { featured: false as const, ordre } });

describe("splitProjects", () => {
  it("sépare le projet à la une des autres, triés par ordre", () => {
    const result = splitProjects([other("b", 2), featured("led"), other("a", 1)]);
    expect(result.featured.id).toBe("led");
    expect(result.others.map((project) => project.id)).toEqual(["a", "b"]);
  });

  it("départage deux ordres égaux par identifiant, pour un rendu stable", () => {
    const result = splitProjects([featured("led"), other("z", 1), other("m", 1)]);
    expect(result.others.map((project) => project.id)).toEqual(["m", "z"]);
  });

  it("exige exactement un projet à la une", () => {
    expect(() => splitProjects([other("a", 1)])).toThrow(/un seul projet à la une/);
    expect(() => splitProjects([featured("a"), featured("b")])).toThrow(/un seul projet à la une.*2/);
  });
});
