/** Générateur pseudo-aléatoire de la maquette (congruentiel linéaire) : même graine, même suite. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
