"""Compile content/words.json + media into the app's language pack.

Usage: .venv/bin/python scripts/build.py
Out:   public/pack/en/index.json

`media` is a bit flag per word, like Word Atlas: 1 sticker image, 2 full audio set.
The app falls back to the emoji placeholder when the image bit is missing.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
PACK = ROOT / "public/pack"
LINES = ("word", "intro", "say", "find", "found", "that", "bye")


def main():
    data = json.loads((ROOT / "content/words.json").read_text())
    words, problems = [], []
    for w in data["words"]:
        media = 0
        if (PACK / "img" / f"{w['id']}.webp").exists():
            media |= 1
        lacking = [k for k in LINES if not (PACK / "en/audio" / w["id"] / f"{k}.mp3").exists()]
        if not lacking:
            media |= 2
        else:
            problems.append(f"{w['id']}: missing audio {lacking}")
        words.append({
            "id": w["id"], "theme": w["theme"], "zh": w["zh"], "emoji": w["emoji"],
            "en": w["en"], "media": media, "tip": w.get("tip", ""),
        })
    img = lambda name: (PACK / "img" / f"{name}.webp").exists()
    themes = [{**t, "scene": img(f"scene-{t['id']}"), "house": img(f"house-{t['id']}")} for t in data["themes"]]
    decor = {k: img(f) for k, f in (("island", "island"), ("garden", "garden-bg"), ("night", "night-bg"))}
    for k in data["global"]:
        if not (PACK / "en/audio/_global" / f"{k}.mp3").exists():
            problems.append(f"global: missing audio {k}")
    index = {"lang": "en", "themes": themes, "decor": decor, "words": words, "global": list(data["global"])}
    (PACK / "en").mkdir(parents=True, exist_ok=True)
    (PACK / "en/index.json").write_text(json.dumps(index, ensure_ascii=False))
    imgs = sum(1 for w in words if w["media"] & 1)
    print(f"built {len(words)} words · {imgs} images · {sum(1 for w in words if w['media'] & 2)} full audio sets")
    for p in problems:
        print(" !", p)


if __name__ == "__main__":
    main()
