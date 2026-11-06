import { useRef, useState } from "react";
import { go } from "../router";
import { cue, say } from "../audio";
import { rain } from "../fx";
import { FindRound, distractors, shuffle } from "../FindRound";
import { globalUrl, imgUrl, type Pack, type Theme, type Word } from "../pack";
import { Sprout, type Mood } from "../Sprout";
import { useOnce } from "../useOnce";
import { TopBar } from "./Explore";
import { Icon } from "../Icon";

const ROUNDS = 5;
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** Free game from a theme: 5 rounds of "Where is the …?" with 2 choices (stage 1). */
export function Find({ pack, theme }: { pack: Pack; theme: Theme }) {
  const pool = pack.words.filter((w) => w.theme === theme.id);
  const roundFor = (t: Word) => ({ target: t, options: shuffle([t, ...distractors(t, pool, 2)]) });
  const [round, setRound] = useState(0);
  const [lit, setLit] = useState(0); // progress dots filled so far
  const [stars, setStars] = useState(0);
  const [q, setQ] = useState(() => roundFor(pick(pool)));
  const used = useRef<string[]>([q.target.id]);
  const dots = useRef<HTMLDivElement>(null);

  const next = () => {
    const fresh = pool.filter((w) => !used.current.includes(w.id));
    const t = pick(fresh.length ? fresh : pool);
    used.current.push(t.id);
    setQ(roundFor(t));
  };

  const done = (firstTry: boolean) => {
    if (firstTry) setStars((s) => s + 1);
    setLit(round + 1);
    setRound(round + 1);
    if (round + 1 < ROUNDS) next();
  };

  const again = () => {
    used.current = [];
    setStars(0);
    setLit(0);
    setRound(0);
    next();
  };

  if (round >= ROUNDS) return <Finish pack={pack} theme={theme} stars={stars} onAgain={again} />;

  return (
    <main className="screen find">
      <TopBar />
      <div className="progress" ref={dots} aria-label={`${round + 1} / ${ROUNDS}`}>
        {Array.from({ length: ROUNDS }, (_, i) => (
          <i key={i} className={i < lit ? "on" : i === round ? "now" : ""} />
        ))}
      </div>
      <FindRound key={round} pack={pack} target={q.target} options={q.options} starTarget={() => dots.current?.children[round]} onDone={done} />
    </main>
  );
}

function Finish({ pack, theme, stars, onAgain }: { pack: Pack; theme: Theme; stars: number; onAgain: () => void }) {
  const [mood, setMood] = useState<Mood>("happy");
  useOnce(() => {
    void cue("tada");
    rain();
    for (let i = 0; i < stars; i++) void cue("ding", 0.5 + i * 0.15);
    void say([globalUrl(pack.lang, "yay")]).then(() => setMood("idle"));
  });
  return (
    <main className="screen finish">
      <Sprout mood={mood} className="jump-loop" />
      <div className="finish-stars">
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} className={i < stars ? "on" : ""} style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
            <Icon name="star" />
          </span>
        ))}
      </div>
      <div className="finish-actions">
        <button className="round-btn big" onPointerDown={() => go("home", "out")} aria-label="Home">
          <Icon name="home" />
        </button>
        <button className="round-btn big star-btn" onPointerDown={onAgain} aria-label="Again">
          <Icon name="again" />
        </button>
        <button className="round-btn big" onPointerDown={() => go(`explore/${theme.id}`, "out")} aria-label="Explore">
          {theme.house ? <img src={imgUrl(`house-${theme.id}`)} alt="" className="btn-img" /> : theme.emoji}
        </button>
      </div>
    </main>
  );
}
