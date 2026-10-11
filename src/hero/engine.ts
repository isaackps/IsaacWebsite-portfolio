// Zero-ghosting canvas renderer for the cursor-tracking head.
// One rAF loop; each tick draws EXACTLY ONE pre-extracted WebP frame at 100% opacity.
// No frame is ever alpha-blended with another, the MP4 is never touched in the browser,
// and nothing on the page uses CSS 3D transforms: the head turns only because a different frame is drawn.
import meta from "./frames-meta.json";

export type HeroStats = {
  ticks: number; draws: number; maxDrawsPerTick: number; switches: number;
  index: number; mode: "center" | "frame"; framesLoaded: number; framesTotal: number;
  angle: number; target: number; lastTickMs: number; worstTickGapMs: number;
  face: { x: number; y: number }; deadzonePx: number;
};

const N = meta.slots;              // 64
const STEP = 360 / N;              // 5.625 deg
const FW = meta.frameSize.w, FH = meta.frameSize.h;
const LERP = 0.26;                 // response factor per 60 fps tick
const DEAD_IN = 0.12, DEAD_OUT = 0.145; // fraction of the screen radius (half-diagonal), with hysteresis

export const DIRECTION_ANGLE: Record<string, number> = {
  up: 0, "up-right": 45, right: 90, "down-right": 135, down: 180, "down-left": 225, left: 270, "up-left": 315,
};

export function lerpAngle(a: number, b: number, t: number) {
  const d = ((b - a + 540) % 360) - 180;        // shortest signed path, -180..180
  return (a + d * t + 360) % 360;
}

export function frameUrl(i: number) { return `frames/frame-${String(i).padStart(2, "0")}.webp`; }

type Layout = { W: number; H: number; dpr: number; s: number; ox: number; oy: number; fx: number; fy: number };

/** Where the frame sits on screen. Landscape: frame fills the height ("cover" on the axis that matters),
 *  face pushed right of centre so the bottom-left copy has room. Portrait: head scaled to the width and lifted,
 *  chest fades into the painted gradient (baked into the frames), copy sits underneath. Never crops the hat. */
export function computeLayout(W: number, H: number, dpr: number): Layout {
  const aspect = W / H;
  let s: number, fxScreen: number, top: number;
  const HAT_TOP = 6 + meta.face.y - 330;             // first hat row in frame coords (source row 6 + top pad)
  if (aspect >= 1.15) {
    s = Math.max(H / FH, (W * 0.58) / FW);            // fill the height; on ultra-wide keep the bust big enough
    s = Math.min(s, (H - 92) / (FH - HAT_TOP));        // ...but keep the hat clear of the nav pill
    fxScreen = W * (aspect > 1.6 ? 0.6 : 0.62);
    top = H - FH * s;                                  // bottom edge on the viewport bottom
  } else {
    // hat brim is ~545 source px wide; across all 64 turns the hat reaches 301 px either side of the face
    s = Math.min((W * 0.92) / 545, (H * 0.44) / 545, (W / 2 - 6) / 301);
    fxScreen = W * 0.5;
    const faceY = H * (aspect < 0.62 ? 0.36 : 0.37);
    top = Math.max(faceY - meta.face.y * s, 92 - HAT_TOP * s);
  }
  const ox = fxScreen - meta.face.x * s;
  return { W, H, dpr, s, ox, oy: top, fx: fxScreen, fy: top + meta.face.y * s };
}

export class HeroEngine {
  canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D;
  frames: (HTMLImageElement | null)[] = new Array(N).fill(null);
  center: HTMLImageElement | null = null;
  layout!: Layout;
  angle = 0; target = 0; inDead = true; hasPointer = false;
  px = 0; py = 0; raf = 0; last = 0; running = false; visible = true;
  fixed: number | "center" | null = null;     // debug ?look=
  touch = false; reduced = false; idleT0 = performance.now(); tapUntil = 0;
  lastDrawn: HTMLImageElement | null = null;
  stats: HeroStats;
  onReady?: () => void;

  constructor(canvas: HTMLCanvasElement, opts: { touch: boolean; reduced: boolean; fixed: number | "center" | null }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.touch = opts.touch; this.reduced = opts.reduced; this.fixed = opts.fixed;
    this.stats = { ticks: 0, draws: 0, maxDrawsPerTick: 0, switches: 0, index: -1, mode: "center", framesLoaded: 0,
      framesTotal: N + 1, angle: 0, target: 0, lastTickMs: 0, worstTickGapMs: 0, face: { x: 0, y: 0 }, deadzonePx: 0 };
    (window as any).__heroStats = this.stats;
  }

  load() {
    const c = new Image();
    c.decoding = "async";
    c.onload = () => { this.center = c; this.stats.framesLoaded++; this.paintBackground(); this.drawOnce(); this.onReady?.(); };
    c.src = "frames/center.webp";
    if (this.reduced) return;                      // reduced motion: the centre frame is all we ever show
    // Load the 64 turn frames in an order that fills the circle coarse-to-fine, so tracking works early.
    const order: number[] = [];
    for (let step = 16; step >= 1; step = step / 2) for (let i = 0; i < N; i += step) if (!order.includes(i)) order.push(i);
    order.forEach((i) => {
      const im = new Image();
      im.decoding = "async";
      im.onload = () => { (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => { this.frames[i] = im; this.stats.framesLoaded++; }); };
      im.src = frameUrl(i);
    });
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.layout = computeLayout(r.width, r.height, dpr);
    const L = this.layout;
    this.stats.face = { x: Math.round(L.fx), y: Math.round(L.fy) };
    this.stats.deadzonePx = Math.round(DEAD_IN * Math.hypot(L.W, L.H) / 2);
    this.paintBackground();
    this.lastDrawn = null;
    this.drawOnce();
  }

