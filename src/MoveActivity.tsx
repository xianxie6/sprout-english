import { useRef, useState } from "react";
import { Icon } from "./Icon";
import { globalUrl, hasImg, imgUrl, type Pack } from "./pack";
import { Sprout } from "./Sprout";
import { useSequence } from "./useSequence";
import type { Movement, MovementMotion } from "./movement";
import "./movement.css";

interface ActivityProps {
  pack: Pack;
  action: Movement;
  onDone: () => void;
}

/** Shared by the four-round game and the short movement break in a lesson. */
export function MoveActivity({ pack, action, onDone }: ActivityProps) {
  const [take, setTake] = useState(0);
  return <MovementRound key={`${action.id}:${take}`} pack={pack} action={action} onDone={onDone} onReplay={() => setTake((n) => n + 1)} />;
}

function MovementRound({ pack, action, onDone, onReplay }: ActivityProps & { onReplay: () => void }) {
  const [phase, setPhase] = useState<"watch" | "copy" | "ready">("watch");
  const [beats, setBeats] = useState(0);
  const finished = useRef(false);
  const word = pack.words.find((w) => w.id === action.wordId);

  useSequence(async (scope) => {
    if (!(await scope.say([globalUrl(pack.lang, `move-${action.id}`)]))) return;
    setPhase("copy");
    // This is time for a child to imitate, never a claim that a camera detected an action.
    for (let beat = 1; beat <= 5; beat++) {
      if (!(await scope.wait(1000))) return;
      setBeats(beat);
    }
    setPhase("ready");
  });

  const next = () => {
    if (phase !== "ready" || finished.current) return;
    finished.current = true;
    onDone();
  };

  return (
    <section className={`movement-activity motion-${action.motion} phase-${phase}`} aria-label={action.instruction}>
      <div className="movement-instruction">
        <h1>{action.instruction}</h1>
        <button className="movement-replay" onClick={onReplay} aria-label="Show me again">
          <Icon name="speaker" />
        </button>
      </div>

      <div className="movement-stage" aria-hidden inert>
        <div className="movement-lawn" />
        <div className="movement-animal-spot">
          <MotionGuide motion={action.motion} />
          <div className="movement-animal">
            {word && hasImg(word) ? <img src={imgUrl(word.id)} alt="" draggable={false} /> : <span className="movement-word-fallback">{action.wordId}</span>}
          </div>
          <div className="movement-animal-shadow" />
        </div>
        <div className="movement-sprout-spot">
          <div className="movement-sprout">
            {(action.motion === "flap" || action.motion === "stretch") && <LeafArms />}
            <Sprout mood={phase === "watch" ? "talk" : "happy"} />
          </div>
          <div className="movement-sprout-shadow" />
        </div>
      </div>

      <div className="movement-turn">
        <div className="movement-turn-copy" role="status" aria-live="polite">
          <span>{phase === "watch" ? "Watch Sprout" : phase === "copy" ? "Your turn!" : "Ready?"}</span>
          <div className="movement-beats" aria-label={phase === "ready" ? "Ready to continue" : "Take your time to try the movement"}>
            {Array.from({ length: 5 }, (_, i) => <i key={i} className={i < beats ? "done" : phase === "copy" && i === beats ? "now" : ""} />)}
          </div>
        </div>
        <button className="movement-next" disabled={phase !== "ready"} onClick={next} aria-label="Continue">
          <svg viewBox="0 0 48 48" aria-hidden><path d="M10 24h27M25 11l13 13-13 13" /></svg>
        </button>
      </div>
    </section>
  );
}

/** Paths describe the action itself; each animal gets a different movement rather than a wiggle. */
function MotionGuide({ motion }: { motion: MovementMotion }) {
  return (
    <svg viewBox="0 0 360 300" preserveAspectRatio="xMidYMax meet" className={`movement-guide guide-${motion}`} aria-hidden>
      {motion === "hop" && <>
        <path className="movement-trail" d="M55 222C66 56 274 50 301 194" />
        <path className="movement-arrow" d="M282 184l20 22 7-28" />
        <path className="movement-ground-mark" d="M52 250l-17-7m39-5-3-19m197 29 20-10m-12 31 23 2" />
      </>}
      {motion === "flap" && <>
        <path className="movement-wing movement-wing-left" d="M101 145C63 107 29 118 44 149c-18 10-9 31 15 27-7 22 23 29 50-4" />
        <path className="movement-wing movement-wing-right" d="M260 145c38-38 72-27 57 4 18 10 9 31-15 27 7 22-23 29-50-4" />
        <path className="movement-trail" d="M43 87l-9-20m20 14 7-20m249 26 9-20m-20 14-7-20" />
      </>}
      {motion === "stretch" && <>
        <path className="movement-trail" d="M62 196V76m235 120V76" />
        <path className="movement-arrow" d="M49 91l13-18 13 18m209 0 13-18 13 18" />
        <path className="movement-ground-mark" d="M137 46l-8-15m51 9V21m43 25 8-15" />
      </>}
      {motion === "march" && <>
        <g className="movement-hoof movement-hoof-left"><ellipse cx="126" cy="260" rx="22" ry="11" /><path d="M112 279h28" /></g>
        <g className="movement-hoof movement-hoof-right"><ellipse cx="231" cy="269" rx="22" ry="11" /><path d="M217 288h28" /></g>
        <path className="movement-trail" d="M63 211v-59m235 74v-59" />
        <path className="movement-arrow" d="M51 165l12-17 12 17m211 16 12-17 12 17" />
      </>}
    </svg>
  );
}

function LeafArms() {
  return (
    <svg viewBox="0 0 200 200" className="movement-leaf-arms" aria-hidden>
      <path className="movement-arm-left" d="M44 119C14 98-4 110 2 128c9 17 29 14 43 3" />
      <path className="movement-arm-right" d="M156 119c30-21 48-9 42 9-9 17-29 14-43 3" />
    </svg>
  );
}
