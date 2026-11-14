import type { APIRoute } from "astro";
import css from "../styles/signal-tokens.css?raw";
import { PIXEL_GRID } from "../lib/design-tokens";
import { spriteGeometry } from "../lib/pixel-art";
import { FAVICON } from "../lib/sprites";
import { readToken } from "../lib/tokens";

/** Favicon généré au build : le sprite FAVICON en vert signal sur fond noir (thème sombre). */
export const GET: APIRoute = () => {
  const { width, height, cells } = spriteGeometry(FAVICON, PIXEL_GRID);
  const pad = PIXEL_GRID.pitch;
  const size = Math.max(width, height) + 2 * pad;
  const rects = cells
    .map((cell) => `<rect x="${cell.x + pad}" y="${cell.y + pad}" width="${PIXEL_GRID.unit}" height="${PIXEL_GRID.unit}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${readToken(css, "bg")}"/><g fill="${readToken(css, "signal")}">${rects}</g></svg>`;
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
};
