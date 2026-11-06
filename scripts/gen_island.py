"""One-off: island with 4 house clearings + house-zoo / house-toys, via Codex (same pipeline as gen_images)."""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gen_images import run_batch, RAW
from gen_prompts import LINE

REF = ""
FLAT = "Naive children's-drawing style for toddlers, flat solid colors only, no gradients, no shading, no texture. " + LINE + "No text, letters, numbers, logos or watermarks. "
island = (FLAT + REF + " A small round green island seen from above at a slight angle, surrounded by calm blue sea, wide landscape 3:2. "
  "Soft sandy paths connect FIVE completely empty, flat, evenly green oval clearings: four medium clearings arranged as a 2x2 grid "
  "(upper-left, upper-right, lower-left, lower-right) and one big clearing exactly in the center between them. "
  "All clearings are left totally empty: no buildings, no houses, no characters, no animals, no objects on them. "
  "Round lollipop trees, little bushes and a few tiny flowers only around the outer edge of the island; a small pond at one edge. "
  "Keep about 8% empty sea margin around the island, and keep the four corners of the picture plain sea.")
house = lambda what: (FLAT + REF + f" One single small cute building: {what}. Front view, slightly from above, standing on a small flat patch of grass. "
  "Transparent background, no ground shadow, whole building visible with margin.")
jobs = [
  ("island", "landscape 1536x1024, opaque (NOT transparent)", island),
  ("house-zoo", "square 1024x1024 with a genuinely transparent background", house("a little zoo gate: a round-topped wooden arch gate in sunny yellow and coral, with a tiny round leafy bush on each side, no sign text, no animals")),
  ("house-toys", "square 1024x1024 with a genuinely transparent background", house("a little toy shop shaped like an open toy box house: sky-blue walls, pink striped awning, a round window showing a tiny ball and a teddy silhouette, no text")),
]
for k, _, _ in jobs: (RAW / f"{k}.png").unlink(missing_ok=True)
for j in jobs: print("saved:", run_batch([j]), flush=True)
