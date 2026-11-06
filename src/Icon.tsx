/**
 * UI icons in the same "童画线稿" look as the art: flat fills, thin warm-brown line, rounded.
 * System emoji (glossy Apple style) clashed with the illustrations, so every control uses these.
 */
const LINE = "#3A2E2A";

export type IconName = "home" | "star" | "flower" | "bud" | "moon" | "music" | "musicOff" | "again" | "speaker" | "ear" | "play" | "tap" | "lock" | "print" | "clock" | "move";

const STAR = "M24 5.5l5.6 11.6 12.6 1.6-9.3 8.8 2.4 12.6L24 34l-11.3 6.1 2.4-12.6-9.3-8.8 12.6-1.6z";

/** Same star for DOM code outside React (the flying star in fx.ts). */
export const STAR_SVG = `<svg viewBox="0 0 48 48" width="100%" height="100%"><path d="${STAR}" fill="#FFD93B" stroke="${LINE}" stroke-width="3" stroke-linejoin="round"/><circle cx="19" cy="22" r="2" fill="${LINE}"/><circle cx="29" cy="22" r="2" fill="${LINE}"/><path d="M21 27q3 3 6 0" fill="none" stroke="${LINE}" stroke-width="2.4" stroke-linecap="round"/></svg>`;

function shapes(name: IconName) {
  switch (name) {
    case "move":
      return (
        <>
          <g transform="rotate(-20 15 28)">
            <ellipse cx={15} cy={29} rx={6} ry={10} fill="#F0606A" />
            <circle cx={15} cy={13} r={4.5} fill="#F0606A" />
          </g>
          <g transform="rotate(20 33 20)">
            <ellipse cx={33} cy={22} rx={6} ry={10} fill="#56C3F9" />
            <circle cx={33} cy={6} r={4.5} fill="#56C3F9" />
          </g>
        </>
      );
    case "home":
      return (
        <>
          <path d="M10 22h28v17a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" fill="#FFE9B8" />
          <path d="M5.5 23.5L24 7.5l18.5 16a2 2 0 0 1-1.3 3.5H6.8a2 2 0 0 1-1.3-3.5z" fill="#F0606A" />
          <path d="M20 42V32a4 4 0 0 1 8 0v10" fill="#8CCB4E" />
        </>
      );
    case "star":
      return <path d={STAR} fill="#FFD93B" />;
    case "flower":
      return (
        <>
          <path d="M24 30v13" stroke="#5DB04A" strokeWidth={4} />
          <path d="M24 38c-5-5-10-4-12-2 3 4 8 5 12 2z" fill="#7CC452" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={24 + Math.sin((a * Math.PI) / 180) * 9} cy={19 - Math.cos((a * Math.PI) / 180) * 9} r={7} fill="#F7A1B0" />
          ))}
          <circle cx={24} cy={19} r={6} fill="#FFD93B" />
        </>
      );
    case "bud":
      return (
        <>
          <path d="M24 28v15" stroke="#5DB04A" strokeWidth={4} />
          <path d="M24 37c5-5 10-4 12-2-3 4-8 5-12 2z" fill="#7CC452" />
          <path d="M24 30c-8-3-9-15 0-22 9 7 8 19 0 22z" fill="#9CD86A" />
        </>
      );
    case "moon":
      return <path d="M30 6a18 18 0 1 0 13 26A15 15 0 0 1 30 6z" fill="#FFE27A" />;
    case "music":
      return (
        <>
          <path d="M19 33V11l20-5v22" fill="none" strokeWidth={3.5} />
          <ellipse cx={14} cy={34} rx={6} ry={5} fill="#56C3F9" />
          <ellipse cx={34} cy={29} rx={6} ry={5} fill="#56C3F9" />
          <path d="M19 16l20-5" strokeWidth={3.5} />
        </>
      );
    case "musicOff":
      return (
        <>
          <path d="M19 33V11l20-5v22" fill="none" strokeWidth={3.5} opacity={0.45} />
          <ellipse cx={14} cy={34} rx={6} ry={5} fill="#cfd8dc" />
          <ellipse cx={34} cy={29} rx={6} ry={5} fill="#cfd8dc" />
          <path d="M8 8l32 32" stroke="#F0606A" strokeWidth={5} />
        </>
      );
    case "again":
      return (
        <>
          <path d="M37 25a13 13 0 1 1-4-10" fill="none" stroke="#8CCB4E" strokeWidth={6} />
          <path d="M28 9l9 5-6 8z" fill="#8CCB4E" />
        </>
      );
    case "speaker":
      return (
        <>
          <path d="M8 19h7l10-8v26l-10-8H8z" fill="#FFD93B" />
          <path d="M31 18a8 8 0 0 1 0 12M35 13a14 14 0 0 1 0 22" fill="none" strokeWidth={3.2} />
        </>
      );
    case "ear":
      return (
        <>
          <path d="M14 20a11 11 0 0 1 22 0c0 7-6 9-7 14-1 4-4 7-8 6-3-1-4-4-3-6" fill="#FFCDB2" />
          <path d="M20 21a5 5 0 0 1 10 0c0 3-3 4-4 6" fill="none" />
        </>
      );
    case "play":
      return <path d="M16 10l22 14-22 14z" fill="#fff" />;
    case "lock":
      return (
        <>
          <path d="M16 22v-6a8 8 0 0 1 16 0v6" fill="none" strokeWidth={4} />
          <rect x={11} y={21} width={26} height={20} rx={5} fill="#FFD93B" />
          <circle cx={24} cy={30} r={2.6} fill="#3A2E2A" />
          <path d="M24 31v4" strokeWidth={3} />
        </>
      );
    case "print":
      return (
        <>
          <rect x={14} y={6} width={20} height={12} rx={2} fill="#fff" />
          <rect x={6} y={17} width={36} height={16} rx={4} fill="#56C3F9" />
          <rect x={14} y={27} width={20} height={15} rx={2} fill="#fff" />
          <path d="M18 33h12M18 37h8" strokeWidth={2.4} />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx={24} cy={25} r={17} fill="#fff" />
          <path d="M24 15v10l7 4" fill="none" strokeWidth={3.4} />
        </>
      );
    case "tap":
      return (
        <>
          <circle cx={24} cy={24} r={18} fill="none" stroke="#FFD93B" strokeWidth={4} opacity={0.7} />
          <circle cx={24} cy={24} r={9} fill="#FFD93B" />
        </>
      );
  }
}

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`icon icon-${name} ${className}`} aria-hidden>
      <g stroke={LINE} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        {shapes(name)}
      </g>
    </svg>
  );
}
