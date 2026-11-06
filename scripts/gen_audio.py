"""Synthesize every line in content/words.json with edge-tts (resumable).

Usage: .venv/bin/python scripts/gen_audio.py [--only cat,dog] [--force]
Output: public/pack/en/audio/<id>/<line>.mp3 and public/pack/en/audio/_global/<key>.mp3

Two voices: a warm teacher (Ava) and Sprout, the mascot (Ana, a cartoon child voice).
Child-directed speech: slower and a little higher than normal.
"""
import argparse
import asyncio
import json
import pathlib

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public/pack/en/audio"

TEACHER = {"voice": "en-US-AvaNeural", "rate": "-15%", "pitch": "+4Hz"}
SPROUT = {"voice": "en-US-AnaNeural", "rate": "-20%", "pitch": "+0Hz"}
SLOW_WORD = {"voice": "en-US-AvaNeural", "rate": "-30%", "pitch": "+4Hz"}

# Which voice says which line.
WORD_LINES = {
    "word": SLOW_WORD,  # the bare word, extra slow and clear
    "intro": TEACHER,
    "say": SPROUT,
    "find": TEACHER,
    "found": TEACHER,
    "that": TEACHER,
    "bye": TEACHER,
}
GLOBAL_VOICE = {k: SPROUT for k in ("hello", "tap", "yay", "super", "sleepy", "again", "lessonHi", "newFriend", "letsPlay", "garden", "sleepTight")}


# edge-tts pads clips and the Ana voice pauses ~1.2s between sentences; toddlers need snappy
# feedback, so trim the edges and cap inner pauses at ~0.4s.
TIDY = (
    "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,"
    "silenceremove=stop_periods=-1:stop_duration=0.4:stop_threshold=-45dB:stop_silence=0.35,"
    "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse"
)


async def tidy(src, out):
    tmp = out.with_suffix(".tidy.mp3")
    p = await asyncio.create_subprocess_exec(
        "ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", TIDY, "-ar", "24000", "-b:a", "64k", str(tmp)
    )
    if await p.wait() != 0:
        raise RuntimeError("ffmpeg tidy failed")
    tmp.rename(out)
    src.unlink()


async def synth(text, cfg, out, force):
    if out.exists() and not force:
        return "cached"
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".part")
    for attempt in range(4):
        try:
            await edge_tts.Communicate(text, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"]).save(str(tmp))
            if tmp.stat().st_size < 1500:
                raise ValueError("audio too small")
            await tidy(tmp, out)
            return "ok"
        except Exception as e:  # network hiccups
            if attempt == 3:
                raise RuntimeError(f"{out.name}: {e}")
            await asyncio.sleep(2 + attempt * 3)


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    data = json.loads((ROOT / "content/words.json").read_text())
    only = {x for x in a.only.split(",") if x}
    jobs = []
    for w in data["words"]:
        if only and w["id"] not in only:
            continue
        for line, cfg in WORD_LINES.items():
            text = w["en"][line]
            if line == "word":
                text = text + "."
            jobs.append((text, cfg, OUT / w["id"] / f"{line}.mp3"))
    if not only:
        for key, text in data["global"].items():
            jobs.append((text, GLOBAL_VOICE.get(key, TEACHER), OUT / "_global" / f"{key}.mp3"))

    sem = asyncio.Semaphore(6)
    stats = {"ok": 0, "cached": 0, "fail": 0}

    async def run(job):
        async with sem:
            try:
                stats[await synth(*job, a.force)] += 1
            except Exception as e:
                stats["fail"] += 1
                print("FAIL", e, flush=True)

    await asyncio.gather(*(run(j) for j in jobs))
    print("finished", stats, flush=True)


if __name__ == "__main__":
    asyncio.run(main())
