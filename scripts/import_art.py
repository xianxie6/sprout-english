"""Import hand-generated GPT images from art/raw/ into the app.

Usage: .venv/bin/python scripts/import_art.py
In:  art/raw/<id>.png|jpg|webp   (sticker per word; scene-<theme>.png for backgrounds)
     art/raw/house-<theme>.png    (the theme's little building on the home island, transparent)
     art/raw/island.png, garden-bg.png, night-bg.png (3:2 page backgrounds)
Out: public/pack/img/<id>.webp    (512px, transparent, trimmed and centered)
     public/pack/img/house-<theme>.webp (trimmed tight, bottom = ground line, max 512px)
     public/pack/img/<background>.webp  (1536px wide)
     art/review.png               (contact sheet on cream, to check by eye)

Images are language-agnostic: every language pack shares public/pack/img/.
If an image has no transparency, the flat background is removed by flood-filling
from the corners (the white sticker border stops the fill).
"""
import json
import pathlib

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / "art/raw"
OUT = ROOT / "public/pack/img"
SIZE = 512
PAD = 0.06  # margin around the trimmed sticker
SENTINEL = (255, 0, 254)


def has_transparency(im):
    if im.mode != "RGBA":
        return False
    lo, _ = im.getchannel("A").getextrema()
    return lo < 16


def cut_background(im, thresh=38):
    """Flood-fill the flat background from the four corners and make it transparent."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    for xy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if rgb.getpixel(xy) != SENTINEL:
            ImageDraw.floodfill(rgb, xy, SENTINEL, thresh=thresh)
    mask = Image.eval(
        Image.merge("RGB", [c.point(lambda v, t=t: 255 if v == t else 0) for c, t in zip(rgb.split(), SENTINEL)]).convert("L"),
        lambda v: 0 if v == 255 else 255,
    )
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


def fill_holes(im):
    """Make see-through blotches inside the subject opaque again.

    The generator's own background removal sometimes punches a soft hole into a body (the first fine-line
    cat had one on its forehead); the colors underneath are intact, only alpha is wrong. Background = the
    transparent area connected to the canvas edge; anything else that is not opaque gets alpha 255,
    except within 3 px of the background so the anti-aliased silhouette stays soft.
    """
    a = im.getchannel("A")
    clear = a.point(lambda v: 255 if v < 128 else 0)
    w, h = clear.size
    for xy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if clear.getpixel(xy) == 255:
            ImageDraw.floodfill(clear, xy, 128)
    outside = clear.point(lambda v: 255 if v == 128 else 0).filter(ImageFilter.MaxFilter(7))
    see_through = a.point(lambda v: 255 if v < 250 else 0)  # inner alpha is often 254, not 255
    # A real gap (between stem and grapes, between legs) stores black/empty color under alpha 0;
    # a punched hole keeps the body color. Only restore pixels that still carry color.
    colored = im.convert("L").point(lambda v: 255 if v > 40 else 0)
    inside = ImageChops.multiply(ImageChops.invert(outside), colored)
    holes = ImageChops.multiply(inside, see_through)
    n = holes.histogram()[255]
    im.putalpha(ImageChops.lighter(a, inside))
    return im, n


def square(im):
    box = im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    if not box:
        raise ValueError("image is empty after background removal")
    im = im.crop(box)
    side = int(max(im.size) * (1 + PAD * 2))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def tight(im, size=SIZE):
    """Trim to the subject and keep its aspect, so the bottom edge is the ground line."""
    box = im.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    im = im.crop(box)
    k = size / max(im.size)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)


def cutout(src, name, notes):
    im = Image.open(src)
    im.load()
    if has_transparency(im):
        im, holes = fill_holes(im.convert("RGBA"))
        if holes > 400:
            notes.append(f"{name}: 主体内部有 {holes} 个像素误抠成透明，已补回，请在 review.png 里确认")
        return im
    notes.append(f"{name}: 没有透明底，已自动抠图，请在 review.png 里确认边缘完整")
    return cut_background(im)


def background(src, name, notes):
    im = Image.open(src).convert("RGB")
    im = im.resize((1536, round(1536 * im.height / im.width)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", "WEBP", quality=82, method=6)
    notes.append(f"{name}: 已导入")


def find_raw(stem):
    for p in RAW.iterdir() if RAW.exists() else []:
        if p.stem.lower() == stem and p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"):
            return p
    return None


def main():
    data = json.loads((ROOT / "content/words.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    done, missing, notes = [], [], []
    for w in data["words"]:
        src = find_raw(w["id"])
        if not src:
            missing.append(w["id"])
            continue
        sq = square(cutout(src, w["id"], notes))
        sq.save(OUT / f"{w['id']}.webp", "WEBP", quality=86, method=6)
        done.append((w, sq))
    for t in data["themes"]:
        src = find_raw(f"scene-{t['id']}")
        if src:
            background(src, f"scene-{t['id']}", notes)
        src = find_raw(f"house-{t['id']}")
        if src:
            tight(cutout(src, f"house-{t['id']}", notes)).save(OUT / f"house-{t['id']}.webp", "WEBP", quality=86, method=6)
            notes.append(f"house-{t['id']}: 已导入")
    for name in ("island", "garden-bg", "night-bg"):
        src = find_raw(name)
        if src:
            background(src, name, notes)

    if done:
        cols = 5
        cell = 220
        rows = (len(done) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cell, rows * (cell + 30)), (255, 248, 236))
        draw = ImageDraw.Draw(sheet)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf", 20)
        except OSError:
            font = ImageFont.load_default()
        for i, (w, sq) in enumerate(done):
            x, y = (i % cols) * cell, (i // cols) * (cell + 30)
            thumb = sq.resize((cell - 20, cell - 20), Image.LANCZOS)
            sheet.paste(thumb, (x + 10, y + 10), thumb)
            draw.text((x + cell / 2, y + cell + 8), w["en"]["word"], fill=(74, 59, 99), font=font, anchor="mt")
        (ROOT / "art").mkdir(exist_ok=True)
        sheet.save(ROOT / "art/review.png")

    print(f"imported {len(done)}/{len(data['words'])}")
    for n in notes:
        print(" ·", n)
    if missing:
        print("missing:", ", ".join(missing))


if __name__ == "__main__":
    main()
