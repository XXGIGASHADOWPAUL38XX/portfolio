/**
 * Lecture des tokens dans signal-tokens.css, la seule source des valeurs de design.
 * La première déclaration d'un token est celle du thème sombre (le thème par défaut).
 */
export function readToken(css: string, name: string): string {
  const value = new RegExp(`--${name}\\s*:\\s*([^;]+);`).exec(css)?.[1];
  if (!value) throw new Error(`Token --${name} introuvable dans les tokens.`);
  return value.trim();
}

export function readPxToken(css: string, name: string): number {
  const value = readToken(css, name);
  const pixels = /^(\d+(?:\.\d+)?)px$/.exec(value)?.[1];
  if (!pixels) throw new Error(`Token --${name} attendu en px, reçu « ${value} ».`);
  return Number(pixels);
}
