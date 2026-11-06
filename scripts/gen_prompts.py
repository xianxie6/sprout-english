"""Write the GPT image prompt sheet from content/words.json.

Usage: python3 scripts/gen_prompts.py
Output: prompts/GPT生图提示词.md

Each prompt = one shared STYLE block + one subject line, so all stickers match.
scripts/gen_images.py imports sticker_prompt / scene_prompt to generate them through Codex;
the sheet is for generating by hand in ChatGPT instead.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]

# Style D "童画线稿" (fine-line child's drawing), chosen 2026-10-29 after comparing four directions
# (art/style-compare-4.png). The outline spec copies the farm preview, whose thin warm-brown lines
# looked right; the first sticker test came out with heavy black coloring-book lines.
LINE = (
    "Thin, even outline in warm dark brown (#3A2E2A) around every shape, about 3-4 px at 1024 px, "
    "never thick, never pure black. "
)
STYLE = (
    "Naive children's-drawing style for toddlers, like a very simple 2D preschool cartoon. "
    "Flat solid colors only: absolutely no gradients, no shading, no highlights, no texture, no fur strokes, no stripes or patterns. "
    + LINE
    + "Very simple shapes and a clear, recognizable silhouette. Characters are chubby and round with the head almost as big as "
    "the body, shown from the front. Faces: small solid black bean eyes with one tiny white dot highlight, set wide apart, "
    "round soft-pink cheek circles, a single small curved line for the mouth; no whiskers, no eyebrows, no eyelashes. Only animals and people have faces: food, drinks and objects NEVER have eyes, cheeks or mouths. "
    "Bright, cheerful but soft colors: sky blue, grass green, sunny yellow, coral red, pink, warm cream. "
    "One single subject, centered, whole subject visible with a generous empty margin on all sides. "
    "Transparent background, no white sticker border, no ground shadow. "
    "Absolutely no text, letters, numbers, logos, watermarks, frames or extra objects."
)

SCENE_STYLE = (
    "Naive children's-drawing style for toddlers, like a very simple 2D preschool cartoon, wide landscape 3:2. "
    "Flat solid colors only: no gradients, no shading, no highlights, no texture. "
    + LINE
    + "Big calm areas of plain color, lots of empty space, uncluttered. "
    "No characters, no animals, no people, no food. No text, letters, numbers, logos or watermarks."
)
SCENE_EMPTY = (
    "The whole lower two-thirds is a wide, open, evenly colored area left completely empty, "
    "so characters can be placed on it later."
)


def sticker_prompt(word):
    return f"{STYLE}\n\nSubject: {word['art']}."


def scene_prompt(theme):
    return f"{SCENE_STYLE}\n\nScene: {theme['scene']}. {SCENE_EMPTY}"


def main():
    data = json.loads((ROOT / "content/words.json").read_text())
    themes = {t["id"]: t for t in data["themes"]}
    out = [
        "# 芽芽英语 · GPT 生图提示词（阶段 0 · 20 词）",
        "",
        "由 `scripts/gen_prompts.py` 从 `content/words.json` 生成，改内容后重新运行即可。",
        "",
        "## 怎么用",
        "",
        "0. **推荐直接自动生成**：`npm run images`（通过本机 Codex 生成缺的图，放进 `art/raw/`）。下面是手动在 ChatGPT 里生成的办法。",
        "1. 风格：D 童画线稿（细暖棕线、纯平涂、正面圆团子），对比见 `art/style-compare-4.png`。",
        "2. 每次把「统一风格段 + 这个词的那一行」整段粘进 ChatGPT。尺寸选**正方形 1024×1024**。",
        "3. 要**透明背景 PNG**。如果出来带底色，补一句 “Make the background transparent.”；还不行就接受纯色底，我的脚本会自动抠。",
        "4. 下载后按词命名放进 `art/raw/`：`cat.png`、`apple.png`……（大小写无所谓，jpg/webp 也行）。",
        "5. 放好后告诉我，我运行 `scripts/import_art.py` 验收、抠图、压缩、入库。",
        "",
        "## 统一风格段（每次都带上）",
        "",
        "```",
        STYLE,
        "```",
        "",
        "## 20 个贴纸",
        "",
    ]
    for theme_id in themes:
        t = themes[theme_id]
        out += [f"### {t['emoji']} {t['zh']}", "", "| 文件名 | 词 | 粘贴这一行 |", "| --- | --- | --- |"]
        for w in data["words"]:
            if w["theme"] == theme_id:
                out.append(f"| `{w['id']}.png` | {w['en']['word']} {w['zh']} | `Subject: {w['art']}.` |")
        out.append("")
    out += [
        "## 场景底图",
        "",
        "尺寸选**横版 1536×1024**。文件名 `scene-farm.png`、`scene-food.png`。",
        "",
        "```",
        SCENE_STYLE,
        "```",
        "",
    ]
    for t in data["themes"]:
        out.append(f"- `scene-{t['id']}.png`（{t['zh']}）：`Scene: {t['scene']}. {SCENE_EMPTY}`")
    out.append("")
    dst = ROOT / "prompts/GPT生图提示词.md"
    dst.parent.mkdir(exist_ok=True)
    dst.write_text("\n".join(out))
    print("wrote", dst.relative_to(ROOT))


if __name__ == "__main__":
    main()
