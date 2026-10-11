import { useEffect, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { House } from "@phosphor-icons/react";
import { PERSON } from "../data";
import Cursor from "./Cursor";

// "About" is a section of the home page (HashRouter owns the URL hash, so sections are reached with router state,
// which Home reads to scroll). "Contact" is its own page.
type NavItem = { label: string; to: string; section?: string };
const NAV: NavItem[] = [
  { label: "About", to: "/", section: "about" },
  { label: "Contact", to: "/contact" },
];

/** Reveal-on-scroll with IntersectionObserver (no scroll listeners). Elements carry .reveal; CSS does the motion. */
function useReveal(key: string) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-in)"));
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in")); return;
    }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
}

export default function Layout({ children, title }: { children: ReactNode; title: string }) {
  const loc = useLocation();
  const home = loc.pathname === "/";
  useEffect(() => { document.title = title; }, [title]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  useReveal(loc.pathname);

  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); const m = document.getElementById("main"); m?.focus(); m?.scrollIntoView(); }}>
        Skip to content
      </a>
      <header className="site-header">
        {!home && <Link to="/" className="wordmark" aria-label="Isaac Koh, home">Isaac<span>Koh</span></Link>}
        <nav className="nav-pill" aria-label="Main">
          {!home && <Link to="/" className="pill-home" aria-label="Home"><House size={18} weight="bold" aria-hidden="true" /></Link>}
          {NAV.map((n) => n.section ? (
            <Link key={n.label} to={n.to} state={{ section: n.section }} data-magnetic>{n.label}</Link>
          ) : (
            <NavLink key={n.label} to={n.to} data-magnetic className={({ isActive }) => (isActive ? "is-active" : "")}
              aria-current={loc.pathname === n.to ? "page" : undefined}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div className="wrap footer-row">
          <p className="footer-id"><Link to="/" className="footer-name">Isaac Koh</Link><span>© 2026</span></p>
          <ul className="footer-links" aria-label="Footer">
            <li><Link to="/" state={{ section: "about" }}>About</Link></li>
            <li><Link to="/" state={{ section: "work" }}>Recent work</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><a href={PERSON.github} rel="noopener noreferrer" target="_blank">GitHub</a></li>
            <li><button type="button" className="to-top" onClick={() => { window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); document.getElementById("main")?.focus({ preventScroll: true }); }}>Back to top</button></li>
          </ul>
        </div>
      </footer>
      <Cursor />
    </>
  );
}
