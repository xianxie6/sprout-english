"""Check every voice clip by speech recognition and diff against content/words.json.

Usage: NO_PROXY="*" HF_HUB_OFFLINE=1 <python with mlx_whisper> scripts/check_audio.py .
(needs a Python env with mlx-whisper installed; Apple Silicon only.)
Expected harmless diffs: "Where's" for "Where is", ba/baa, nay/neigh, an/and.
"""
import json, pathlib, re, sys, mlx_whisper
root = pathlib.Path(sys.argv[1])
data = json.loads((root/"content/words.json").read_text())
jobs = []
for w in data["words"]:
    for k in ("word","intro","say","find","found","that","bye"):
        jobs.append((w["en"][k], root/f"public/pack/en/audio/{w['id']}/{k}.mp3"))
for k,v in data["global"].items():
    jobs.append((v, root/f"public/pack/en/audio/_global/{k}.mp3"))
norm = lambda s: re.sub(r"[^a-z ]","",s.lower().replace("-"," ")).split()
bad = 0
for text, p in jobs:
    r = mlx_whisper.transcribe(str(p), path_or_hf_repo="mlx-community/whisper-large-v3-turbo", language="en")["text"].strip()
    if norm(r) != norm(text):
        bad += 1; print(f"DIFF {p.parent.name}/{p.stem}: want={text!r} got={r!r}")
print("checked", len(jobs), "diffs", bad)
