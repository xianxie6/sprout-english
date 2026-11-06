/**
 * Learning progress, kept on this device only (no account, like Word Atlas).
 *
 * Toddlers can't grade themselves, so grading is implicit (规划.md §2.4): finding a word on the
 * first try moves it up one box, at most once per day; a miss never moves it down. Boxes are
 * Leitner intervals in days. A word "sprouts" (a bud in the garden) when first met, and
 * "blooms" once it has been found first-try on two different days.
 */
import { useSyncExternalStore } from "react";
import type { Pack, Word } from "./pack";

const KEY = "sprout:progress:v1";
const INTERVAL = [0, 1, 2, 4, 7, 14, 30];
export const BLOOM_BOX = 2;

export interface Card {
  box: number;
  due: number; // day number
  met: number; // day first met
  up: number; // last day it moved up a box (-1 = never)
}

interface State {
  cards: Record<string, Card>;
  lessonDay: number; // last day the lesson was finished
  nightDay: number; // last day bedtime ran; the app sleeps until tomorrow
  today: string[]; // words played on `todayDay`
  todayDay: number;
  dayOffset: number; // grown-up testing aid: pretend it's N days later
}

const empty = (): State => ({ cards: {}, lessonDay: -1, nightDay: -1, today: [], todayDay: -1, dayOffset: 0 });

function load(): State {
  try {
    return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return empty();
  }
}

let state = load();
const subs = new Set<() => void>();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode: progress lasts for this visit only */
  }
  subs.forEach((f) => f());
}

export function useProgress() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
  );
}

export const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000) + state.dayOffset;
export const bloomed = (c?: Card) => !!c && c.box >= BLOOM_BOX;

function touch(s: State, id: string): State {
  const d = today();
  const list = s.todayDay === d ? s.today : [];
  return { ...s, todayDay: d, today: list.includes(id) ? list : [...list, id] };
}

/** First meeting (the "meet" step of a lesson). */
export function meet(id: string) {
  const d = today();
  if (state.cards[id]) return commit(touch(state, id));
  commit(touch({ ...state, cards: { ...state.cards, [id]: { box: 0, due: d, met: d, up: -1 } } }, id));
}

/** Result of one "find" round. Returns true if the word just bloomed. */
export function record(id: string, firstTry: boolean) {
  const d = today();
  const prev = state.cards[id] ?? { box: 0, due: d, met: d, up: -1 };
  const c = { ...prev };
  if (firstTry && c.up !== d) {
    c.box = Math.min(INTERVAL.length - 1, c.box + 1);
    c.up = d;
  }
  c.due = d + INTERVAL[c.box];
  commit(touch({ ...state, cards: { ...state.cards, [id]: c } }, id));
  return !bloomed(prev) && bloomed(c);
}

export const finishLesson = () => commit({ ...state, lessonDay: today() });
export const goToSleep = () => commit({ ...state, nightDay: today() });
export const wakeUp = () => commit({ ...state, nightDay: -1 });
export const isAsleep = () => state.nightDay === today();
export const lessonDoneToday = () => state.lessonDay === today();
export const todaysWords = () => (state.todayDay === today() ? state.today : []);

/** Grown-up tools on the review page. */
export const skipDay = () => commit({ ...state, dayOffset: state.dayOffset + 1 });
export const resetProgress = () => commit(empty());

/** Learning path: alternate themes so a lesson mixes animals and food. */
export function path(pack: Pack): Word[] {
  const byTheme = pack.themes.map((t) => pack.words.filter((w) => w.theme === t.id));
  const out: Word[] = [];
  for (let i = 0; out.length < pack.words.length; i++) byTheme.forEach((ws) => ws[i] && out.push(ws[i]));
  return out;
}

/** Today's lesson: up to 3 due reviews and up to 3 new words. */
export function planLesson(pack: Pack) {
  const d = today();
  const due = pack.words
    .filter((w) => state.cards[w.id] && state.cards[w.id].due <= d)
    .sort((a, b) => state.cards[a.id].due - state.cards[b.id].due)
    .slice(0, 3);
  const fresh = path(pack)
    .filter((w) => !state.cards[w.id])
    .slice(0, 3);
  return { review: due, fresh };
}
