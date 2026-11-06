import { useState } from "react";
import { Icon } from "../Icon";
import { MoveActivity } from "../MoveActivity";
import { MOVEMENTS } from "../movement";
import { globalUrl, type Pack } from "../pack";
import { go } from "../router";
import { timeUp } from "../settings";
import { Sprout } from "../Sprout";
import { useSequence } from "../useSequence";

/** A short, finite game: four familiar animals, one imitation each, then a clear ending. */
export function Move({ pack }: { pack: Pack }) {
  const [round, setRound] = useState(0);
  const finished = round >= MOVEMENTS.length;

  useSequence(async (scope) => {
    if (finished && !(await scope.say([globalUrl(pack.lang, "yay")]))) return;
  }, [finished]);

  const restart = () => {
    if (timeUp()) return go("night", "fade");
    setRound(0);
  };

  return (
    <main className={`screen movement-screen ${finished ? "movement-finished" : ""}`}>
      <button className="round-btn movement-home" onClick={() => go("home", "out")} aria-label="Home">
        <Icon name="home" />
      </button>
      {!finished ? <>
        <div className="movement-rounds" aria-label={`Movement ${round + 1} of ${MOVEMENTS.length}`}>
          {MOVEMENTS.map((action, i) => <span key={action.id} className={i < round ? "done" : i === round ? "now" : ""} aria-hidden>
            <Footprint />
          </span>)}
        </div>
        <MoveActivity key={MOVEMENTS[round].id} pack={pack} action={MOVEMENTS[round]} onDone={() => setRound((n) => n + 1)} />
      </> : (
        <div className="movement-ending">
          <div className="movement-ending-crown" aria-hidden><Icon name="star" /><Icon name="star" /><Icon name="star" /></div>
          <Sprout mood="happy" className="movement-ending-sprout" />
          <h1>All done!</h1>
          <div className="movement-ending-actions">
            <button className="round-btn big" onClick={() => go("home", "out")} aria-label="Back to the island"><Icon name="home" /></button>
            <button className="round-btn big movement-again" onClick={restart} aria-label="Play movements again"><Icon name="again" /></button>
          </div>
        </div>
      )}
    </main>
  );
}

function Footprint() {
  return <svg viewBox="0 0 36 48" aria-hidden><ellipse cx="17" cy="30" rx="10" ry="13" transform="rotate(-18 17 30)" /><circle cx="9" cy="11" r="4" /><circle cx="19" cy="7" r="4" /><circle cx="28" cy="13" r="4" /></svg>;
}
