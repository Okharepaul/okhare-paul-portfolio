import { mulberry32, type Rng } from "./swarm/spectral";

/**
 * Procedural figures. Every image on the site is drawn in code in two
 * colours, so nothing here is a file: each function paints one figure onto a
 * canvas in the given colour, on a transparent ground.
 */

export type ArtName = "ridge" | "noise" | "frames" | "routes" | "pipeline" | "mark" | "board" | "tiers" | "numeral";

export interface ArtOptions {
  width: number;
  height: number;
  color: string;
  /** Needed by "mark": the logo, already loaded. */
  image?: CanvasImageSource | null;
  /** Needed by "numeral": the text to set. */
  text?: string;
}

type Painter = (ctx: CanvasRenderingContext2D, options: ArtOptions, rng: Rng) => void;

/* ---------------------------------------------------------------- noise */
function hash2(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const tx = smooth(x - xi);
  const ty = smooth(y - yi);
  const top = hash2(xi, yi) * (1 - tx) + hash2(xi + 1, yi) * tx;
  const bottom = hash2(xi, yi + 1) * (1 - tx) + hash2(xi + 1, yi + 1) * tx;
  return top * (1 - ty) + bottom * ty;
}

/** Fractal noise, roughly 0..1. */
function fbm(x: number, y: number): number {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let octave = 0; octave < 4; octave += 1) {
    total += amplitude * valueNoise(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / 0.9375;
}

const BAYER_4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((value) => (value + 0.5) / 16);

/* -------------------------------------------------------------- painters */

/** Stacked ridgelines rising to a peak in the middle (footer). */
const ridge: Painter = (ctx, { width, height, color }) => {
  const lines = 46;
  const step = Math.max(3, width / 320);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, width / 1100);

  for (let line = 0; line < lines; line += 1) {
    const baseY = height * (0.2 + (0.78 * line) / (lines - 1));
    ctx.beginPath();
    for (let x = 0; x <= width + step; x += step) {
      const centred = (x / width - 0.5) / 0.19;
      const envelope = Math.exp(-centred * centred);
      const lift = envelope * height * 0.42 * fbm(x / (width * 0.06), line * 0.21 + 3.7) ** 1.6;
      const ripple = (fbm(x / (width * 0.02), line * 1.7) - 0.5) * height * 0.012;
      const y = baseY - lift + ripple;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    // Erase whatever sits below this line so nearer ridges hide farther ones.
    ctx.save();
    ctx.lineTo(width + step, height + 2);
    ctx.lineTo(0, height + 2);
    ctx.closePath();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fill();
    ctx.restore();
    ctx.stroke();
  }
};

/** Dithered cloud of noise (the band behind the scrolling words). */
const noise: Painter = (ctx, { width, height, color }) => {
  const cell = Math.max(4, Math.round(width / 260));
  ctx.fillStyle = color;
  for (let row = 0; row * cell < height; row += 1) {
    for (let column = 0; column * cell < width; column += 1) {
      const value = fbm(column / 26, row / 9) * 0.9 + fbm(column / 70 + 9, row / 30) * 0.35 - 0.28;
      if (value > BAYER_4[(row % 4) * 4 + (column % 4)]) ctx.fillRect(column * cell, row * cell, cell - 1, cell - 1);
    }
  }
};

/** One layout at three sizes: desktop, tablet, phone. */
const frames: Painter = (ctx, { width, height, color }) => {
  const unit = Math.min(width, height);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, unit / 260);

  const screen = (x: number, y: number, w: number, h: number, columns: number): void => {
    ctx.strokeRect(x, y, w, h);
    const bar = h * 0.09;
    ctx.fillRect(x, y, w, bar);
    const pad = w * 0.06;
    const heroHeight = h * 0.3;
    ctx.strokeRect(x + pad, y + bar + pad, w - pad * 2, heroHeight);
    for (let i = 0; i < 9; i += 1) {
      const lineX = x + pad + ((w - pad * 2) * i) / 9;
      ctx.beginPath();
      ctx.moveTo(lineX, y + bar + pad + heroHeight);
      ctx.lineTo(lineX + heroHeight * 0.6, y + bar + pad);
      ctx.stroke();
    }
    const top = y + bar + pad * 2 + heroHeight;
    const gap = pad * 0.6;
    const cardWidth = (w - pad * 2 - gap * (columns - 1)) / columns;
    for (let column = 0; column < columns; column += 1) {
      ctx.strokeRect(x + pad + column * (cardWidth + gap), top, cardWidth, y + h - pad - top);
    }
  };

  screen(width * 0.06, height * 0.14, width * 0.56, height * 0.64, 3);
  ctx.clearRect(width * 0.5, height * 0.3, width * 0.3, height * 0.6);
  screen(width * 0.5, height * 0.3, width * 0.3, height * 0.6, 2);
  ctx.clearRect(width * 0.76, height * 0.42, width * 0.17, height * 0.5);
  screen(width * 0.76, height * 0.42, width * 0.17, height * 0.5, 1);
};

