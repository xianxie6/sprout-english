/**
 * Grown-up settings and today's play time, on this device only.
 * Kept apart from learning progress so "清空进度" doesn't wipe the time limit.
 */
import { useSyncExternalStore } from "react";
import { today } from "./progress";

const KEY = "sprout:settings:v1";

interface Settings {
  dailyLimit: number; // minutes per day, 0 = no limit (规划.md: default 15)
  playDay: number;
  playMs: number;
}

const defaults: Settings = { dailyLimit: 15, playDay: -1, playMs: 0 };

function load(): Settings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return { ...defaults };
  }
}

let state = load();
const subs = new Set<() => void>();

function commit(next: Settings) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
  subs.forEach((f) => f());
}

export function useSettings() {
  return useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => state,
  );
}

export const LIMITS = [0, 10, 15, 20, 30];
export const setDailyLimit = (minutes: number) => commit({ ...state, dailyLimit: minutes });

/** Milliseconds played today. */
export const playedToday = () => (state.playDay === today() ? state.playMs : 0);

export function addPlay(ms: number) {
  const d = today();
  commit({ ...state, playDay: d, playMs: (state.playDay === d ? state.playMs : 0) + ms });
}

export const resetPlayToday = () => commit({ ...state, playDay: today(), playMs: 0 });

export const timeUp = () => state.dailyLimit > 0 && playedToday() >= state.dailyLimit * 60000;
