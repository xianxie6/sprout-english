import { useRef, useState } from "react";
import { cue } from "./audio";
import { burst, centerOf, flyStar } from "./fx";
import { globalUrl, lineUrl, type Pack, type Word } from "./pack";
import { record } from "./progress";
import { Sprout, type Mood } from "./Sprout";
import { Sticker } from "./Sticker";
import { useSequence } from "./useSequence";
import { Icon } from "./Icon";

const PRAISE = ["great", "yay", "super"];
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
export const shuffle = <T,>(xs: T[]) => [...xs].sort(() => Math.random() - 0.5);

/** Pick n-1 distractors for a target, preferring words the child has already met. */
export function distractors(target: Word, pool: Word[], n: number) {
  return shuffle(pool.filter((w) => w.id !== target.id)).slice(0, n - 1);
}

/**
 * One "Where is the cat?" round. A wrong tap is never an error: the tapped sticker says its
 * own name, then the right one wiggles as a hint. On the right answer, confetti bursts and a star
 * flies into `starTarget` (a progress dot). The result is graded implicitly via progress.record.
 * Remount (change `key`) for each round.
 */
export function FindRound({
  pack,
  target,
  options,
  starTarget,
  onDone,
}: {
  pack: Pack;
  target: Word;
  options: Word[];
  starTarget?: () => Element | null | undefined;
  onDone: (firstTry: boolean) => void;
}) {
  const [fx, setFx] = useState<Record<string, "" | "bounce" | "wiggle" | "glow" | "dim">>({});
  const [mood, setMood] = useState<Mood>("think");
  const busy = useRef(false);
  const missed = useRef(false);
  const L = (w: Word, line: Parameters<typeof lineUrl>[2]) => lineUrl(pack.lang, w.id, line);

  const sequence = useSequence(async (scope) => {
    await scope.say([L(target, "find")]);
  });

  const ask = async () => {
    if (!sequence.active()) return;
    setMood("think");
    await sequence.say([L(target, "find")]);
  };

  const tap = async (w: Word, el: HTMLElement) => {
    if (busy.current || !sequence.active()) return;
    busy.current = true;
    if (w.id === target.id) {
      const art = el.querySelector(".sticker-art") ?? el;
      const c = centerOf(art);
      burst(c.x, c.y, 32);
      void cue("star");
      setFx({ [w.id]: "glow", ...Object.fromEntries(options.filter((o) => o.id !== w.id).map((o) => [o.id, "dim"])) });
      setMood("happy");
      const firstTry = !missed.current;
      record(target.id, firstTry);
      const dot = starTarget?.();
      const landed = firstTry && dot ? flyStar(art, dot).then(() => {
        if (sequence.active()) void cue("ding");
      }) : Promise.resolve();
      const [said] = await Promise.all([sequence.say([L(w, "found"), globalUrl(pack.lang, pick(PRAISE))]), landed]);
      if (!said || !sequence.active()) return;
      onDone(firstTry);
    } else {
      missed.current = true;
      void cue("uhoh");
      setFx({ [w.id]: "wiggle" });
      setMood("talk");
      if (!await sequence.say([L(w, "that")])) return;
      if (!sequence.active()) return;
      setFx({ [target.id]: "wiggle" });
      busy.current = false;
      await ask();
    }
  };

  return (
    <>
      <div className="find-ask" onPointerDown={() => !busy.current && ask()}>
        <Sprout mood={mood} className={mood === "happy" ? "jump" : ""} />
        <div className="bubble">
          <Icon name="speaker" className="spk" />
          {target.en.find}
        </div>
      </div>
      <div className={`find-options n${options.length}`}>
        {options.map((w, i) => (
          <Sticker key={w.id} word={w} index={i} label={false} state={fx[w.id] ?? ""} onTap={(el) => tap(w, el)} />
        ))}
      </div>
    </>
  );
}
