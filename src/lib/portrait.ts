import sharp from "sharp";
import { SHADES, type Sprite } from "./sprites";

const WHITE = 255;

/** Diffusion de Floyd–Steinberg : (dx, dy, poids sur 16) vers les voisins pas encore traités. */
const DIFFUSION = [
  [1, 0, 7],
  [-1, 1, 3],
  [0, 1, 5],
  [1, 1, 1],
] as const;

/**
 * Tramage d'une image en niveaux de gris (une valeur 0–255 par pixel, ligne par ligne) sur une palette
 * de caractères rangés du plus sombre au plus clair (« .# » : 1 bit ; SHADES : nuances de vert).
 * Les zones claires deviennent des pixels allumés, comme une photo en vert signal sur noir.
 */
export function ditherToSprite(gray: Uint8Array, width: number, height: number, palette: string): Sprite {
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

/** Lit la photo, la recadre sur la grille de pixels du portrait et la trame en nuances de vert. */
export async function loadPortraitSprite(path: string, grid: { columns: number; rows: number }): Promise<Sprite> {
  const { data, info } = await sharp(path)
    .resize(grid.columns, grid.rows, { fit: "cover", position: "attention" })
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return ditherToSprite(new Uint8Array(data), info.width, info.height, SHADES);
}
