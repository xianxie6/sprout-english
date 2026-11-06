"""Redraw the 4-clearing island, attaching the old 2-clearing island as a style reference (codex -i)."""
import subprocess, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gen_images import CODEX, ROOT, RAW
from gen_prompts import LINE
prompt = (
 "Use your image generation tool to create ONE image and save it to art/raw/island.png (landscape 1536x1024, opaque), overwriting it. "
 "Do nothing else and do not edit any other files.\n\n"
 "The attached image is the style reference: redraw the SAME island in the SAME style, palette, line weight and level of detail "
 "(soft warm-brown thin outlines, muted friendly sea blue with small wave lines, sandy beach rim around the island, rocks at the shore, "
 "lots of small round bushes and lollipop trees, tiny flowers, a pond with lily pads, soft cream sandy winding paths). "
 "Flat solid colors, no gradients, no text. " + LINE +
 "Change only the layout: the island now has FIVE flat empty grass clearings outlined by sandy paths: four medium clearings as a 2x2 grid "
 "(upper-left, upper-right, lower-left, lower-right) and one larger clearing in the middle between them, all connected by winding paths. "
 "Every clearing is completely empty — no buildings, houses, barns, characters or objects. Keep a sea margin around the island like the reference.")
out = RAW / "island.png"; out.unlink(missing_ok=True)
for a in range(2):
    try:
        subprocess.run([CODEX, "exec", "--skip-git-repo-check", "--ephemeral", "-s", "workspace-write", "-C", str(ROOT),
                        "-i", str(RAW / "old/island-2spots.png"), prompt], capture_output=True, text=True, timeout=480)
    except subprocess.TimeoutExpired:
        print("hung", flush=True)
    if out.exists(): break
print("ok" if out.exists() else "missing")
