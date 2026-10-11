import { useEffect, useRef } from "react";

// Custom magnetic cursor: a glowing dot that sits exactly on the pointer and an aura ring that trails it.
// Fine pointers only (never on touch), off under prefers-reduced-motion, and it never takes focus or
// intercepts events (pointer-events: none). Continuous values live in refs and are written straight to
// transforms in one rAF loop, so React never re-renders on mouse move.
const INTERACTIVE = "a, button, [data-magnetic], input, textarea, select, summary, label[for], [role='button']";

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");
    let x = -100, y = -100, rx = -100, ry = -100, scale = 1, sTarget = 1, raf = 0, shown = false, last = 0;
    let mag: HTMLElement | null = null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX; y = e.clientY;
      if (!shown) { rx = x; ry = y; shown = true; root.classList.add("cursor-on"); }
      const el = (e.target as Element)?.closest?.(INTERACTIVE) as HTMLElement | null;
      sTarget = el ? 1.9 : 1;
      ring.current?.classList.toggle("is-hover", !!el);
      root.classList.toggle("cursor-hover", !!el);
      root.classList.toggle("cursor-text", !!(e.target as Element)?.closest?.("input, textarea"));
      // magnetic pull: the hovered element drifts a little toward the pointer
      const m = (e.target as Element)?.closest?.("[data-magnetic]") as HTMLElement | null;
      if (mag && mag !== m) { mag.style.transform = ""; }
      mag = m;
      if (m) {
        const r = m.getBoundingClientRect();
        const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
        m.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
      }
    };
    const onLeave = () => { shown = false; root.classList.remove("cursor-on"); if (mag) { mag.style.transform = ""; mag = null; } };
    const onDown = () => ring.current?.classList.add("is-down");
    const onUp = () => ring.current?.classList.remove("is-down");

    const loop = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16.7; last = now;
      const k = 1 - Math.pow(1 - 0.2, dt / 16.7);
      rx += (x - rx) * k; ry += (y - ry) * k;
      scale += (sTarget - scale) * (1 - Math.pow(1 - 0.18, dt / 16.7));
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor", "cursor-on", "cursor-text", "cursor-hover");
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
