import { useEffect, useRef, useState } from "react";
import { go } from "../router";
import { say, setTrack, stopVoice } from "../audio";
import { BASE, globalUrl, lineUrl, type Pack, type Word } from "../pack";
import { goToSleep, todaysWords, useProgress, wakeUp } from "../progress";
import { Sprout, type Mood } from "../Sprout";
import { Sticker } from "../Sticker";
import { resetPlayToday } from "../settings";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Bedtime: lights down, lullaby on, today's words float up one by one and become stars while the
 * teacher says each softly; then Sprout falls asleep and the app stays asleep until tomorrow.
 * A grown-up can wake it by holding the moon for 3 seconds.
 */
export function Night({ pack, asleep: startAsleep = false }: { pack: Pack; asleep?: boolean }) {
  const { cards } = useProgress();
  const [words] = useState<Word[]>(() => {
    const ids = todaysWords();
    const met = pack.words.filter((w) => cards[w.id]).sort((a, b) => cards[b.id].met - cards[a.id].met);
    return (ids.length ? pack.words.filter((w) => ids.includes(w.id)) : met).slice(0, 6);
  });
  const [at, setAt] = useState(startAsleep ? words.length : -1);
  const [asleep, setAsleep] = useState(startAsleep);
  const [mood, setMood] = useState<Mood>(startAsleep ? "sleepy" : "idle");
  const hushing = useRef(false);
  const hold = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setTrack("lullaby");
    if (!startAsleep) void (async () => {
      await wait(800);
      if (cancelled) return;
      setMood("talk");
      await say([globalUrl(pack.lang, "goodNight")]);
      if (cancelled) return;
      setMood("idle");
      for (let k = 0; k < words.length; k++) {
        setAt(k);
        await wait(500);
        if (cancelled) return;
        await say([lineUrl(pack.lang, words[k].id, "word")]);
        if (cancelled) return;
        await wait(900);
        if (cancelled) return;
      }
      setAt(words.length);
      await wait(600);
      if (cancelled) return;
      setMood("sleepy");
      await say([globalUrl(pack.lang, "sleepTight")]);
      if (cancelled) return;
      goToSleep();
      setAsleep(true);
    })();
    return () => {
      cancelled = true;
      clearTimeout(hold.current);
      stopVoice();
    };
  }, [pack.lang, startAsleep, words]);

  const hush = async () => {
    if (!asleep || hushing.current) return;
    hushing.current = true;
    await say([globalUrl(pack.lang, "shh")]);
    await wait(1500);
    hushing.current = false;
  };

  const pressMoon = (down: boolean) => {
    clearTimeout(hold.current);
    if (down)
      hold.current = window.setTimeout(() => {
        wakeUp();
        resetPlayToday(); // a grown-up's override: otherwise the time limit would send Sprout straight back to bed
        setTrack("bgm");
        go("home", "fade");
      }, 3000);
  };

  return (
    <main className={`screen night ${asleep ? "asleep" : ""} ${pack.decor?.night ? "painted" : ""}`} onPointerDown={hush}>
      {pack.decor?.night && (
        <div className="stage32" style={{ backgroundImage: `url(${BASE}pack/img/night-bg.webp)` }}>
          {/* 芽芽 lies on the leaf bed painted in night-bg.webp (pillow at about 40% / 74%) */}
          <Sprout mood={mood} className="night-sprout on-leaf" />
        </div>
      )}
      <div className="night-stars" aria-hidden inert>
        {Array.from({ length: 28 }, (_, k) => (
          <i key={k} style={{ left: `${(k * 37) % 100}%`, top: `${(k * 53) % 44}%`, animationDelay: `${(k % 7) * 0.4}s` }} />
        ))}
      </div>
      <button
        className="moon"
        aria-label="Grown-ups: hold for 3 seconds to wake Sprout"
        onPointerDown={(e) => {
          e.stopPropagation();
          pressMoon(true);
        }}
        onPointerUp={() => pressMoon(false)}
        onPointerLeave={() => pressMoon(false)}
      />
      <div className="night-words" aria-hidden inert>
        {words.map((w, k) => (
          <div key={w.id} className={`night-word ${k === at ? "now" : k < at ? "up" : "wait"}`} style={{ ["--k" as string]: k }}>
            <Sticker word={w} label={false} />
          </div>
        ))}
      </div>
      {!pack.decor?.night && (
        <div className="night-bed">
          <Sprout mood={mood} className="night-sprout" />
        </div>
      )}
    </main>
  );
}
