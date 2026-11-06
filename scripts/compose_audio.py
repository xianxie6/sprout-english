"""Compose the background music and UI sound effects with macOS's built-in GS instruments.

Usage: .venv/bin/python scripts/compose_audio.py [--only bgm,star]
Out:   public/sfx/bgm.mp3 (seamless 38.4 s loop), lullaby.mp3 (bedtime, 43.6 s loop) and public/sfx/<cue>.mp3

Same method as the guofeng skill: write notes in Python → scripts/render_midi.swift renders each
track with /System/.../gs_instruments.dls → mix, light reverb, normalise here. No samples to license.
(The user said pure-numpy *music* sounds bad; numpy is only used for the pop and whoosh noises.)
"""
import argparse
import warnings
import json
import pathlib
import subprocess

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, lfilter

ROOT = pathlib.Path(__file__).resolve().parents[1]
warnings.filterwarnings("ignore", category=wavfile.WavFileWarning)  # AVAudioFile writes an extra chunk
OUT = ROOT / "public/sfx"
WORK = ROOT / ".cache/audio"
RENDER = WORK / "render_midi"
SR = 44100
rng = np.random.default_rng(7)

NAMES = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}


def m(n):
    return 12 * (int(n[-1]) + 1) + NAMES[n[:-1]]


# GS programs (General MIDI numbering, 0-based)
GLOCK, CELESTA, MUSIC_BOX, MARIMBA, NYLON, AC_BASS, PIZZ, WARM_PAD = 9, 8, 10, 12, 24, 32, 45, 89
# GS drum keys (percussion bank)
SHAKER, CLAP, WOODBLOCK, SPLASH, TRIANGLE = 70, 39, 76, 55, 81


class Score:
    def __init__(self, duration):
        self.duration = duration
        self.tracks = {}

    def note(self, track, program, t, d, n, v, perc=False, jitter=True):
        tr = self.tracks.setdefault(track, {"name": track, "program": program, "perc": perc, "events": [], "bends": []})
        if jitter:
            t += rng.uniform(-0.005, 0.005)
            v += int(rng.integers(-5, 6))
        tr["events"].append([max(0.0, t), d, m(n) if isinstance(n, str) else n, int(np.clip(v, 1, 127))])

    def render(self, name):
        """Render every track to a stereo float array (same length)."""
        stems = WORK / name
        stems.mkdir(parents=True, exist_ok=True)
        spec = stems / "score.json"
        spec.write_text(json.dumps({"duration": self.duration, "tracks": list(self.tracks.values())}))
        subprocess.run([str(RENDER), str(spec), str(stems)], check=True, capture_output=True)
        out = {}
        for k in self.tracks:
            _, x = wavfile.read(stems / f"{k}.wav")
            out[k] = x.astype(np.float32)
        return out


def ensure_renderer():
    if RENDER.exists() and RENDER.stat().st_mtime > (ROOT / "scripts/render_midi.swift").stat().st_mtime:
        return
    WORK.mkdir(parents=True, exist_ok=True)
    subprocess.run(["swiftc", "-O", str(ROOT / "scripts/render_midi.swift"), "-o", str(RENDER)], check=True)


def reverb(x, seconds=1.4, wet=0.18):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)).astype(np.float32) * np.exp(-t * 5.5)[:, None]
    b, a = butter(1, 5000 / (SR / 2))
    ir = lfilter(b, a, ir, axis=0)
    ir /= np.abs(ir).sum(axis=0).max() / 6
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - wet) + y * wet


def pan(x, p):
    """p in -1..1"""
    return x * np.array([np.sqrt((1 - p) / 2), np.sqrt((1 + p) / 2)], dtype=np.float32) * 1.414


def save(name, x, peak=0.89):
    x = x / max(1e-9, np.abs(x).max()) * peak
    OUT.mkdir(parents=True, exist_ok=True)
    wav = WORK / f"{name}.wav"
    wavfile.write(wav, SR, x.astype(np.float32))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(wav), "-b:a", "96k", str(OUT / f"{name}.mp3")], check=True)
    print(f"{name}.mp3  {len(x) / SR:.2f}s")


# ---------------------------------------------------------------- background music

BEAT = 0.6  # 100 BPM
BAR = 4 * BEAT
CHORDS = ["C", "G", "Am", "F", "C", "F", "G", "C", "F", "G", "Em", "Am", "F", "C", "G", "C"]
TONES = {"C": [0, 4, 7], "G": [7, 11, 2], "Am": [9, 0, 4], "F": [5, 9, 0], "Em": [4, 7, 11]}
# melody as (note, beats); "R" = rest. 16 bars, 4 beats each.
MELODY = [
    ("E5", 1), ("G5", 1), ("E5", 1), ("C5", 1),
    ("D5", 1), ("G5", 1), ("B4", 2),
    ("C5", 1), ("E5", 1), ("A5", 1.5), ("G5", 0.5),
    ("F5", 2), ("E5", 1), ("D5", 1),
    ("E5", 0.5), ("E5", 0.5), ("G5", 1), ("C6", 1), ("G5", 1),
    ("A5", 1), ("F5", 1), ("C5", 2),
    ("D5", 1), ("E5", 0.5), ("F5", 0.5), ("G5", 1), ("B4", 1),
    ("C5", 3), ("R", 1),
    ("A5", 1), ("G5", 1), ("F5", 1), ("A5", 1),
    ("G5", 2), ("D5", 2),
    ("E5", 1), ("G5", 1), ("B5", 1), ("G5", 1),
    ("A5", 3), ("R", 1),
    ("F5", 0.5), ("G5", 0.5), ("A5", 1), ("C6", 1), ("A5", 1),
    ("G5", 1), ("E5", 1), ("C5", 2),
    ("D5", 1), ("G5", 1), ("F5", 1), ("D5", 1),
    ("C5", 2), ("G4", 1), ("R", 1),
]


