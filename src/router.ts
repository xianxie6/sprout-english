/**
 * Hash router whose page changes run inside a View Transition (Word Atlas src/lib/motion.ts idea):
 * "in" pushes the camera forward into a place, "out" pulls back, "fade" just crossfades.
 * Browsers without View Transitions, and reduced-motion users, get an instant switch.
 */
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

export type Direction = "in" | "out" | "fade";
type VTDocument = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } };

const read = () => location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
const listeners = new Set<(p: string[]) => void>();
const emit = () => listeners.forEach((l) => l(read()));
window.addEventListener("hashchange", emit);

export function useRoute() {
  const [parts, setParts] = useState(read);
  useEffect(() => {
    listeners.add(setParts);
    return () => void listeners.delete(setParts);
  }, []);
  return parts;
}

export function go(path: string, dir: Direction = "fade") {
  const apply = () => {
    history.pushState(null, "", `#/${path}`);
    flushSync(emit);
    window.scrollTo(0, 0); // the grown-up pages scroll; a new page starts at the top
  };
  const d = document as VTDocument;
  if (!d.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply();
  document.documentElement.dataset.nav = dir;
  const t = d.startViewTransition(apply);
  // the browser may skip the animation (tab hidden, another transition); the page still changes
  t.ready.catch(() => undefined);
  t.finished.catch(() => undefined).finally(() => delete document.documentElement.dataset.nav);
}