/** Delivery routes fanning out from three hubs. */
const routes: Painter = (ctx, { width, height, color }, rng) => {
  const unit = Math.min(width, height);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const hubs = [
    { x: width * 0.3, y: height * 0.42, reach: unit * 0.44, rays: 90 },
    { x: width * 0.7, y: height * 0.6, reach: unit * 0.36, rays: 70 },
    { x: width * 0.62, y: height * 0.22, reach: unit * 0.22, rays: 40 },
  ];
  hubs.forEach((hub) => {
    for (let ray = 0; ray < hub.rays; ray += 1) {
      const angle = rng() * Math.PI * 2;
      const length = hub.reach * (0.18 + 0.82 * rng() ** 1.7);
      const endX = hub.x + Math.cos(angle) * length;
      const endY = hub.y + Math.sin(angle) * length;
      ctx.lineWidth = Math.max(0.6, (unit / 420) * (0.4 + rng()));
      ctx.beginPath();
      ctx.moveTo(hub.x, hub.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      if (ray % 3 === 0) ctx.fillRect(endX - unit * 0.006, endY - unit * 0.006, unit * 0.012, unit * 0.012);
    }
    const ring = unit * 0.045;
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, ring, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, ring * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
};

/** A release moving through four stages, drawn as blocks that thin out. */
const pipeline: Painter = (ctx, { width, height, color }) => {
  const columns = 28;
  const cell = width / columns;
  const rows = Math.ceil(height / cell);
  ctx.fillStyle = color;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const stage = Math.floor((column / columns) * 4);
      const wave = 0.5 + 0.5 * Math.sin(row * 0.55 + stage * 1.3);
      const fill = Math.max(0, 1 - column / columns) * 0.75 + wave * 0.25 * hash2(column, row);
      const size = cell * Math.min(0.92, fill);
      if (size < 1) continue;
      ctx.fillRect(column * cell + (cell - size) / 2, row * cell + (cell - size) / 2, size, size);
    }
  }
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  for (let stage = 1; stage < 4; stage += 1) ctx.fillRect((width * stage) / 4 - cell * 0.15, 0, cell * 0.3, height);
  ctx.restore();
};

/** The mark on its construction grid. */
const mark: Painter = (ctx, { width, height, color, image }) => {
  const unit = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, unit / 420);

  [0.44, 0.3, 0.16].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(cx, cy, unit * radius, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.strokeRect(cx - unit * 0.44, cy - unit * 0.44, unit * 0.88, unit * 0.88);
  [
    [cx - unit * 0.48, cy, cx + unit * 0.48, cy],
    [cx, cy - unit * 0.48, cx, cy + unit * 0.48],
    [cx - unit * 0.44, cy - unit * 0.44, cx + unit * 0.44, cy + unit * 0.44],
    [cx + unit * 0.44, cy - unit * 0.44, cx - unit * 0.44, cy + unit * 0.44],
  ].forEach(([x0, y0, x1, y1]) => {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  });

  if (!image) return;
  const size = unit * 0.5;
  const stamp = document.createElement("canvas");
  stamp.width = Math.round(size);
  stamp.height = Math.round(size * (172 / 204));
  const stampCtx = stamp.getContext("2d");
  if (!stampCtx) return;
  stampCtx.drawImage(image, 0, 0, stamp.width, stamp.height);
  stampCtx.globalCompositeOperation = "source-in";
  stampCtx.fillStyle = color;
  stampCtx.fillRect(0, 0, stamp.width, stamp.height);
  ctx.clearRect(cx - stamp.width / 2 - 6, cy - stamp.height / 2 - 6, stamp.width + 12, stamp.height + 12);
  ctx.drawImage(stamp, cx - stamp.width / 2, cy - stamp.height / 2);
};

/** A chessboard with one bishop's diagonal picked out. */
const board: Painter = (ctx, { width, height, color }) => {
  const cell = Math.min(width, height) / 9.5;
  const left = (width - cell * 8) / 2;
  const top = (height - cell * 8) / 2;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, cell / 28);
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const isDiagonal = file + rank === 7;
      const x = left + file * cell;
      const y = top + rank * cell;
      if (isDiagonal) {
        ctx.fillRect(x, y, cell, cell);
      } else if ((file + rank) % 2 === 1) {
        // Dark squares are hatched rather than filled, so the diagonal stays the loudest thing.
        for (let line = 1; line < 5; line += 1) {
          ctx.beginPath();
          ctx.moveTo(x + (cell * line) / 5, y);
          ctx.lineTo(x, y + (cell * line) / 5);
          ctx.moveTo(x + cell, y + (cell * line) / 5);
          ctx.lineTo(x + (cell * line) / 5, y + cell);
          ctx.stroke();
        }
      }
    }
  }
  ctx.strokeRect(left, top, cell * 8, cell * 8);
};