def bgm():
    loop = 16 * BAR
    s = Score(loop + 3)  # render a tail, then wrap it onto the start so the loop is seamless
    t = 0.0
    for n, beats in MELODY:
        if n != "R":
            s.note("glock", GLOCK, t, beats * BEAT * 0.9, n, 72)
        t += beats * BEAT
    assert abs(t - loop) < 1e-6, t
    for i, ch in enumerate(CHORDS):
        b0 = i * BAR
        r, third, fifth = TONES[ch]
        base = 60 + r if 60 + r <= 65 else 48 + r
        third_n = base + (third - r) % 12
        fifth_n = base + (fifth - r) % 12
        arp = [base, fifth_n, base + 12, third_n + 12, fifth_n + 12, third_n + 12, base + 12, fifth_n]
        for k, n in enumerate(arp):
            s.note("marimba", MARIMBA, b0 + k * BEAT / 2, BEAT * 0.45, n, 52 if k % 2 else 60)
        bass = 36 + r if r <= 7 else 24 + r
        s.note("bass", AC_BASS, b0, BEAT * 1.8, bass, 74)
        s.note("bass", AC_BASS, b0 + 2 * BEAT, BEAT * 1.6, bass + 7, 64)
        for beat in (1, 3):  # strummed nylon guitar on the off-beats, like a ukulele
            for j, n in enumerate(sorted([base + 12, third_n + 12, fifth_n + 12])):
                s.note("guitar", NYLON, b0 + beat * BEAT + j * 0.012, BEAT * 0.5, n, 46)
        for k in range(8):
            s.note("perc", 0, b0 + k * BEAT / 2, 0.1, SHAKER, 34 if k % 2 else 44, perc=True)
        if i >= 8:  # second half gets soft claps for a lift
            for beat in (1, 3):
                s.note("perc", 0, b0 + beat * BEAT, 0.1, CLAP, 30, perc=True)
    st = s.render("bgm")
    mix = (
        pan(st["glock"], 0.15) * 0.55
        + pan(st["marimba"], -0.25) * 0.5
        + pan(st["guitar"], 0.35) * 0.32
        + st["bass"] * 0.55
        + pan(st["perc"], -0.1) * 0.35
    )
    mix = reverb(mix, 1.6, 0.2)
    n = int(loop * SR)
    out = mix[:n].copy()
    tail = mix[n:]
    out[: len(tail)] += tail
    save("bgm", out, peak=0.7)


# ---------------------------------------------------------------- bedtime lullaby

L_BEAT = 60 / 66  # 66 BPM, 3/4
L_BAR = 3 * L_BEAT
L_CHORDS = ["F", "C", "Dm", "Bb", "F", "C", "Bb", "C", "Dm", "Bb", "F", "C", "Bb", "F", "C", "F"]
L_TONES = {"F": [5, 9, 0], "C": [0, 4, 7], "Dm": [2, 5, 9], "Bb": [10, 2, 5]}
L_MELODY = [  # one line per bar, 3 beats each
    ("A5", 2), ("C6", 1),
    ("G5", 3),
    ("F5", 2), ("A5", 1),
    ("Bb5", 3),
    ("A5", 2), ("G5", 1),
    ("C6", 2), ("Bb5", 1),
    ("A5", 1.5), ("G5", 1.5),
    ("E5", 3),
    ("F5", 2), ("D5", 1),
    ("Bb5", 3),
    ("A5", 2), ("F5", 1),
    ("G5", 3),
    ("D6", 1), ("C6", 1), ("Bb5", 1),
    ("A5", 3),
    ("G5", 2), ("E5", 1),
    ("F5", 3),
]


