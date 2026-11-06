import { useRef, useState } from "react";
import { cue } from "./audio";
import { Icon } from "./Icon";
import { go } from "./router";

const HOLD_MS = 2000;
const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);

function question() {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 3 + Math.floor(Math.random() * 7);
  const answer = a * b;
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const d = answer + (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.5 ? 1 : a);
    if (d > 0 && d !== answer) wrong.add(d);
  }
  return { a, b, answer, options: shuffle([answer, ...wrong]) };
}

/**
 * The way into the grown-ups' area: hold the little lock for 2 seconds, then pick the answer to a
 * multiplication a toddler can't read. Keeps small fingers out of settings (规划.md §4.2).
 */
export function ParentLock() {
  const [holding, setHolding] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(question);
  const [shake, setShake] = useState(false);
  const timer = useRef(0);

  const down = () => {
    setHolding(true);
    timer.current = window.setTimeout(() => {
      setHolding(false);
      setQ(question());
      setOpen(true);
    }, HOLD_MS);
  };
  const up = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };

  const pickAnswer = (n: number) => {
    if (n === q.answer) {
      void cue("tap");
      setOpen(false);
      go("parent", "fade");
    } else {
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setQ(question());
      }, 450);
    }
  };

  return (
    <>
      <button
        className={`parent-lock ${holding ? "holding" : ""}`}
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="家长入口：长按 2 秒"
      >
        <svg viewBox="0 0 48 48" className="hold-ring" aria-hidden>
          <circle cx="24" cy="24" r="21" />
        </svg>
        <Icon name="lock" />
      </button>
      {open && (
        <div className="gate" onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className={`gate-card ${shake ? "shake" : ""}`} role="dialog" aria-label="家长确认">
            <button className="gate-close" onClick={() => setOpen(false)} aria-label="关闭">
              ×
            </button>
            <p className="gate-hint">家长确认</p>
            <h2>
              请点出 {q.a} × {q.b} 的答案
            </h2>
            <div className="gate-options">
              {q.options.map((n) => (
                <button key={n} onClick={() => pickAnswer(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
