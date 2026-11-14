import { describe, expect, it } from "vitest";
import {
  findBrokenAnchors,
  findEmptyLinks,
  findExternalResources,
  findPlaceholders,
  inlineScriptBytes,
} from "../scripts/dist-checks";

describe("findPlaceholders", () => {
  it("trouve un contenu entre crochets dans le texte ou un attribut", () => {
    expect(findPlaceholders("<p>Lyon ou [à distance].</p>")).toEqual(["[à distance]"]);
    expect(findPlaceholders('<a href="mailto:[email]">x</a>')).toEqual(["[email]"]);
  });

  it("ignore les classes Tailwind, les styles et les scripts", () => {
    const html =
      '<div class="[grid-area:src] bg-[red]" style="--x: [y]"><script>a[0]</script><style>a[href]{}</style>ok</div>';
    expect(findPlaceholders(html)).toEqual([]);
  });
});

describe("findEmptyLinks", () => {
  it("trouve les liens vides ou vers #", () => {
    expect(findEmptyLinks('<a href="#">a</a><a href="">b</a><a href="#top">c</a>')).toEqual(['href="#"', 'href=""']);
  });
});

describe("findBrokenAnchors", () => {
  it("signale une ancre sans cible dans la page", () => {
    const html = '<a href="#contact">c</a><a href="#top">t</a><section id="top"></section>';
    expect(findBrokenAnchors(html, () => true)).toEqual(["#contact"]);
  });

  it("vérifie les liens internes vers d'autres pages", () => {
    const html = '<a href="/mentions-legales/">m</a><a href="/absent/">a</a><a href="/#top">h</a>';
    const exists = (path: string) => path !== "/absent/";
    expect(findBrokenAnchors(html, exists)).toEqual(["/absent/"]);
  });

  it("laisse « # » seul au contrôle des liens vides", () => {
    expect(findBrokenAnchors('<a href="#">x</a>', () => true)).toEqual([]);
  });

  it("ignore les liens externes et mailto", () => {
    expect(findBrokenAnchors('<a href="https://x.fr">x</a><a href="mailto:a@b.fr">m</a>', () => false)).toEqual([]);
  });
});

describe("findExternalResources", () => {
  it("trouve les ressources chargées depuis un autre domaine, pas les liens de navigation", () => {
    const html = [
      '<script src="https://cdn.example.com/a.js"></script>',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css">',
      '<img src="//example.com/i.png">',
      '<link rel="icon" href="/favicon.svg">',
      '<a href="https://github.com/x">GitHub</a>',
    ].join("");
    expect(findExternalResources(html)).toEqual([
      "https://cdn.example.com/a.js",
      "https://fonts.googleapis.com/css",
      "//example.com/i.png",
    ]);
  });

  it("trouve un import url() externe dans un style", () => {
    expect(findExternalResources("<style>@import url('https://fonts.example.com/x.css');</style>")).toEqual([
      "https://fonts.example.com/x.css",
    ]);
  });
});

describe("inlineScriptBytes", () => {
  it("additionne la taille des scripts en ligne, en octets UTF-8", () => {
    expect(inlineScriptBytes('<script>é</script><script type="module">ab</script><script src="/x.js"></script>')).toBe(4);
  });
});
