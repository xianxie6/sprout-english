import { hasImg, imgUrl, type Word } from "./pack";

/** A word as a tappable sticker. Until the GPT art is imported it shows the emoji placeholder. */
export function Sticker({
  word,
  state = "",
  label = true,
  index = 0,
  onTap,
  style,
}: {
  word: Word;
  state?: "" | "bounce" | "wiggle" | "glow" | "dim";
  /** position in a group, staggers the pop-in animation */
  index?: number;
  label?: boolean;
  onTap?: (el: HTMLElement) => void;
  style?: React.CSSProperties;
}) {
  return (
    <button className={`sticker ${state}`} onPointerDown={(e) => onTap?.(e.currentTarget)} style={{ ["--i" as string]: index, ...style }} aria-label={word.en.word}>
      <span className="sticker-art">
        {hasImg(word) ? <img src={imgUrl(word.id)} alt="" draggable={false} /> : <span className="sticker-emoji">{word.emoji}</span>}
      </span>
      {label && <span className="sticker-word">{word.en.word}</span>}
    </button>
  );
}
