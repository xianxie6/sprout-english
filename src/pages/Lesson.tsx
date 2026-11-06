import { useRef, useState } from "react";
import { go } from "../router";
import { cue } from "../audio";
import { burst, centerOf } from "../fx";
import { FindRound, distractors, shuffle } from "../FindRound";
import { globalUrl, lineUrl, type Pack, type Word } from "../pack";
import { finishLesson, meet, planLesson, useProgress } from "../progress";
import { Sprout, type Mood } from "../Sprout";
import { Sticker } from "../Sticker";
import { useSequence } from "../useSequence";
import { MoveActivity } from "../MoveActivity";
import { MOVEMENTS, type Movement } from "../movement";
import { TopBar } from "./Explore";
import { Icon } from "../Icon";

type Step =
  | { kind: "hi" }
  | { kind: "meet"; w: Word; lead?: string }
  | { kind: "find"; w: Word; options: Word[]; lead?: string }
  | { kind: "move"; action: Movement }
  | { kind: "parade"; words: Word[] };

export const JUST_GREW = "sprout:justGrew";

/**
 * Today's lesson, the ~8-minute rhythm from 规划.md §2.3:
 * hello → review what's due → 3 new words (see · hear · say it · find it) → body break → mixed game → recap → garden.
 */
export function Lesson({ pack }: { pack: Pack }) {
  const progress = useProgress();
  const [steps] = useState(() => build(pack, progress.cards));
  const [i, setI] = useState(0);
  const [lit, setLit] = useState(0);
  const dots = useRef<HTMLDivElement>(null);
  const advanced = useRef(-1);
  const step = steps[i];
  const counted: Step[] = steps.filter((s) => s.kind !== "hi");
  const dotIndex = counted.indexOf(step);

  const next = () => {
    if (advanced.current === i) return;
    advanced.current = i;
    if (step.kind !== "hi") setLit((n) => n + 1);
    if (i + 1 < steps.length) setI(i + 1);
    else {
      finishLesson();
      const words = (steps.find((s) => s.kind === "parade") as Extract<Step, { kind: "parade" }>).words;
      try {
        sessionStorage.setItem(JUST_GREW, JSON.stringify(words.map((w) => w.id)));
      } catch {
        /* garden just won't highlight */
      }
      void cue("whoosh");
      go("garden", "in");
    }
  };

  return (
    <main className="screen find lesson">
      <TopBar />
      <div className="progress lesson-progress" ref={dots}>
        {counted.map((s, k) => (
          <i key={k} className={`${k < lit ? "on" : k === dotIndex ? "now" : ""} dot-${s.kind}`} />
        ))}
      </div>
      {step.kind === "hi" && <Hi key={i} pack={pack} onDone={next} />}
      {step.kind === "meet" && <Meet key={i} pack={pack} w={step.w} lead={step.lead} onDone={next} />}
      {step.kind === "move" && <MoveActivity key={i} pack={pack} action={step.action} onDone={next} />}
      {step.kind === "find" && (
        <Lead key={i} pack={pack} lead={step.lead}>
          <FindRound pack={pack} target={step.w} options={step.options} starTarget={() => dots.current?.children[dotIndex]} onDone={next} />
        </Lead>
      )}
      {step.kind === "parade" && <Parade key={i} pack={pack} words={step.words} onDone={next} />}
    </main>
  );
}

function build(pack: Pack, cards: Record<string, unknown>): Step[] {
  const { review, fresh } = planLesson(pack);
  const metPool = pack.words.filter((w) => cards[w.id]);
  const lessonWords = [...review, ...fresh];
  const pool = (w: Word) => {
    const known = [...metPool, ...lessonWords].filter((x, k, a) => a.indexOf(x) === k);
    return known.length > 1 ? known : pack.words.filter((x) => x.theme === w.theme);
  };
  const steps: Step[] = [{ kind: "hi" }];
  review.forEach((w, k) => steps.push({ kind: "find", w, options: shuffle([w, ...distractors(w, pool(w), 2)]), lead: k === 0 ? "remember" : undefined }));
  fresh.forEach((w, k) => {
    steps.push({ kind: "meet", w, lead: k === 0 ? "newFriend" : undefined });
    const others = fresh.slice(0, k).concat(metPool).filter((x) => x.id !== w.id);
    const pair = others.length ? [w, others[Math.floor(Math.random() * others.length)]] : [w, ...distractors(w, pool(w), 2)];
    steps.push({ kind: "find", w, options: shuffle(pair) });
  });
  // A short body break uses an animal from this lesson whenever possible.
  const animal = MOVEMENTS.find((a) => lessonWords.some((w) => w.id === a.wordId))
    ?? MOVEMENTS.find((a) => metPool.some((w) => w.id === a.wordId))
    ?? MOVEMENTS[0];
  steps.push({ kind: "move", action: animal });
  // mixed game: 4 rounds, 3 choices, targets from today's words
  const targets = shuffle(lessonWords.length ? lessonWords : metPool);
  for (let k = 0; k < 4 && targets.length; k++) {
    const w = targets[k % targets.length];
    steps.push({ kind: "find", w, options: shuffle([w, ...distractors(w, pool(w), 3)]), lead: k === 0 ? "letsPlay" : undefined });
  }
  steps.push({ kind: "parade", words: lessonWords.length ? lessonWords : metPool.slice(0, 5) });
  return steps;
}

