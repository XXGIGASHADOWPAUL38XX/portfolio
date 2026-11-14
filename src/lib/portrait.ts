import sharp from "sharp";
import type { Sprite } from "./sprites";

const THRESHOLD = 128;
const WHITE = 255;

/** Diffusion de Floyd–Steinberg : (dx, dy, poids sur 16) vers les voisins pas encore traités. */
const DIFFUSION = [
  [1, 0, 7],
  [-1, 1, 3],
  [0, 1, 5],
  [1, 1, 1],
] as const;

/**
 * Tramage 1 bit d'une image en niveaux de gris (une valeur 0–255 par pixel, ligne par ligne).
 * Les zones claires deviennent des pixels allumés (« # »), comme une photo en vert signal sur noir.
 */
export function ditherToSprite(gray: Uint8Array, width: number, height: number): Sprite {
  if (gray.length !== width * height) {
    throw new Error(`Le tampon (${gray.length}) ne correspond pas aux dimensions ${width}×${height}.`);
  }
  const levels = Float32Array.from(gray);
  const lit = new Uint8Array(width * height);
  // L'itérateur lit chaque niveau au moment du passage, erreur des voisins déjà traités comprise.
  // Une écriture sous la dernière ligne tombe hors du tableau et est ignorée par Float32Array.
  for (const [index, level] of levels.entries()) {
    const x = index % width;
    const on = level >= THRESHOLD;
    lit[index] = on ? 1 : 0;
    const error = level - (on ? WHITE : 0);
    for (const [dx, dy, weight] of DIFFUSION) {
      const nx = x + dx;
      if (nx >= 0 && nx < width) levels[index + dy * width + dx] += (error * weight) / 16;
    }
  }
  return Array.from({ length: height }, (_, y) =>
    Array.from(lit.subarray(y * width, (y + 1) * width), (on) => (on ? "#" : ".")).join(""),
  );
}

/** Lit la photo, la recadre sur la grille de pixels du portrait et la trame en 1 bit. */
export async function loadPortraitSprite(path: string, grid: { columns: number; rows: number }): Promise<Sprite> {
  const { data, info } = await sharp(path)
    .resize(grid.columns, grid.rows, { fit: "cover", position: "attention" })
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return ditherToSprite(new Uint8Array(data), info.width, info.height);
}
