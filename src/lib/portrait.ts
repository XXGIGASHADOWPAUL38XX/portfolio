import sharp from "sharp";

const WHITE = 255;

/**
 * Caractères pour les tons du plus sombre au plus clair. Comme de l'encre, les zones sombres de la photo
 * (cheveux, yeux, vêtement) prennent les caractères denses et le fond clair s'efface : sans cela, le mur
 * derrière le visage, plus clair que la peau, serait la zone la plus dense du portrait.
 */
export const ASCII_RAMP = "@%#*+=-:. ";

/**
 * Proportions d'une cellule de caractère en JetBrains Mono : chasse de 0,6 em, interligne de 1 em.
 * Partagées par le recadrage de la photo et le viewBox du rendu, pour que le visage ne soit pas étiré.
 */
export const ASCII_CELL = { width: 6, height: 10 } as const;

/** Diffusion de Floyd–Steinberg : (dx, dy, poids sur 16) vers les voisins pas encore traités. */
const DIFFUSION = [
  [1, 0, 7],
  [-1, 1, 3],
  [0, 1, 5],
  [1, 1, 1],
] as const;

/**
 * Tramage d'une image en niveaux de gris (une valeur 0–255 par pixel, ligne par ligne) sur une palette
 * de caractères rangés du plus sombre au plus clair (« .# » : 1 bit ; ASCII_RAMP : portrait ASCII).
 * Les zones claires prennent les derniers caractères de la palette.
 */
export function ditherToText(gray: Uint8Array, width: number, height: number, palette: string): string[] {
  if (gray.length !== width * height) {
    throw new Error(`Le tampon (${gray.length}) ne correspond pas aux dimensions ${width}×${height}.`);
  }
  const levels = Float32Array.from(gray);
  const step = WHITE / (palette.length - 1);
  const shade = new Uint8Array(width * height);
  // L'itérateur lit chaque niveau au moment du passage, erreur des voisins déjà traités comprise.
  // Une écriture sous la dernière ligne tombe hors du tableau et est ignorée par Float32Array.
  // Pas de bornes sur l'arrondi : l'erreur reçue reste sous un demi-pas, donc dans la palette.
  for (const [index, level] of levels.entries()) {
    const x = index % width;
    const nearest = Math.round(level / step);
    shade[index] = nearest;
    const error = level - nearest * step;
    for (const [dx, dy, weight] of DIFFUSION) {
      const nx = x + dx;
      if (nx >= 0 && nx < width) levels[index + dy * width + dx] += (error * weight) / 16;
    }
  }
  return Array.from({ length: height }, (_, y) =>
    Array.from(shade.subarray(y * width, (y + 1) * width), (i) => palette[i]).join(""),
  );
}

/** Lit la photo, la recadre aux proportions de la grille de caractères et la trame avec ASCII_RAMP. */
export async function loadPortraitAscii(path: string, grid: { columns: number; rows: number }): Promise<string[]> {
  // Recadrage en pixels carrés à la taille réelle de la grille, puis une valeur par caractère.
  const framed = await sharp(path)
    .resize(grid.columns * ASCII_CELL.width, grid.rows * ASCII_CELL.height, { fit: "cover", position: "attention" })
    .grayscale()
    .normalise()
    .toBuffer();
  const { data, info } = await sharp(framed)
    .resize(grid.columns, grid.rows, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return ditherToText(new Uint8Array(data), info.width, info.height, ASCII_RAMP);
}
