import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import "./styles.css";
import meta from "./hero/frames-meta.json";

// --sky = the exact background gradient baked into the hero frames, in frame-height percentages,
// so any panel showing a frame matches the frame's feathered edges.
{
  const st = meta.bgStops as { y: number; rgb: number[] }[], H = meta.frameSize.h;
  const at = (y: number) => { for (let i = 1; i < st.length; i++) if (y <= st[i].y) { const a = st[i - 1], b = st[i], t = (y - a.y) / (b.y - a.y); return a.rgb.map((v, k) => v + (b.rgb[k] - v) * t); } return st[st.length - 1].rgb; };
  const pts = [0, ...st.map((s) => s.y).filter((y) => y > 0 && y < H), H];
  const css = pts.map((y) => `rgb(${at(y).map((v) => v.toFixed(1)).join(",")}) ${((y / H) * 100).toFixed(2)}%`).join(", ");
  document.documentElement.style.setProperty("--sky", `linear-gradient(180deg, ${css})`);
  document.documentElement.style.setProperty("--sky-fill", `rgb(${at(0).map((v) => v.toFixed(1)).join(",")})`);
}
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* v3 routes, now sections of the home page: old links land on the matching section */}
        <Route path="/about" element={<Navigate to="/" replace state={{ section: "about" }} />} />
        <Route path="/work" element={<Navigate to="/" replace state={{ section: "work" }} />} />
        <Route path="/work/*" element={<Navigate to="/" replace state={{ section: "work" }} />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);
