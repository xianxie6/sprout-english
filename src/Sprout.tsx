/**
 * 芽芽 — the mascot, layered SVG so each state can animate with CSS.
 * Style D "童画线稿": flat fills, thin warm-brown line, bean eyes, no highlights (matches the art prompts).
 */
export type Mood = "idle" | "happy" | "think" | "sleepy" | "talk";

const LINE = "#3A2E2A";
const W = 4;

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "happy")
    return (
      <g fill="none" stroke={LINE} strokeWidth={W + 1} strokeLinecap="round">
        <path d="M68 112 Q77 102 86 112" />
        <path d="M114 112 Q123 102 132 112" />
      </g>
    );
  if (mood === "sleepy")
    return (
      <g fill="none" stroke={LINE} strokeWidth={W + 1} strokeLinecap="round">
        <path d="M68 113 Q77 120 86 113" />
        <path d="M114 113 Q123 120 132 113" />
      </g>
    );
  const dx = mood === "think" ? -4 : 0;
  return (
    <g className="sprout-eyes">
      <ellipse cx={77 + dx} cy={112} rx={7} ry={9} fill={LINE} />
      <ellipse cx={123 + dx} cy={112} rx={7} ry={9} fill={LINE} />
      <circle cx={79 + dx} cy={108.5} r={2.4} fill="#fff" />
      <circle cx={125 + dx} cy={108.5} r={2.4} fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  if (mood === "happy") return <path d="M86 132 Q100 154 114 132Z" fill="#F0606A" stroke={LINE} strokeWidth={W} strokeLinejoin="round" />;
  if (mood === "think") return <circle cx={100} cy={138} r={4.5} fill={LINE} />;
  if (mood === "sleepy") return <ellipse cx={100} cy={140} rx={7} ry={9} fill="#F0606A" stroke={LINE} strokeWidth={W} />;
  if (mood === "talk") return <ellipse className="sprout-talk" cx={100} cy={138} rx={9} ry={8} fill="#F0606A" stroke={LINE} strokeWidth={W} />;
  return <path d="M89 133 Q100 143 111 133" fill="none" stroke={LINE} strokeWidth={W + 0.5} strokeLinecap="round" />;
}

export function Sprout({ mood = "idle", className = "", onClick }: { mood?: Mood; className?: string; onClick?: () => void }) {
  return (
    <svg viewBox="0 0 200 200" className={`sprout sprout-${mood} ${className}`} onClick={onClick} role="img" aria-label="Sprout">
      <g className="sprout-body" stroke={LINE} strokeWidth={W} strokeLinejoin="round">
        <g className="sprout-leaf">
          <path d="M100 60 C100 44 99 34 96 26" fill="none" strokeLinecap="round" />
          <path d="M96 28 C76 8 50 14 44 30 C64 42 86 40 96 28Z" fill="#5DB04A" />
          <path d="M97 30 C112 10 140 12 150 26 C132 40 108 42 97 30Z" fill="#7CC452" />
        </g>
        <ellipse cx={76} cy={182} rx={17} ry={9} fill="#8CC63F" />
        <ellipse cx={124} cy={182} rx={17} ry={9} fill="#8CC63F" />
        <path d="M100 56 C150 56 172 96 172 128 C172 162 140 180 100 180 C60 180 28 162 28 128 C28 96 50 56 100 56Z" fill="#A9DB4F" />
        <circle cx={58} cy={132} r={10} fill="#F7A1B0" stroke="none" />
        <circle cx={142} cy={132} r={10} fill="#F7A1B0" stroke="none" />
      </g>
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {mood === "sleepy" && (
        <g fill="#56C3F9" fontFamily="Fredoka" fontWeight={700}>
          <text x={150} y={62} fontSize={28}>z</text>
          <text x={170} y={40} fontSize={20}>z</text>
        </g>
      )}
      {mood === "think" && (
        <text x={158} y={58} fontFamily="Fredoka" fontWeight={700} fontSize={40} fill="#56C3F9">?</text>
      )}
    </svg>
  );
}
