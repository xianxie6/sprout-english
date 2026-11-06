/**
 * Voice, cues and background music through Web Audio (pattern from Word Atlas src/lib/sound.ts).
 * One voice at a time: a new tap cancels whatever is still talking, so a toddler
 * hammering the screen never gets a pile-up of overlapping words. The music ducks
 * under every voice line so the word is always the loudest thing.
 */
const SFX = `${import.meta.env.BASE_URL}sfx/`;
const MUSIC_KEY = "sprout:music";
const MUSIC_LEVEL = 0.32;
const DUCKED = 0.09;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let music: AudioBufferSourceNode | null = null;
let track: Track = "bgm";
let switching = 0;
let musicSetting: boolean | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let current: AudioBufferSourceNode | null = null;
let token = 0;

function audio() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Call from the first user gesture (iOS only allows audio after one). */
export function unlock() {
  audio();
  preload(Object.keys(CUE_GAIN).map((c) => `${SFX}${c}.mp3`));
  if (musicEnabled()) void startMusic();
}

function load(url: string) {
  let p = buffers.get(url);
  if (!p) {
    const c = audio();
    if (!c) return Promise.resolve(null);
    p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
      .then((b) => c.decodeAudioData(b))
      .catch(() => {
        // A temporary network/decode failure must not mute this clip for the whole visit.
        if (buffers.get(url) === p) buffers.delete(url);
        return null;
      });
    buffers.set(url, p);
  }
  return p;
}

export const preload = (urls: string[]) => urls.forEach((u) => void load(u));

/* ---------------- music ---------------- */

export function musicEnabled() {
  if (musicSetting !== null) return musicSetting;
  try {
    return localStorage.getItem(MUSIC_KEY) !== "off";
  } catch {
    return true;
  }
}

function rampMusic(to: number, seconds: number) {
  if (!ctx || !musicBus) return;
  const g = musicBus.gain;
  g.cancelScheduledValues(ctx.currentTime);
  g.setValueAtTime(g.value, ctx.currentTime);
  g.linearRampToValueAtTime(to, ctx.currentTime + seconds);
}

/** Composed loop lengths (scripts/compose_audio.py); mp3 padding stays out of the loop. */
const LOOPS = { bgm: 38.4, lullaby: 16 * 3 * (60 / 66) } as const;
export type Track = keyof typeof LOOPS;

async function startMusic() {
  const c = audio();
  if (!c || !musicBus || music || !musicEnabled()) return;
  const want = track;
  const buf = await load(`${SFX}${want}.mp3`);
  if (!buf || music || want !== track || !musicEnabled()) return;
  music = c.createBufferSource();
  music.buffer = buf;
  music.loop = true;
  music.loopEnd = Math.min(buf.duration, LOOPS[want]);
  music.connect(musicBus);
  music.start();
  rampMusic(speaking ? DUCKED : MUSIC_LEVEL, 1.5);
}

/** Crossfade to another piece (day music ↔ bedtime lullaby). */
export function setTrack(next: Track) {
  if (next === track) return;
  track = next;
  const old = music;
  music = null;
  const my = ++switching;
  rampMusic(0, 0.8);
  window.setTimeout(() => {
    try {
      old?.stop();
    } catch {
      /* not started */
    }
    if (my === switching && musicEnabled() && ctx) void startMusic();
  }, old ? 850 : 0);
}

export function setMusic(on: boolean) {
  musicSetting = on;
  clearTimeout(restore);
  try {
    localStorage.setItem(MUSIC_KEY, on ? "on" : "off");
  } catch {
    /* private mode: the toggle just won't persist */
  }
  if (on) {
    void startMusic();
    rampMusic(speaking ? DUCKED : MUSIC_LEVEL, 0.6);
  } else rampMusic(0, 0.4);
}

let speaking = false;
let restore = 0;
function duck(on: boolean) {
  speaking = on;
  clearTimeout(restore);
  if (!musicEnabled() || !music) return;
  if (on) rampMusic(DUCKED, 0.15);
  else restore = window.setTimeout(() => {
    if (musicEnabled() && music && !speaking) rampMusic(MUSIC_LEVEL, 0.8);
  }, 350);
}

/* ---------------- voice ---------------- */

export function stopVoice() {
  token++;
  try {
    current?.stop();
  } catch {
    /* already stopped */
  }
  current = null;
  duck(false);
}

function playBuffer(buf: AudioBuffer, my: number) {
  return new Promise<void>((resolve) => {
    const c = audio();
    if (!c || !master || my !== token) return resolve();
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(master);
    // onended never fires while the context is suspended (autoplay policy, background tab),
    // so a timer from the clip length keeps the flow moving either way.
    const timer = setTimeout(resolve, buf.duration * 1000 + 400);
    src.onended = () => {
      clearTimeout(timer);
      resolve();
    };
    current = src;
    src.start();
  });
}

/** Say clips with small gaps. Missing audio is skipped; resolves false only if interrupted. */
export async function say(urls: string[], gap = 220): Promise<boolean> {
  stopVoice();
  const my = token;
  duck(true);
  try {
    for (let i = 0; i < urls.length; i++) {
      const buf = await load(urls[i]);
      if (my !== token) return false;
      if (buf) await playBuffer(buf, my);
      if (my !== token) return false;
      if (i < urls.length - 1) await new Promise((r) => setTimeout(r, gap));
    }
    return true;
  } finally {
    if (my === token) duck(false);
  }
}

/* ---------------- cues ---------------- */

/** Composed with the GS instruments by scripts/compose_audio.py. */
const CUE_GAIN = {
  hello: 0.55,
  star: 0.5,
  ding: 0.45,
  tada: 0.55,
  uhoh: 0.32,
  tap: 0.4,
  pop: 0.35,
  whoosh: 0.28,
} as const;
export type Cue = keyof typeof CUE_GAIN;

export async function cue(kind: Cue, delay = 0) {
  const c = audio();
  if (!c || !master) return;
  const buf = await load(`${SFX}${kind}.mp3`);
  if (!buf) return;
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = CUE_GAIN[kind];
  src.buffer = buf;
  src.connect(g).connect(master);
  src.start(c.currentTime + delay);
}
