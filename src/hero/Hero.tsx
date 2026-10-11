import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import { PERSON } from "../data";
import { HeroEngine, DIRECTION_ANGLE } from "./engine";

function debugLook(): number | "center" | null {
  const q = new URLSearchParams(window.location.search || window.location.hash.split("?")[1] || "");
  const v = q.get("look");
  if (!v) return null;
  if (v === "center") return "center";
  if (v in DIRECTION_ANGLE) return DIRECTION_ANGLE[v];
  const n = Number(v);
  return Number.isFinite(n) ? ((n % 360) + 360) % 360 : null;
}

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!, hero = heroRef.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const eng = new HeroEngine(canvas, { touch, reduced, fixed: debugLook() });
    eng.onReady = () => setReady(true);
    const readyFallback = window.setTimeout(() => setReady(true), 1200); // copy never waits on images
    eng.resize();
    eng.load();

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.pointerType === "pen") {
        const r = canvas.getBoundingClientRect();
        eng.setPointer(e.clientX - r.left, e.clientY - r.top);
      }
    };
    const onLeave = (e: PointerEvent) => { if (e.pointerType !== "touch") eng.clearPointer(); }; // a finger lifting also fires pointerleave
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") { const r = canvas.getBoundingClientRect(); eng.tap(e.clientX - r.left, e.clientY - r.top); }
    };
    // the mobile scrim keys off where the copy starts, so the copy always sits on dark, whatever the phone height
    const copy = hero.querySelector<HTMLElement>(".hero-copy")!;
    const placeScrim = () => hero.style.setProperty("--copy-top", `${copy.offsetTop}px`);
    const ro = new ResizeObserver(placeScrim); ro.observe(copy); ro.observe(hero); placeScrim();
    const onResize = () => eng.resize();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    hero.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("resize", onResize);

    // run the loop only while the hero is on screen and the tab is visible
    const io = new IntersectionObserver(([en]) => { eng.visible = en.isIntersecting; sync(); }, { threshold: 0 });
    io.observe(hero);
    const sync = () => (eng.visible && !document.hidden ? eng.start() : eng.stop());
    document.addEventListener("visibilitychange", sync);
    sync();
    (window as any).__hero = eng;
    return () => {
      eng.stop(); io.disconnect(); ro.disconnect(); window.clearTimeout(readyFallback);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      hero.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <section ref={heroRef} className={`hero ${ready ? "is-ready" : ""}`} aria-label="Introduction">
      <canvas ref={canvasRef} className="hero-canvas" role="img"
        aria-label="Illustrated portrait of Isaac in a straw fedora and white T-shirt. His head turns to follow your cursor." />
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-copy">
        <p className="hero-hi">Hi, I'm</p>
        <h1 className="hero-name">Isaac</h1>
        <p className="hero-bio">
          Technical lead at DEX, building open frameworks for verifiable documents: TrustVC, TradeTrust and OpenCerts.
          Full-stack roots, design-school eye.
        </p>
        <div className="hero-ctas">
          <a href={PERSON.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-solid" data-magnetic
            aria-label="Resume on LinkedIn (opens in a new tab)">
            Resume <ArrowUpRight size={18} weight="bold" aria-hidden="true" />
          </a>
          <Link to="/contact" className="btn btn-glass" data-magnetic>Let's talk</Link>
        </div>
      </div>
    </section>
  );
}