def lullaby():
    loop = 16 * L_BAR
    s = Score(loop + 4)
    t = 0.0
    for n, beats in L_MELODY:
        if n != "R" and beats:
            s.note("box", MUSIC_BOX, t, beats * L_BEAT * 0.95, n, 58)
        t += beats * L_BEAT
    assert abs(t - loop) < 1e-6, (t, loop)
    for i, ch in enumerate(L_CHORDS):
        b0 = i * L_BAR
        r, third, fifth = L_TONES[ch]
        base = 53 + (r - 5) % 12  # chord root between F3 and E4
        notes = [base, base + (third - r) % 12, base + (fifth - r) % 12]
        for k, n in enumerate([notes[0], notes[1] + 12, notes[2] + 12, notes[1] + 12, notes[2], notes[1] + 12]):
            s.note("cel", CELESTA, b0 + k * L_BEAT / 2, L_BEAT * 0.9, n, 34)
        for n in notes:
            s.note("pad", WARM_PAD, b0, L_BAR * 0.98, n, 40)
        s.note("bass", AC_BASS, b0, L_BAR * 0.9, base - 12, 48)
    st = s.render("lullaby")
    mix = pan(st["box"], 0.1) * 0.6 + pan(st["cel"], -0.3) * 0.35 + st["pad"] * 0.3 + st["bass"] * 0.35
    b, a = butter(2, 6000 / (SR / 2))
    mix = lfilter(b, a, reverb(mix, 2.4, 0.32), axis=0).astype(np.float32)
    n = int(loop * SR)
    out = mix[:n].copy()
    out[: len(mix) - n] += mix[n:]
    save("lullaby", out, peak=0.6)


# ---------------------------------------------------------------- cues


def cue(name, duration, notes, wet=0.15):
    """notes: (track, program, t, dur, note, vel[, perc])"""
    s = Score(duration)
    for tr, prog, t, d, n, v, *perc in notes:
        s.note(tr, prog, t, d, n, v, perc=bool(perc and perc[0]), jitter=False)
    st = s.render(name)
    mix = sum(st.values())
    save(name, reverb(mix, 1.0, wet))


def noise_cue(name, x):
    x = np.stack([x, x], axis=1).astype(np.float32)
    save(name, reverb(x, 0.6, 0.12), peak=0.8)


def cues():
    # splash: a bright rising celesta + glockenspiel arpeggio
    hello = []
    for i, n in enumerate(["C5", "E5", "G5", "C6", "E6", "G6"]):
        hello += [("cel", CELESTA, i * 0.09, 0.8, n, 80), ("glk", GLOCK, i * 0.09 + 0.01, 0.6, n, 60)]
    hello += [("glk", GLOCK, 0.62, 1.2, "C7", 70), ("perc", 0, 0.62, 0.3, TRIANGLE, 50, True)]
    cue("hello", 2.2, hello)
    # found it: sparkling arpeggio
    cue("star", 1.2, [("glk", GLOCK, i * 0.055, 0.5, n, 95 - i * 4) for i, n in enumerate(["C6", "E6", "G6", "C7", "E7"])]
        + [("cel", CELESTA, 0.0, 0.8, "G5", 60)])
    # star lands in the counter
    cue("ding", 0.9, [("glk", GLOCK, 0, 0.6, "G6", 90), ("cel", CELESTA, 0, 0.6, "G6", 60), ("glk", GLOCK, 0.08, 0.6, "D7", 70)])
    # finish: a little marimba + glock fanfare
    fan = [("mar", MARIMBA, 0.0, 0.2, "G5", 90), ("mar", MARIMBA, 0.12, 0.2, "C6", 90), ("mar", MARIMBA, 0.24, 0.2, "E6", 95)]
    for n in ["C6", "E6", "G6", "C7"]:
        fan += [("mar", MARIMBA, 0.4, 0.9, n, 90), ("glk", GLOCK, 0.4, 1.2, n, 70)]
    fan += [("perc", 0, 0.4, 0.6, SPLASH, 45, True)]
    cue("tada", 2.0, fan, wet=0.2)
    # wrong tap: a gentle falling "uh-oh", never harsh
    cue("uhoh", 0.9, [("mar", MARIMBA, 0, 0.3, "E5", 70), ("mar", MARIMBA, 0.22, 0.5, "C5", 62)])
    # small tap on buttons
    cue("tap", 0.4, [("perc", 0, 0, 0.1, WOODBLOCK, 80, True)], wet=0.08)

    t = np.arange(int(SR * 0.16)) / SR  # bubble pop: fast upward sine chirp
    f = 380 + 1500 * (t / t[-1]) ** 1.6
    noise_cue("pop", np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 26) * 0.9)
    t = np.arange(int(SR * 0.5)) / SR  # whoosh: band-passed noise sweeping up
    x = rng.standard_normal(len(t))
    y = np.zeros_like(x)
    for i in range(0, len(t), 512):
        fc = 400 + 2600 * (i / len(t))
        b, a = butter(2, [fc / (SR / 2) * 0.7, min(0.99, fc / (SR / 2) * 1.4)], btype="band")
        y[i : i + 512] = lfilter(b, a, x[i : i + 512])
    noise_cue("whoosh", y * np.sin(np.pi * t / t[-1]) ** 2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    a = ap.parse_args()
    only = {x for x in a.only.split(",") if x}
    ensure_renderer()
    if not only or "bgm" in only:
        bgm()
    if not only or "lullaby" in only:
        lullaby()
    if not only or only - {"bgm", "lullaby"}:
        cues()


if __name__ == "__main__":
    main()
