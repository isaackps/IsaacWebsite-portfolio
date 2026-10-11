import { useEffect } from "react";
import { frameUrl } from "../hero/engine";

const cache = new Map<string, HTMLImageElement>();
export function poseSrc(slot: number | "center" | "calm") {
  return slot === "center" ? "frames/center.webp" : slot === "calm" ? "frames/center-calm.webp" : frameUrl(slot);
}
export function preload(slots: (number | "center" | "calm")[]) {
  slots.forEach((s) => { const src = poseSrc(s); if (!cache.has(src)) { const im = new Image(); im.src = src; cache.set(src, im); } });
}

/** One frame of the character on its own sky panel. Swapping `slot` swaps the whole image (never a cross-fade). */
export default function Pose({ slot, alt, className = "" }: { slot: number | "center" | "calm"; alt: string; className?: string }) {
  useEffect(() => preload([slot]), [slot]);
  return (
    <div className={`pose ${className}`}>
      <img src={poseSrc(slot)} alt={alt} width={888} height={816} decoding="async" />
    </div>
  );
}
