import css from "../styles/signal-tokens.css?raw";
import type { PixelGrid } from "./pixel-art";
import { readPxToken } from "./tokens";

/** Grille des pixels (--pixel-unit, --pixel-pitch), lue dans les tokens Signal pour les SVG générés. */
export const PIXEL_GRID: PixelGrid = {
  unit: readPxToken(css, "pixel-unit"),
  pitch: readPxToken(css, "pixel-pitch"),
};
