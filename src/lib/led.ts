import { createRng } from "./random";

/** Barres du mini-spectre du nœud « Analyse », en cellules (renderVals de la maquette). */
export const MINI_SPECTRUM: readonly number[] = [4, 4, 3, 4, 3, 3, 2, 3, 2, 2, 2, 3, 2, 1, 2, 1, 1, 2, 1, 1];

const SPECTRUM_BARS = 113;
const SPECTRUM_MAX_CELLS = 22;
const SPECTRUM_SEED = 5;

/** Hauteur en cellules des 113 barres du spectre : graves, médiums, un pic, du bruit à graine fixe. */
export function ledSpectrum(): number[] {
  const rng = createRng(SPECTRUM_SEED);
  return Array.from({ length: SPECTRUM_BARS }, (_, i) => {
    const bass = 18 * Math.exp(-i / 14);
    const mids = 7 * Math.exp(-(((i - 48) / 16) ** 2));
    const peak = 4 * Math.exp(-(((i - 84) / 5) ** 2));
    return Math.min(SPECTRUM_MAX_CELLS, Math.round(3 + bass + mids + peak + rng() * 3 - i * 0.02));
  });
}

const STRIP_LEDS = 110;

/** LED allumées du ruban : une large plage de graves, un motif alterné, un éclat dans les aigus. */
export function ledStrip(): boolean[] {
  const alternating = (i: number) => i > 52 && i < 64 && i % 2 === 0;
  const burst = (i: number) => i > 90 && i < 96;
  return Array.from({ length: STRIP_LEDS }, (_, i) => i < 44 || alternating(i) || burst(i));
}
