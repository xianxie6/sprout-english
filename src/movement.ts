/** Four short imitation games using animals already in the first language pack. */
export type MovementMotion = "hop" | "flap" | "stretch" | "march";

export interface Movement {
  id: MovementMotion;
  wordId: string;
  instruction: string;
  /** For the grown-ups' description; the child activity stays in English. */
  hintZh: string;
  motion: MovementMotion;
}

export const MOVEMENTS: Movement[] = [
  { id: "hop", wordId: "rabbit", instruction: "Hop like a rabbit!", hintZh: "学小兔轻轻跳，也可以坐着用手指跳。", motion: "hop" },
  { id: "flap", wordId: "chicken", instruction: "Flap your wings!", hintZh: "张开手臂，像小鸡一样扇扇翅膀。", motion: "flap" },
  { id: "stretch", wordId: "cat", instruction: "Stretch like a cat!", hintZh: "像小猫伸懒腰，双手慢慢向上伸。", motion: "stretch" },
  { id: "march", wordId: "horse", instruction: "March like a horse!", hintZh: "学小马原地踏步，也可以坐着交替抬脚。", motion: "march" },
];