/** Says a short lead-in line ("Do you remember?") before showing its children. */
function Lead({ pack, lead, children }: { pack: Pack; lead?: string; children: React.ReactNode }) {
  const [ready, setReady] = useState(!lead);
  useSequence(async (scope) => {
    if (lead && await scope.say([globalUrl(pack.lang, lead)])) setReady(true);
  });
  if (ready) return <>{children}</>;
  return (
    <div className="lesson-center">
      <Sprout mood="talk" className="lesson-sprout bob" />
    </div>
  );
}

function Hi({ pack, onDone }: { pack: Pack; onDone: () => void }) {
  const [mood, setMood] = useState<Mood>("happy");
  useSequence(async (scope) => {
    void cue("hello");
    if (!await scope.wait(400)) return;
    setMood("talk");
    if (!await scope.say([globalUrl(pack.lang, "lessonHi")])) return;
    setMood("happy");
    if (!await scope.wait(500)) return;
    onDone();
  });
  return (
    <div className="lesson-center">
      <Sprout mood={mood} className="lesson-sprout big jump-loop" />
    </div>
  );
}

/** How long the child's turn to say a new word waits for a tap before moving on by itself. */
const TURN_TIMEOUT = 10000;

/** Meet a new word: it pops in big, teacher names it, Sprout plays with it, then "Your turn!". */
function Meet({ pack, w, lead, onDone }: { pack: Pack; w: Word; lead?: string; onDone: () => void }) {
  const [shown, setShown] = useState(!lead);
  const [mood, setMood] = useState<Mood>("idle");
  const [pulse, setPulse] = useState<"" | "bounce">("");
  const [listen, setListen] = useState(false);
  const [replay, setReplay] = useState(0);
  const art = useRef<HTMLDivElement>(null);
  const saidIt = useRef<(() => void) | null>(null);
  const L = (line: Parameters<typeof lineUrl>[2]) => lineUrl(pack.lang, w.id, line);

  useSequence(async (scope) => {
    meet(w.id);
    setShown(!lead);
    setListen(false);
    setPulse("");
    if (lead) {
      setMood("talk");
      if (!await scope.say([globalUrl(pack.lang, lead)])) return;
    }
    setShown(true);
    void cue("pop");
    if (!await scope.wait(350)) return;
    if (art.current) {
      const c = centerOf(art.current);
      burst(c.x, c.y, 14, 0.6);
    }
    setMood("idle");
    if (!await scope.say([L("intro")])) return;
    setMood("talk");
    setPulse("bounce");
    if (!await scope.say([L("say")])) return;
    setPulse("");
    setMood("think");
    if (!await scope.say([globalUrl(pack.lang, "yourTurn"), L("word")])) return;
    // The child's turn to say it. We don't record or score speech, so we can't hear whether they
    // spoke: wait until they (or the parent) tap the arrow, and only move on alone after a long pause.
    setListen(true);
    const tapped = new Promise<boolean>((resolve) => {
      saidIt.current = () => resolve(true);
    });
    const ready = await Promise.race([scope.wait(TURN_TIMEOUT), tapped]);
    saidIt.current = null;
    if (!ready) return;
    setListen(false);
    setMood("happy");
    void cue("ding");
    if (!await scope.wait(500)) return;
    onDone();
  }, [replay]);

  return (
    <div className="meet">
      <Sprout mood={mood} className={`meet-sprout ${mood === "happy" ? "jump" : "bob"}`} />
      <div className="meet-card" ref={art}>
        {shown && <Sticker word={w} state={pulse} onTap={() => setReplay((n) => n + 1)} />}
        {listen && <Icon name="ear" className="listen" />}
      </div>
      {listen && (
        <button className="turn-next" onClick={() => saidIt.current?.()} aria-label="I said it, continue">
          <svg viewBox="0 0 48 48" aria-hidden>
            <path d="M10 24h27M25 11l13 13-13 13" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Recap: today's words line up and each says its name once more. */
function Parade({ pack, words, onDone }: { pack: Pack; words: Word[]; onDone: () => void }) {
  const [at, setAt] = useState(-1);
  useSequence(async (scope) => {
    if (!await scope.say([globalUrl(pack.lang, "parade")])) return;
    for (let k = 0; k < words.length; k++) {
      setAt(k);
      void cue("pop");
      if (!await scope.say([lineUrl(pack.lang, words[k].id, "word")])) return;
      if (!await scope.wait(250)) return;
    }
    setAt(words.length);
    void cue("tada");
    if (!await scope.wait(1200)) return;
    onDone();
  });
  return (
    <div className="parade">
      {words.map((w, k) => (
        <Sticker key={w.id} word={w} index={k} state={k === at ? "bounce" : k < at || at >= words.length ? "" : "dim"} />
      ))}
    </div>
  );
}