/** Three plans side by side, each a taller stack of blocks. */
const tiers: Painter = (ctx, { width, height, color }) => {
  const columnWidth = width * 0.17;
  const gap = width * 0.07;
  const block = columnWidth / 4;
  const left = (width - columnWidth * 3 - gap * 2) / 2;
  const base = height * 0.86;
  ctx.fillStyle = color;
  [5, 8, 12].forEach((rows, tier) => {
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        const inset = block * (tier === 2 ? 0.08 : 0.2);
        ctx.fillRect(left + tier * (columnWidth + gap) + column * block + inset, base - (row + 1) * block + inset, block - inset * 2, block - inset * 2);
      }
    }
  });
  ctx.fillRect(left - gap / 2, base + block * 0.3, columnWidth * 3 + gap * 3, Math.max(1.5, height / 300));
};

/** A large outlined numeral, for projects that have no figure yet. */
const numeral: Painter = (ctx, { width, height, color, text = "" }) => {
  const size = Math.min(height * 0.9, width * 0.6);
  ctx.font = `300 ${size}px "Big Shoulders", "Arial Narrow", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.5, size / 160);
  ctx.strokeText(text, width / 2, height / 2 + size * 0.04);
};

const PAINTERS: Record<ArtName, Painter> = { ridge, noise, frames, routes, pipeline, mark, board, tiers, numeral };

const SEEDS: Record<ArtName, number> = { ridge: 11, noise: 23, frames: 37, routes: 41, pipeline: 53, mark: 67, board: 71, tiers: 83, numeral: 97 };

/** Paints `name` onto the context. Deterministic: the same figure every time. */
export function paintArt(name: ArtName, ctx: CanvasRenderingContext2D, options: ArtOptions): void {
  ctx.clearRect(0, 0, options.width, options.height);
  PAINTERS[name](ctx, options, mulberry32(SEEDS[name]));
}
