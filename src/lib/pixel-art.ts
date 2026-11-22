import { createRng } from "./random";
import { SHADES, type Sprite } from "./sprites";

export interface PixelGrid {
  /** Côté d'un pixel (--pixel-unit). */
  unit: number;
  /** Pas de la grille (--pixel-pitch). */
  pitch: number;
}

export interface SpriteGeometry {
  width: number;
  height: number;
  /** shade : intensité du vert, de 1/3 à 1. */
  cells: { x: number; y: number; shade: number }[];
}

const FULL = SHADES.length - 1;

/** Intensité d'un caractère de sprite (0 pour l'éteint et tout caractère hors de SHADES). */
const shadeOf = (pixel: string) => Math.max(0, SHADES.indexOf(pixel)) / FULL;

/** Position et intensité de chaque pixel allumé et taille du sprite, sans l'écart après le dernier pixel. */
export function spriteGeometry(sprite: Sprite, { unit, pitch }: PixelGrid): SpriteGeometry {
  const columns = Math.max(0, ...sprite.map((row) => row.length));
  const extent = (count: number) => (count === 0 ? 0 : count * pitch - (pitch - unit));
  const cells = sprite.flatMap((row, y) =>
    [...row].flatMap((pixel, x) => {
      const shade = shadeOf(pixel);
      return shade > 0 ? [{ x: x * pitch, y: y * pitch, shade }] : [];
    }),
  );
  return { width: extent(columns), height: extent(sprite.length), cells };
}

/** Délai d'allumage de chaque pixel pour l'apparition au scroll (ms), comme PixelArt de Signal. */
export function revealDelays(count: number, seed: number, duration: number): number[] {
  const rng = createRng(seed);
  return Array.from({ length: count }, () => Math.round(rng() * duration));
}