  /** The video's background, modelled offline as piecewise-linear stops, painted in screen space.
   *  The frames' left/right/top/bottom edges were feathered into this same gradient, so no edge is visible. */
  paintBackground() {
    const { ctx } = this; const L = this.layout; if (!L) return;
    const stops = meta.bgStops as { y: number; rgb: number[] }[];
    const y0 = (L.oy + stops[0].y * L.s) * L.dpr, y1 = (L.oy + stops[stops.length - 1].y * L.s) * L.dpr;
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((st) => g.addColorStop((st.y - stops[0].y) / (stops[stops.length - 1].y - stops[0].y), `rgb(${st.rgb.map((v) => v.toFixed(2)).join(",")})`));
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "copy";
    ctx.fillStyle = g; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // + the backdrop's soft horizontal vignette, added (not blended) over the frame's columns, full height
    const vs = meta.vignetteStops as { x: number; rgb: number[] }[];
    const [fx, , fw] = this.rect();
    const hg = ctx.createLinearGradient(fx, 0, fx + fw, 0);
    const xmax = vs[vs.length - 1].x;
    vs.forEach((st) => hg.addColorStop(st.x / xmax, `rgb(${st.rgb.map((v) => v.toFixed(2)).join(",")})`));
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = hg; ctx.fillRect(fx, 0, fw, this.canvas.height);
    ctx.globalCompositeOperation = "source-over";
  }

  rect() {
    const L = this.layout;
    // snap to whole device pixels: the frame is opaque, so nothing underneath can bleed through its edge
    const x = Math.round(L.ox * L.dpr), y = Math.round(L.oy * L.dpr);
    const w = Math.round(FW * L.s * L.dpr), h = Math.round(FH * L.s * L.dpr);
    return [x, y, w, h] as const;
  }

  pick(): HTMLImageElement | null {
    if (this.inDead || this.reduced) { this.stats.mode = "center"; return this.center; }
    const idx = ((Math.round(this.angle / STEP) % N) + N) % N;
    let im = this.frames[idx];
    if (!im) { // not loaded yet: nearest loaded neighbour (still one frame, never a blend)
      for (let k = 1; k < N / 2 && !im; k++) im = this.frames[(idx + k) % N] || this.frames[(idx - k + N) % N];
    }
    if (im) { if (this.stats.index !== idx) this.stats.switches++; this.stats.index = idx; this.stats.mode = "frame"; }
    return im || this.center;
  }

  /** draws one frame; returns 1 if it drew */
  draw(im: HTMLImageElement | null): number {
    if (!im || !this.layout) return 0;
    const [x, y, w, h] = this.rect();
    this.ctx.globalAlpha = 1;                          // 100% opacity, always
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.drawImage(im, x, y, w, h);
    this.lastDrawn = im;
    this.stats.draws++;
    return 1;
  }

  drawOnce() { this.draw(this.reduced || this.inDead ? this.center : this.pick()); }

  setPointer(x: number, y: number) { this.px = x; this.py = y; this.hasPointer = true; }
  clearPointer() { this.hasPointer = false; }
  tap(x: number, y: number) { this.setPointer(x, y); this.tapUntil = performance.now() + 2600; }

  updateTarget(now: number) {
    const L = this.layout;
    if (this.fixed !== null) {
      if (this.fixed === "center") { this.inDead = true; return; }
      this.inDead = false; this.target = this.fixed; this.angle = this.fixed; return;
    }
    let usePointer = this.hasPointer && (!this.touch || now < this.tapUntil);
    if (usePointer) {
      const dx = this.px - L.fx, dy = this.py - L.fy;
      const r = Math.hypot(dx, dy), R = Math.hypot(L.W, L.H) / 2;
      this.inDead = this.inDead ? r < DEAD_OUT * R : r < DEAD_IN * R;
      this.target = ((Math.atan2(dy, dx) * 180) / Math.PI + 90 + 360) % 360; // 0 = up, clockwise
      return;
    }
    if (this.touch) {
      // idle look-around for touch screens: hold eye contact, then one slow clockwise circle
      const t = ((now - this.idleT0) / 1000) % 13;
      if (t < 3 || t > 11.5) { this.inDead = true; return; }
      this.inDead = false;
      this.target = (((t - 3) / 8.5) * 360) % 360;
      if (t < 3.1) this.angle = this.target;
      return;
    }
    this.inDead = true;                                // no pointer on the page: look at the visitor
  }

  tick = (now: number) => {
    if (!this.running) return;
    const dt = this.last ? Math.min(now - this.last, 100) : 16.67;
    if (this.last) this.stats.worstTickGapMs = Math.max(this.stats.worstTickGapMs, now - this.last);
    this.last = now;
    this.updateTarget(now);
    const k = 1 - Math.pow(1 - LERP, dt / 16.667);    // frame-rate independent version of factor 0.26
    this.angle = lerpAngle(this.angle, this.target, k);
    this.stats.angle = Math.round(this.angle * 10) / 10; this.stats.target = Math.round(this.target * 10) / 10;
    const drew = this.draw(this.pick());                // exactly one drawImage per tick
    this.stats.ticks++;
    this.stats.maxDrawsPerTick = Math.max(this.stats.maxDrawsPerTick, drew);
    this.stats.lastTickMs = performance.now() - now;
    this.raf = requestAnimationFrame(this.tick);
  };

  start() {
    if (this.reduced || this.running) return;
    this.running = true; this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
}
