/**
 * Celebration effects: a confetti burst (adapted from Word Atlas src/lib/burst.ts, with toddler
 * colours and shapes) and a star that flies from where the child tapped into a target.
 * Everything respects prefers-reduced-motion.
 */
import { STAR_SVG } from "./Icon";

const COLORS = ["#F0606A", "#FFD93B", "#8CCB4E", "#56C3F9", "#F7A1B0", "#FF9F43"];
const LINE = "#3A2E2A";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

type Shape = "dot" | "star" | "pill";
interface Part {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  c: string;
  life: number;
  decay: number;
  rot: number;
  vr: number;
  shape: Shape;
}

let canvas: HTMLCanvasElement | null = null;
let parts: Part[] = [];
let raf = 0;

function ensure() {
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "fx-layer";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== innerWidth * dpr || canvas.height !== innerHeight * dpr) {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
  }
  return canvas;
}

function starPath(g: CanvasRenderingContext2D, r: number) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.48 : r;
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  g.closePath();
}

function draw(g: CanvasRenderingContext2D, p: Part) {
  g.save();
  g.translate(p.x, p.y);
  g.rotate(p.rot);
  g.globalAlpha = Math.min(1, p.life * 1.6);
  g.fillStyle = p.c;
  g.strokeStyle = LINE;
  g.lineWidth = 1.6;
  if (p.shape === "star") starPath(g, p.r * 1.5);
  else if (p.shape === "pill") {
    g.beginPath();
    g.roundRect(-p.r * 1.3, -p.r * 0.55, p.r * 2.6, p.r * 1.1, p.r * 0.55);
  } else {
    g.beginPath();
    g.arc(0, 0, p.r, 0, Math.PI * 2);
  }
  g.fill();
  g.stroke();
  g.restore();
}

function tick() {
  const cv = canvas!;
  const g = cv.getContext("2d")!;
  const dpr = cv.width / innerWidth;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.life > 0);
  for (const p of parts) {
    p.vy += 0.22;
    p.vx *= 0.985;
    p.vy *= 0.985;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= p.decay;
    draw(g, p);
  }
  raf = parts.length ? requestAnimationFrame(tick) : 0;
}

function spawn(p: Omit<Part, "life" | "rot" | "vr" | "c" | "shape"> & Partial<Part>, i: number) {
  parts.push({
    life: 1,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: COLORS[i % COLORS.length],
    shape: (["dot", "star", "pill"] as Shape[])[i % 3],
    ...p,
  });
}

/** Confetti bursting out of a point (a found sticker). */
export function burst(x: number, y: number, count = 28, power = 1) {
  if (reduced()) return;
  ensure();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (3 + Math.random() * 6) * power;
    spawn({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3 * power, r: 4 + Math.random() * 4, decay: 0.012 + Math.random() * 0.01 }, i);
  }
  if (!raf) raf = requestAnimationFrame(tick);
}

/** Confetti falling from the top of the screen (finish screen). */
export function rain(count = 70) {
  if (reduced()) return;
  ensure();
  for (let i = 0; i < count; i++) {
    spawn(
      {
        x: Math.random() * innerWidth,
        y: -20 - Math.random() * innerHeight * 0.5,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 3,
        r: 5 + Math.random() * 5,
        decay: 0.005 + Math.random() * 0.004,
      },
      i,
    );
  }
  if (!raf) raf = requestAnimationFrame(tick);
}

export const centerOf = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** A big star flies on an arc from one element into another; resolves when it lands. */
export function flyStar(from: Element, to: Element): Promise<void> {
  const a = centerOf(from);
  const b = centerOf(to);
  if (reduced()) return Promise.resolve();
  const star = document.createElement("div");
  star.className = "fly-star";
  star.innerHTML = STAR_SVG;
  document.body.appendChild(star);
  const lift = Math.min(220, Math.abs(a.y - b.y) * 0.6 + 80);
  const mid = { x: (a.x + b.x) / 2 + (a.x < b.x ? -40 : 40), y: Math.min(a.y, b.y) - lift };
  const steps = 12;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * mid.x + t * t * b.x;
    const y = (1 - t) ** 2 * a.y + 2 * (1 - t) * t * mid.y + t * t * b.y;
    const s = t < 0.2 ? 0.6 + t * 4 : 1.4 - t * 0.9;
    frames.push({ transform: `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s}) rotate(${t * 360}deg)` });
  }
  const anim = star.animate(frames, { duration: 750, easing: "cubic-bezier(.45,.05,.4,1)", fill: "forwards" });
  return anim.finished.then(() => {
    star.remove();
    burst(b.x, b.y, 10, 0.5);
  });
}
