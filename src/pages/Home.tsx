import { useState } from "react";
import { go } from "../router";
import { cue, musicEnabled, say, setMusic } from "../audio";
import { BASE, globalUrl, hasImg, imgUrl, type Pack } from "../pack";
import { lessonDoneToday } from "../progress";
import { Sprout, type Mood } from "../Sprout";
import { ParentLock } from "../ParentGate";
import { Icon } from "../Icon";
import { timeUp } from "../settings";

/**
 * Clearings on the painted island (island.webp), as % of the 3:2 picture: each theme's little
 * house stands on one, 芽芽 on the big one in the middle. More themes will need more clearings
 * Themes beyond four go onto more islands (same picture, flipped every other page) reached with
 * the side arrows; the page is remembered for the session so coming back lands on the same island.
 */
const PER_ISLAND = 4;
const PAGE_KEY = "sprout:islandPage";
const readPage = () => {
  try {
    return Number(sessionStorage.getItem(PAGE_KEY)) || 0;
  } catch {
    return 0;
  }
};
const SPOTS = [
  { x: 30, y: 34 },
  { x: 70, y: 33 },
  { x: 31, y: 69 },
  { x: 68, y: 69 },
];
const SPROUT_SPOT = { x: 50, y: 52 };

/**
 * The island: tap 芽芽 for today's lesson (it glows until done), a house for free play in that
 * theme, the flower for the garden, the moon for bedtime. No text the child needs to read.
 */
export function Home({ pack }: { pack: Pack }) {
  const [mood, setMood] = useState<Mood>("idle");
  const [picked, setPicked] = useState("");
  const [music, setMusicOn] = useState(musicEnabled);
  const painted = pack.decor?.island;
  const pages = Math.max(1, Math.ceil(pack.themes.length / PER_ISLAND));
  const [page, setPage] = useState(() => Math.min(readPage(), pages - 1));
  const turn = (d: number) => () => {
    if (picked) return;
    const next = (page + d + pages) % pages;
    void cue("whoosh");
    setPage(next);
    try {
      sessionStorage.setItem(PAGE_KEY, String(next));
    } catch {
      /* private mode: just don't remember */
    }
  };
  const onIsland = pack.themes.slice(page * PER_ISLAND, page * PER_ISLAND + PER_ISLAND);

  const open = async (id: string) => {
    if (picked) return;
    setPicked(id);
    void cue("pop");
    setMood("talk");
    await say([globalUrl(pack.lang, id)]);
    setMood("happy");
    void cue("whoosh");
    go(`explore/${id}`, "in");
  };

  const enter = (path: string, line?: string) => async () => {
    if (picked) return;
    if ((path === "lesson" || path === "move") && timeUp()) {
      go("night", "fade");
      return;
    }
    setPicked(path);
    void cue("pop");
    if (line) {
      setMood("talk");
      await say([globalUrl(pack.lang, line)]);
    }
    setMood("happy");
    void cue("whoosh");
    go(path, "in");
  };

  const toggleMusic = () => {
    void cue("tap");
    setMusic(!music);
    setMusicOn(!music);
  };

  const sprout = (
    <button
      className={`home-sprout-btn ${lessonDoneToday() ? "" : "todo"}`}
      onPointerDown={enter("lesson")}
      aria-label="Today's lesson"
      style={painted ? { left: `${SPROUT_SPOT.x}%`, top: `${SPROUT_SPOT.y}%` } : undefined}
    >
      <Sprout mood={mood} className="home-sprout" />
    </button>
  );

  return (
    <main className={`screen home ${painted ? "painted" : ""}`}>
      {painted ? (
        <div className="stage32" key={page}>
          <div className={`stage32-bg ${page % 2 ? "flip" : ""}`} style={{ backgroundImage: `url(${BASE}pack/img/island.webp)` }} />
          {onIsland.map((t, i) =>
            t.house && SPOTS[i] ? (
              <button
                key={t.id}
                className={`theme-house ${picked === t.id ? "picked" : ""}`}
                onPointerDown={() => open(t.id)}
                aria-label={t.zh}
                style={{ left: `${SPOTS[i].x}%`, top: `${SPOTS[i].y}%`, ["--i" as string]: i }}
              >
                <img src={imgUrl(`house-${t.id}`)} alt="" draggable={false} />
              </button>
            ) : null,
          )}
          {sprout}
        </div>
      ) : (
        <>
          <div className="island" />
          <div className="home-themes">
            {pack.themes.map((t, i) => {
              const cover = pack.words.filter((w) => w.theme === t.id).find(hasImg);
              return (
                <button
                  key={t.id}
                  className={`theme-bubble t${i} ${picked === t.id ? "picked" : ""}`}
                  onPointerDown={() => open(t.id)}
                  aria-label={t.zh}
                  style={{ ["--i" as string]: i }}
                >
                  {cover ? <img src={imgUrl(cover.id)} alt="" /> : <span>{t.emoji}</span>}
                </button>
              );
            })}
          </div>
          {sprout}
        </>
      )}
      {painted && pages > 1 && (
        <>
          <button className="round-btn island-arrow prev" onPointerDown={turn(-1)} aria-label="Previous island">
            <Icon name="play" />
          </button>
          <button className="round-btn island-arrow next" onPointerDown={turn(1)} aria-label="Next island">
            <Icon name="play" />
          </button>
          <div className="island-dots" aria-hidden>
            {Array.from({ length: pages }, (_, k) => <i key={k} className={k === page ? "on" : ""} />)}
          </div>
        </>
      )}
      <button className="round-btn big corner-btn garden-btn" onPointerDown={enter("garden")} aria-label="Garden">
        <Icon name="flower" />
      </button>
      <button className="round-btn big corner-btn move-btn" onClick={enter("move")} aria-label="Let's move">
        <Icon name="move" />
      </button>
      <button className="round-btn big corner-btn night-btn" onPointerDown={enter("night")} aria-label="Bedtime">
        <Icon name="moon" />
      </button>
      <ParentLock />
      <button className="round-btn music-btn" onPointerDown={toggleMusic} aria-label={music ? "Music off" : "Music on"}>
        <Icon name={music ? "music" : "musicOff"} />
      </button>
    </main>
  );
}
