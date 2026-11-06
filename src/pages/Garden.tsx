import { useState } from "react";
import { go } from "../router";
import { cue, say } from "../audio";
import { burst, centerOf, rain } from "../fx";
import { BASE, globalUrl, hasImg, imgUrl, lineUrl, type Pack, type Word } from "../pack";
import { bloomed, useProgress } from "../progress";
import { Sprout, type Mood } from "../Sprout";
import { TopBar } from "./Explore";
import { JUST_GREW } from "./Lesson";
import { useOnce } from "../useOnce";
import { Icon } from "../Icon";
import { timeUp } from "../settings";

const PETALS = ["#F7A1B0", "#FFD93B", "#56C3F9", "#F0606A", "#C9A0F0", "#FF9F43"];
const LINE = "#3A2E2A";

/**
 * The sticker garden (replaces Word Atlas's star map): every word met is a bud, every word
 * known (found first-try on two days) is a flower with its sticker in the middle. Tapping a
 * plant says the word, so the garden doubles as review.
 */
export function Garden({ pack }: { pack: Pack }) {
  const { cards } = useProgress();
  const [fresh] = useState<string[]>(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem(JUST_GREW) || "[]");
      sessionStorage.removeItem(JUST_GREW);
      return v;
    } catch {
      return [];
    }
  });
  const [mood, setMood] = useState<Mood>("happy");
  const [active, setActive] = useState("");
  const plants = pack.words.filter((w) => cards[w.id]).sort((a, b) => cards[a.id].met - cards[b.id].met);
  const flowers = plants.filter((w) => bloomed(cards[w.id])).length;

  useOnce(() => {
    void (async () => {
      if (fresh.length) {
        void cue("tada");
        setTimeout(() => rain(40), 600);
        setMood("talk");
        await say([globalUrl(pack.lang, "garden")]);
        setMood("happy");
      } else if (!plants.length) {
        setMood("talk");
        await say([globalUrl(pack.lang, "lessonHi")]);
        setMood("idle");
      }
    })();
  });

  const tap = async (w: Word, el: HTMLElement) => {
    setActive("");
    requestAnimationFrame(() => setActive(w.id));
    void cue("pop");
    const c = centerOf(el.querySelector(".plant-head") ?? el);
    burst(c.x, c.y, 10, 0.5);
    setMood("talk");
    await say([lineUrl(pack.lang, w.id, "intro")]);
    setMood("happy");
  };

  return (
    <main
      className={`screen garden ${pack.decor?.garden ? "painted" : ""}`}
      style={pack.decor?.garden ? { backgroundImage: `url(${BASE}pack/img/garden-bg.webp)` } : undefined}
    >
      <TopBar />
      <div className="garden-count" aria-label={`${flowers} flowers`}>
        <Icon name="flower" /> {flowers} <span>· <Icon name="bud" /> {plants.length - flowers}</span>
      </div>
      {!pack.decor?.garden && <div className="garden-ground" />}
      {plants.length ? (
        <div className="garden-bed">
          {plants.map((w, k) => (
            <button
              key={w.id}
              className={`plant ${fresh.includes(w.id) ? "grow" : ""} ${active === w.id ? "bounce" : ""}`}
              style={{ ["--i" as string]: fresh.includes(w.id) ? fresh.indexOf(w.id) : 0 }}
              onPointerDown={(e) => tap(w, e.currentTarget)}
              aria-label={w.en.word}
            >
              <Plant word={w} bloom={bloomed(cards[w.id])} color={PETALS[k % PETALS.length]} />
              <span className="plant-word">{w.en.word}</span>
            </button>
          ))}
        </div>
      ) : (
        <button className="garden-empty" onPointerDown={() => go(timeUp() ? "night" : "lesson", "in")} aria-label="Start lesson">
          <Icon name="bud" className="seed-bag" />
          <span className="play-tri">
            <Icon name="play" />
          </span>
        </button>
      )}
      <Sprout mood={mood} className="garden-sprout bob" />
    </main>
  );
}

function Plant({ word, bloom, color }: { word: Word; bloom: boolean; color: string }) {
  const id = `clip-${word.id}`;
  return (
    <svg viewBox="0 0 120 170" className="plant-svg" aria-hidden>
      <g stroke={LINE} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <path d="M60 168 C60 140 58 118 60 92" fill="none" stroke="#5DB04A" strokeWidth={7} />
        <path d="M60 140 C44 126 30 128 24 134 C34 146 50 148 60 140Z" fill="#7CC452" />
        <path d="M60 124 C76 110 90 112 96 118 C86 130 70 132 60 124Z" fill="#5DB04A" />
        <g className="plant-head">
          {bloom ? (
            <>
              {Array.from({ length: 8 }, (_, k) => {
                const a = (k * Math.PI) / 4;
                return <circle key={k} cx={60 + Math.cos(a) * 30} cy={56 + Math.sin(a) * 30} r={17} fill={color} />;
              })}
              <circle cx={60} cy={56} r={27} fill="#FFF6DA" />
              <clipPath id={id}>
                <circle cx={60} cy={56} r={24} />
              </clipPath>
              {hasImg(word) ? (
                <image href={imgUrl(word.id)} x={34} y={30} width={52} height={52} clipPath={`url(#${id})`} />
              ) : (
                <text x={60} y={68} fontSize={30} textAnchor="middle" stroke="none">
                  {word.emoji}
                </text>
              )}
            </>
          ) : (
            <>
              <path d="M60 94 C40 86 40 52 60 34 C80 52 80 86 60 94Z" fill="#9CD86A" />
              <path d="M60 94 C50 80 52 58 60 44" fill="none" />
              <circle cx={60} cy={30} r={7} fill={color} />
            </>
          )}
        </g>
      </g>
    </svg>
  );
}
