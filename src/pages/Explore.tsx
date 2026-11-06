import { useState } from "react";
import { go } from "../router";
import { cue, say } from "../audio";
import { burst, centerOf } from "../fx";
import { BASE, lineUrl, type Pack, type Theme } from "../pack";
import { Sprout, type Mood } from "../Sprout";
import { Sticker } from "../Sticker";
import { Icon } from "../Icon";

/** Free play: tap anything, it bounces, sprinkles a little confetti and says its name. No right or wrong. */
export function Explore({ pack, theme }: { pack: Pack; theme: Theme }) {
  const words = pack.words.filter((w) => w.theme === theme.id);
  const [active, setActive] = useState("");
  const [mood, setMood] = useState<Mood>("idle");

  const tap = async (id: string, el: HTMLElement) => {
    setActive("");
    requestAnimationFrame(() => setActive(id));
    void cue("pop");
    const c = centerOf(el.querySelector(".sticker-art") ?? el);
    burst(c.x, c.y, 10, 0.55);
    setMood("talk");
    const done = await say([lineUrl(pack.lang, id, "intro"), lineUrl(pack.lang, id, "say")]);
    if (done) {
      setMood("happy");
      setTimeout(() => setMood((m) => (m === "happy" ? "idle" : m)), 900);
    }
  };

  const bg = theme.scene ? { backgroundImage: `url(${BASE}pack/img/scene-${theme.id}.webp)` } : undefined;
  return (
    <main className={`screen explore scene-${theme.id} ${theme.scene ? "has-scene" : ""}`} style={bg}>
      <TopBar
        onFind={() => {
          void cue("whoosh");
          go(`find/${theme.id}`, "in");
        }}
      />
      <div className="sticker-field">
        {words.map((w, i) => (
          <Sticker
            key={w.id}
            word={w}
            index={i}
            state={active === w.id ? "bounce" : ""}
            onTap={(el) => tap(w.id, el)}
            style={{ ["--tilt" as string]: `${((i * 37) % 11) - 5}deg` }}
          />
        ))}
      </div>
      <Sprout mood={mood} className="corner-sprout" />
    </main>
  );
}

export function TopBar({ onFind }: { onFind?: () => void }) {
  return (
    <div className="topbar">
      <button
        className="round-btn"
        onPointerDown={() => {
          void cue("tap");
          go("home", "out");
        }}
        aria-label="Home"
      >
        <Icon name="home" />
      </button>
      {onFind && (
        <button className="round-btn star-btn" onPointerDown={onFind} aria-label="Play">
          <Icon name="star" />
        </button>
      )}
    </div>
  );
}
