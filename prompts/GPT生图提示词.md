# 芽芽英语 · GPT 生图提示词（阶段 0 · 20 词）

由 `scripts/gen_prompts.py` 从 `content/words.json` 生成，改内容后重新运行即可。

## 怎么用

0. **推荐直接自动生成**：`npm run images`（通过本机 Codex 生成缺的图，放进 `art/raw/`）。下面是手动在 ChatGPT 里生成的办法。
1. 风格：D 童画线稿（细暖棕线、纯平涂、正面圆团子），对比见 `art/style-compare-4.png`。
2. 每次把「统一风格段 + 这个词的那一行」整段粘进 ChatGPT。尺寸选**正方形 1024×1024**。
3. 要**透明背景 PNG**。如果出来带底色，补一句 “Make the background transparent.”；还不行就接受纯色底，我的脚本会自动抠。
4. 下载后按词命名放进 `art/raw/`：`cat.png`、`apple.png`……（大小写无所谓，jpg/webp 也行）。
5. 放好后告诉我，我运行 `scripts/import_art.py` 验收、抠图、压缩、入库。

## 统一风格段（每次都带上）

```
Naive children's-drawing style for toddlers, like a very simple 2D preschool cartoon. Flat solid colors only: absolutely no gradients, no shading, no highlights, no texture, no fur strokes, no stripes or patterns. Thin, even outline in warm dark brown (#3A2E2A) around every shape, about 3-4 px at 1024 px, never thick, never pure black. Very simple shapes and a clear, recognizable silhouette. Characters are chubby and round with the head almost as big as the body, shown from the front. Faces: small solid black bean eyes with one tiny white dot highlight, set wide apart, round soft-pink cheek circles, a single small curved line for the mouth; no whiskers, no eyebrows, no eyelashes. Only animals and people have faces: food, drinks and objects NEVER have eyes, cheeks or mouths. Bright, cheerful but soft colors: sky blue, grass green, sunny yellow, coral red, pink, warm cream. One single subject, centered, whole subject visible with a generous empty margin on all sides. Transparent background, no white sticker border, no ground shadow. Absolutely no text, letters, numbers, logos, watermarks, frames or extra objects.
```

## 20 个贴纸

### 🐮 动物农场

| 文件名 | 词 | 粘贴这一行 |
| --- | --- | --- |
| `cat.png` | cat 猫 | `Subject: a chubby orange kitten sitting, waving one paw, tail curled up beside it, head almost as big as its body.` |
| `dog.png` | dog 狗 | `Subject: a round brown-and-cream puppy with floppy ears, sitting, small pink tongue out happily.` |
| `cow.png` | cow 奶牛 | `Subject: a chubby white cow with a few round black patches, pink muzzle, two tiny horns, standing.` |
| `pig.png` | pig 小猪 | `Subject: a round pink pig seen from the front, small round snout in the middle of its face, tiny ears, curly tail, standing.` |
| `duck.png` | duck 鸭子 | `Subject: a round yellow duckling with an orange beak and orange feet, little wings slightly raised.` |
| `chicken.png` | chicken 母鸡 | `Subject: a round white hen with a red comb, small yellow beak and short orange legs, standing.` |
| `sheep.png` | sheep 绵羊 | `Subject: a round sheep with a puffy cloud-shaped white wool body, cream face and little dark legs, standing.` |
| `horse.png` | horse 马 | `Subject: a chubby brown pony with a cream mane, standing on four short legs, seen from the front.` |
| `rabbit.png` | rabbit 兔子 | `Subject: a round white bunny with long pink-lined ears, sitting and holding a tiny carrot.` |
| `mouse.png` | mouse 老鼠 | `Subject: a small round gray mouse with big round pink ears and a thin curly tail, sitting.` |

### 🍎 好吃的

| 文件名 | 词 | 粘贴这一行 |
| --- | --- | --- |
| `apple.png` | apple 苹果 | `Subject: a round red apple with a short brown stem and one green leaf, no face.` |
| `banana.png` | banana 香蕉 | `Subject: a single curved yellow banana, half peeled, no face.` |
| `orange.png` | orange 橙子 | `Subject: a round orange fruit with a tiny green leaf on top, next to one orange slice, no face.` |
| `grapes.png` | grapes 葡萄 | `Subject: a bunch of round purple grapes with a small green stem and leaf, no face.` |
| `milk.png` | milk 牛奶 | `Subject: a rounded glass of white milk with a little milk splash on top, no face.` |
| `water.png` | water 水 | `Subject: a rounded clear glass of light blue water with two bubbles and a water drop beside it, no face.` |
| `bread.png` | bread 面包 | `Subject: a puffy loaf of golden-brown bread with one slice beside it, no face.` |
| `egg.png` | egg 鸡蛋 | `Subject: one white egg standing next to a sunny-side-up fried egg, no face.` |
| `cake.png` | cake 蛋糕 | `Subject: a round two-layer birthday cake with pink frosting, a cherry on top and one candle, no face.` |
| `cookie.png` | cookie 饼干 | `Subject: a big round golden cookie with chocolate chips, one small bite taken out, no face.` |

## 场景底图

尺寸选**横版 1536×1024**。文件名 `scene-farm.png`、`scene-food.png`。

```
Naive children's-drawing style for toddlers, like a very simple 2D preschool cartoon, wide landscape 3:2. Flat solid colors only: no gradients, no shading, no highlights, no texture. Thin, even outline in warm dark brown (#3A2E2A) around every shape, about 3-4 px at 1024 px, never thick, never pure black. Big calm areas of plain color, lots of empty space, uncluttered. No characters, no animals, no people, no food. No text, letters, numbers, logos or watermarks.
```

- `scene-farm.png`（动物农场）：`Scene: a sunny farm: a big plain sky-blue sky with two flat white rounded clouds and a simple yellow sun, wide soft green rolling hills as flat bands of color, a few lollipop trees, a small simple red barn with a short fence at the far left edge. The whole lower two-thirds is a wide, open, evenly colored area left completely empty, so characters can be placed on it later.`
- `scene-food.png`（好吃的）：`Scene: a cozy kitchen: a pale yellow wall with a round window showing blue sky, a few simple pastel cabinets and a hanging lamp at the top, a long light wooden table across the bottom third. The whole lower two-thirds is a wide, open, evenly colored area left completely empty, so characters can be placed on it later.`
