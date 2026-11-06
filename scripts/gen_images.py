"""Generate missing art through the local Codex CLI (its built-in image tool, on the user's ChatGPT plan).

Usage: .venv/bin/python scripts/gen_images.py [--only cat,apple,scene-farm] [--force] [--batch 3] [--workers 3]
Out:   art/raw/<id>.png (stickers, 1024 square, transparent) and art/raw/scene-<theme>.png (1536x1024)
Then:  npm run art   (import, trim, compress, contact sheet)

Prompts come from scripts/gen_prompts.py so the hand-made sheet and this script never drift apart.
"""
import argparse
import concurrent.futures as cf
import json
import pathlib
import subprocess

from gen_prompts import scene_prompt, sticker_prompt

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "art/raw"
CODEX = "/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex"


def jobs(data, only, force):
    out = []
    for w in data["words"]:
        out.append((w["id"], "square 1024x1024 with a genuinely transparent background", sticker_prompt(w)))
    for t in data["themes"]:
        out.append((f"scene-{t['id']}", "landscape 1536x1024, opaque (NOT transparent)", scene_prompt(t)))
    if only:
        out = [j for j in out if j[0] in only]
    if not force:
        out = [j for j in out if not (RAW / f"{j[0]}.png").exists()]
    return out


def run_batch(batch):
    lines = [
        f"Use your image generation tool to create {len(batch)} separate images, one call per image, "
        "and copy each resulting PNG to the given path, overwriting it if present. "
        "Use each prompt exactly as given. Do nothing else and do not edit any other files.",
    ]
    for i, (key, spec, prompt) in enumerate(batch, 1):
        lines.append(f"\n{i}) art/raw/{key}.png — {spec}. Prompt:\n{prompt}")
    # codex exec sometimes hangs without producing anything; time out per image and retry what's missing.
    for attempt in range(2):
        todo = [k for k, _, _ in batch if not (RAW / f"{k}.png").exists()]
        if not todo:
            break
        try:
            r = subprocess.run(
                [CODEX, "exec", "--skip-git-repo-check", "--ephemeral", "-s", "workspace-write", "-C", str(ROOT), "\n".join(lines)],
                capture_output=True, text=True, timeout=360 * len(batch),
            )
            if r.returncode != 0:
                print("codex exit", r.returncode, r.stderr[-300:], flush=True)
        except subprocess.TimeoutExpired:
            print(f"codex hung on {', '.join(todo)}; " + ("retrying" if attempt == 0 else "giving up"), flush=True)
    return [k for k, _, _ in batch if (RAW / f"{k}.png").exists()]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--batch", type=int, default=3)
    ap.add_argument("--workers", type=int, default=3)
    a = ap.parse_args()
    data = json.loads((ROOT / "content/words.json").read_text())
    only = {x for x in a.only.split(",") if x}
    todo = jobs(data, only, a.force)
    if not todo:
        print("nothing to generate")
        return
    if a.force:
        for k, _, _ in todo:
            (RAW / f"{k}.png").unlink(missing_ok=True)
    RAW.mkdir(parents=True, exist_ok=True)
    batches = [todo[i : i + a.batch] for i in range(0, len(todo), a.batch)]
    print(f"generating {len(todo)} images in {len(batches)} Codex calls", flush=True)
    done = []
    with cf.ThreadPoolExecutor(a.workers) as ex:
        for made in ex.map(run_batch, batches):
            done += made
            print("saved:", ", ".join(made) or "(none)", flush=True)
    missing = [k for k, _, _ in todo if k not in done]
    print(f"finished {len(done)}/{len(todo)}" + (f" · missing: {', '.join(missing)}" if missing else ""))


if __name__ == "__main__":
    main()
