import { useEffect, useState } from "react";
import { unlock } from "./audio";
import { loadPack, type Pack } from "./pack";
import { useRoute } from "./router";
import { Sprout } from "./Sprout";
import { Start } from "./pages/Start";
import { Home } from "./pages/Home";
import { Explore } from "./pages/Explore";
import { Find } from "./pages/Find";
import { Review } from "./pages/Review";
import { Lesson } from "./pages/Lesson";
import { Garden } from "./pages/Garden";
import { Night } from "./pages/Night";
import { Move } from "./pages/Move";
import { isAsleep, useProgress } from "./progress";
import { Cards, Parent } from "./pages/Parent";
import { addPlay, timeUp, useSettings } from "./settings";
import { go } from "./router";

export { go } from "./router";

/** Hash routes: #/ start · #/home · #/lesson · #/move · #/garden · #/night · #/explore/<theme> · #/find/<theme> · #/parent · #/cards/<met|all> · #/review */
export default function App() {
  const [pack, setPack] = useState<Pack | null>(null);
  const [error, setError] = useState("");
  const [page, arg] = useRoute();
  useProgress(); // re-render when bedtime starts or a grown-up wakes Sprout
  useSettings();
  usePlayClock(page);

  useEffect(() => {
    loadPack("en").then(setPack, (e: Error) => setError(e.message));
    // A deep link skips the splash; the first tap anywhere still unlocks audio and starts the music.
    const first = () => unlock();
    window.addEventListener("pointerdown", first, { once: true, capture: true });
    return () => window.removeEventListener("pointerdown", first, { capture: true });
  }, []);

  if (error) return <div className="boot">语言包加载失败：{error}</div>;
  if (!pack)
    return (
      <div className="boot">
        <Sprout className="bob" />
      </div>
    );

  const theme = pack.themes.find((t) => t.id === arg) ?? pack.themes[0];
  if (page === "review") return <Review pack={pack} />;
  if (page === "parent") return <Parent pack={pack} />;
  if (page === "cards") return <Cards pack={pack} which={arg ?? "all"} />;
  // after bedtime the app sleeps until tomorrow; only the grown-ups' page stays open
  if (page === "night" || (isAsleep() && page)) return <Night key={isAsleep() ? "asleep" : "night"} pack={pack} asleep={isAsleep()} />;
  if (page === "home") return <Home pack={pack} />;
  if (page === "lesson") return <Lesson pack={pack} />;
  if (page === "move") return <Move pack={pack} />;
  if (page === "garden") return <Garden pack={pack} />;
  if (page === "explore") return <Explore key={theme.id} pack={pack} theme={theme} />;
  if (page === "find") return <Find key={theme.id} pack={pack} theme={theme} />;
  return <Start pack={pack} />;
}

/** Pages where the child is playing (counted against the daily limit). */
const KID_PAGES = new Set(["home", "lesson", "move", "garden", "explore", "find"]);
/** Pages that may be interrupted for bedtime; a lesson finishes first and ends in the garden. */
const INTERRUPTIBLE = new Set(["home", "move", "garden", "explore", "find"]);

/** Count visible play time and send the child to bedtime when the daily limit is reached. */
function usePlayClock(page: string | undefined) {
  useEffect(() => {
    let last = performance.now();
    let visible = document.visibilityState === "visible";
    const count = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      if (visible && page && KID_PAGES.has(page) && dt > 0) addPlay(dt);
    };
    const visibility = () => {
      count(); // settle the old visibility state before switching to the new one
      visible = document.visibilityState === "visible";
    };
    // Settle before a lesson button checks the limit, including the last partial interval.
    window.addEventListener("pointerdown", count, true);
    document.addEventListener("visibilitychange", visibility);
    const id = window.setInterval(() => {
      count();
      if (visible && page && timeUp() && INTERRUPTIBLE.has(page) && !isAsleep()) go("night", "fade");
    }, 5000);
    return () => {
      clearInterval(id);
      window.removeEventListener("pointerdown", count, true);
      document.removeEventListener("visibilitychange", visibility);
      count(); // changing pages must not discard an interval shorter than five seconds
    };
  }, [page]);
}
