import { useEffect, useRef, useState } from "react";
import { go } from "../router";
import { cue, preload, say, unlock } from "../audio";
import { globalUrl, lineUrl, type Pack } from "../pack";
import { Sprout, type Mood } from "../Sprout";
import { Icon } from "../Icon";

const SEED_COLORS = ["#F0606A", "#FFD93B", "#8CCB4E", "#56C3F9", "#F7A1B0", "#FF9F43"];
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/**
 * Splash ritual (after Word Atlas's stardust logo): colourful seeds pop out of the soil and fly up
 * to spell "Sprout", then 芽芽 grows out of the ground. It plays silently (no audio before a gesture);
 * the child's tap — allowed at any moment — plays the chime and "Hello!" and pushes into the island.
 */
export function Start({ pack }: { pack: Pack }) {
  const [mood, setMood] = useState<Mood>("idle");
  const [phase, setPhase] = useState<"intro" | "ready" | "hello">("intro");
  const canvas = useRef<HTMLCanvasElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const soil = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let alive = true;
    const t = setTimeout(() => alive && setPhase((p) => (p === "intro" ? "ready" : p)), 2600);
    document.fonts.load("700 100px Fredoka").finally(() => {
      if (alive) raf = seeds(canvas.current!, title.current!, soil.current!);
    });
    return () => {
      alive = false;
      clearTimeout(t);
      cancelAnimationFrame(raf);
    };
  }, []);

  const begin = async () => {
    if (phase === "hello") return;
    setPhase("hello");
    unlock();
    preload(pack.words.flatMap((w) => [lineUrl(pack.lang, w.id, "intro"), lineUrl(pack.lang, w.id, "say")]));
    void cue("hello");
    setMood("happy");
    await new Promise((r) => setTimeout(r, 450));
    setMood("talk");
    await say([globalUrl(pack.lang, "hello")]);
    setMood("happy");
    void cue("whoosh");
    setTimeout(() => go("home", "in"), 250);
  };

  return (
    <main className={`screen start phase-${phase}`} onPointerDown={begin}>
      <canvas ref={canvas} className="seed-canvas" aria-hidden />
      <h1 ref={title} className="start-title">
        Sprout
        <small>芽芽英语</small>
      </h1>
      <div className="start-stage">
        <div className="start-hero">
          <Sprout mood={mood} className={mood === "happy" ? "jump" : "bob"} />
        </div>
        <div ref={soil} className="soil" />
      </div>
      <div className="start-ground" />
      <Icon name="tap" className="tap-hint" />
      {import.meta.env.DEV && <a className="corner-link" href="#/review" onPointerDown={(e) => e.stopPropagation()}>
        样片验收
      </a>}
    </main>
  );
}

/** Sample the title's letters as targets and fly seeds from the soil to them. Returns the rAF id. */
function seeds(cv: HTMLCanvasElement, titleEl: HTMLElement, soilEl: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    titleEl.classList.add("settled");
    return 0;
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = innerWidth * dpr;
  cv.height = innerHeight * dpr;
  const g = cv.getContext("2d")!;
  g.scale(dpr, dpr);

  // draw the word offscreen exactly where the (still invisible) title sits
  const box = titleEl.getBoundingClientRect();
  const size = parseFloat(getComputedStyle(titleEl).fontSize);
  const off = document.createElement("canvas");
  off.width = Math.ceil(box.width);
  off.height = Math.ceil(size * 1.2);
  const o = off.getContext("2d")!;
  o.font = `700 ${size}px Fredoka`;
  o.textAlign = "center";
  o.textBaseline = "top";
  o.fillText("Sprout", off.width / 2, size * 0.05);
  const data = o.getImageData(0, 0, off.width, off.height).data;
  const step = Math.max(5, Math.round(size / 13));
  const targets: { x: number; y: number }[] = [];
  for (let y = 0; y < off.height; y += step)
    for (let x = 0; x < off.width; x += step) if (data[(y * off.width + x) * 4 + 3] > 140) targets.push({ x: box.left + x, y: box.top + y });

  const s = soilEl.getBoundingClientRect();
  const origin = { x: s.left + s.width / 2, y: s.top + s.height * 0.3 };
  const ps = targets.map((t, i) => ({
    t,
    c: SEED_COLORS[i % SEED_COLORS.length],
    r: step * (0.42 + Math.random() * 0.12),
    delay: Math.random() * 0.5,
    // control point: up and out of the soil like a fountain
    cx: origin.x + (Math.random() - 0.5) * innerWidth * 0.5,
    cy: origin.y - innerHeight * (0.35 + Math.random() * 0.35),
  }));
  const start = performance.now() + 250;
  const FLY = 1.1;
  let raf = 0;
  const frame = (now: number) => {
    const el = (now - start) / 1000;
    g.clearRect(0, 0, innerWidth, innerHeight);
    let settled = true;
    for (const p of ps) {
      const k = ease((el - p.delay) / FLY);
      if (k < 1) settled = false;
      if (el < p.delay) continue;
      const x = (1 - k) ** 2 * origin.x + 2 * (1 - k) * k * p.cx + k * k * p.t.x;
      const y = (1 - k) ** 2 * origin.y + 2 * (1 - k) * k * p.cy + k * k * p.t.y;
      g.beginPath();
      g.arc(x, y, p.r * (0.6 + 0.4 * k), 0, Math.PI * 2);
      g.fillStyle = p.c;
      g.fill();
    }
    if (settled) {
      titleEl.classList.add("settled"); // the real text fades in over the seeds, the canvas fades out
      cv.classList.add("done");
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return raf;
}
