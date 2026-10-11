import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import Layout from "../components/Layout";
import Hero from "../hero/Hero";
import { PERSON, PROJECTS, ROLES, SPEC } from "../data";

/** Keep hyphenated words (e-commerce, distributed-ledger) from breaking across lines. */
function nb(text: string) {
  return text.split(/(\S+-\S+)/).map((t, i) => (i % 2 ? <span key={i} className="nowrap">{t}</span> : t));
}

/** Nav, footer and old /about, /work links arrive with { section } in router state: scroll to that section. */
function useSectionScroll() {
  const loc = useLocation();
  useEffect(() => {
    const id = (loc.state as { section?: string } | null)?.section;
    if (!id) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smooth = !reduced && window.scrollY > 0; // already on the page: glide; arriving from elsewhere: jump
    const go = () => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      el.focus({ preventScroll: true });
    };
    const raf = requestAnimationFrame(() => requestAnimationFrame(go)); // after Layout's scroll-to-top and first layout
    return () => cancelAnimationFrame(raf);
  }, [loc.key]);
}

export default function Home() {
  useSectionScroll();

  return (
    <Layout title="Isaac Koh, Technical Lead at DEX">
      <Hero />

      {/* ---------- about (was its own page in v3) */}
      <section id="about" className="now wrap section-anchor" tabIndex={-1} aria-labelledby="about-h">
        <h2 id="about-h" className="sr-only">About</h2>
        <p className="statement reveal">
          Right now I lead engineering at <strong>DEX</strong> on TrustVC, TradeTrust and OpenCerts: open frameworks that let
          anyone check a credential, a trade document or a certificate if it's genuine.
        </p>
        <dl className="facts reveal">
          <div><dt>Role</dt><dd>Technical Lead</dd></div>
          <div><dt>Organisation</dt><dd>DEX</dd></div>
          <div><dt>Since</dt><dd>April 2026, on secondment from IMDA</dd></div>
        </dl>
      </section>

      <section className="ledger wrap" aria-labelledby="story-h">
        <h2 id="story-h" className="h2 reveal">From design school <span className="accent">to tech lead</span></h2>
        <div className="ledger-rows">
          <article className="ledger-row reveal">
            <h3 className="ledger-name ledger-name-sm">Design roots</h3>
            <p className="ledger-text">I trained in design before I wrote production code: a diploma in Interactive Media Informatics (Digital Media) at
              Temasek Polytechnic, then a Bachelor of Digital Media in Web Design and Animation at UNSW's College of Fine Arts
              (COFA) in Sydney, where I was awarded an International High Achiever Scholarship.</p>
          </article>
          <article className="ledger-row reveal">
            <h3 className="ledger-name ledger-name-sm">Running something</h3>
            <p className="ledger-text">Back in Singapore, my wife and I co-founded Lim Koh Pi LLP, the business behind My Sister Bakes. I designed, built
              and maintained its <span className="nowrap">e-commerce</span> site, and also looked after accounts, budgeting and training new staff.</p>
          </article>
          <article className="ledger-row reveal">
            <h3 className="ledger-name ledger-name-sm">Full-stack years</h3>
            <p className="ledger-text">Then six years as a full-stack engineer: at PALO IT on web products for banking and government clients, including
              DBS, Standard Chartered and MOM, and at Cognizant as a Senior Software Engineer on TradeTrust.</p>
          </article>
          <article className="ledger-row reveal">
            <h3 className="ledger-name ledger-name-sm">Product, then leading engineering</h3>
            <p className="ledger-text">At IMDA I became Lead Technical Product Manager for TrustVC and TradeTrust, planning their architecture and
              roadmap and running the Scrum team. Since April 2026 I've been seconded to DEX, an IMDA subsidiary, as Technical
              Lead: I own the system architecture and technical roadmap, including AI-powered features, and still run the
              team's Scrum.</p>
          </article>
        </div>
      </section>

      <section className="ledger wrap" aria-labelledby="roles-h">
        <h2 id="roles-h" className="h2 reveal">Roles</h2>
        <ul className="ledger-rows">
          {ROLES.flatMap((g) => g.items).map((r) => (
            <li key={r.title + r.org} className="ledger-row reveal">
              <div>
                <p className="row-kicker">{r.when}</p>
                <h3 className="ledger-name ledger-name-sm">{r.title}</h3>
              </div>
              <div className="ledger-text">
                <p className="row-org">{r.org}</p>
                {r.note && <p>{nb(r.note)}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- recent work: title + description only */}
      <section id="work" className="ledger wrap section-anchor" tabIndex={-1} aria-labelledby="work-h">
        <h2 id="work-h" className="h2 reveal">Recent work</h2>
        <ul className="ledger-rows">
          {PROJECTS.map((p) => (
            <li key={p.slug} className="ledger-row reveal">
              <h3 className="ledger-name">{p.name}</h3>
              <p className="ledger-text">{nb(p.description)}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- standards: same two-column rhythm as Recent work */}
      <section id="standards" className="ledger standards wrap section-anchor" tabIndex={-1} aria-labelledby="standards-h">
        <h2 id="standards-h" className="h2 reveal">Standards</h2>
        <div className="ledger-rows">
          <article className="ledger-row spec reveal">
            <div>
              <p className="row-kicker">{SPEC.body} <span aria-hidden="true">·</span> {SPEC.role}</p>
              <h3 className="spec-title">{SPEC.title}</h3>
            </div>
            <div className="ledger-text">
              <p>I'm one of the editors of this W3C specification, listed with the {SPEC.affiliation} (IMDA).</p>
              <a className="text-link" href={SPEC.url} target="_blank" rel="noopener noreferrer">
                Read the spec on w3.org <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </section>

      {/* ---------- close: type-led, no second character image */}
      <section className="close" aria-labelledby="close-h">
        <div className="wrap close-inner">
          <div className="close-intro">
            <h2 id="close-h" className="close-title reveal">Let's talk</h2>
            <p className="close-lede reveal">Open to conversations about verifiable credentials, digital trade, open-source frameworks and engineering leadership.</p>
          </div>
          <div className="close-actions">
          <p className="close-label reveal">Email is the quickest way to reach me</p>
          <a className="close-email reveal" href={`mailto:${PERSON.email}`} data-magnetic>
            {PERSON.email} <ArrowUpRight size={28} weight="light" aria-hidden="true" className="close-arrow" />
          </a>
          <ul className="close-links reveal" aria-label="Other ways to reach me">
            <li><a href={PERSON.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-line" data-magnetic>LinkedIn <ArrowUpRight size={16} aria-hidden="true" /></a></li>
          </ul>
          </div>
        </div>
      </section>
    </Layout>
  );
}
