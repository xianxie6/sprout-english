/** Language pack: index built by scripts/build.py, media under public/pack/. */
export const BASE = import.meta.env.BASE_URL;

export type Line = "word" | "intro" | "say" | "find" | "found" | "that" | "bye";

export interface Word {
  id: string;
  theme: string;
  zh: string;
  emoji: string;
  en: Record<Line, string>;
  /** 1 sticker image, 2 full audio set */
  media: number;
  /** offline play idea for grown-ups (Chinese), shown in the parent centre */
  tip: string;
}

export interface Theme {
  id: string;
  zh: string;
  emoji: string;
  scene: boolean;
  /** has a little building for the home island (house-<id>.webp) */
  house: boolean;
}

export interface Pack {
  lang: string;
  themes: Theme[];
  /** which painted page backgrounds exist (island.webp, garden-bg.webp, night-bg.webp) */
  decor: { island: boolean; garden: boolean; night: boolean };
  words: Word[];
  global: string[];
}

export const loadPack = (lang = "en"): Promise<Pack> =>
  fetch(`${BASE}pack/${lang}/index.json`).then((r) => {
    if (!r.ok) throw new Error(`pack ${r.status}`);
    return r.json();
  });

export const lineUrl = (lang: string, id: string, line: string) => `${BASE}pack/${lang}/audio/${id}/${line}.mp3`;
export const globalUrl = (lang: string, key: string) => `${BASE}pack/${lang}/audio/_global/${key}.mp3`;
export const imgUrl = (id: string) => `${BASE}pack/img/${id}.webp`;
export const hasImg = (w: Word) => (w.media & 1) === 1;
