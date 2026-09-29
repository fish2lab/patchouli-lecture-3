# 「我是最强的」只值 1 比特：用信息论看人脑和大模型（帕秋莉讲座 第 3 集）

「帕秋莉讲座」系列科普动画的第三集。第 1 集《我是帕秋莉，我来教你调理身体！》：<https://github.com/fish2lab/patchouli-lecture-1>；第 2 集《从 9 分到 90 分：笨蛋都能懂的学习公式》：<https://github.com/fish2lab/patchouli-lecture-2>，本仓库的引擎、画具和两个剪纸角色从那里沿用。

琪露诺要把三百道错题全背下来，帕秋莉从一个猜字游戏讲起：猜得到的字不用说，猜不到的部分才是信息；信息可以数出来，猜中它要问几次「是不是」，一次就是 1 比特；猜得越准，要记的越少，预测就是压缩，大模型训练时练的也正是猜下一个字。人脑也在压缩：象棋大师记的是套路，棋子一乱摆，他就和新手差不多。给没有基础的中学生、大学生看，约 4 分半。

- 知识来源：斯坦尼斯拉斯·迪昂《精准学习》，依据作者的读书划线（划线导出含原书摘录和个人笔记，没有放进公开仓库）；另补 Shannon 1948、Cowan 2001、Chase & Simon 1973、Gobet & Simon 1996、Bisra 等 2018。出处表在 `docs/方案.md`
- 片中的比特数是用开源模型 Qwen3-1.7B-Base 在本机实测的：脚本 `tools/bits/measure.py`，数据和说明在 `data/bits/`
- 可视化借鉴 3Blue1Brown《Compression is Intelligence》系列（码字空间、下一个字的概率条），改成剪纸魔导书的做法
- 目的、主线、台词、取舍和被否掉的方案：`docs/方案.md`；工作包和接口：`docs/施工.md`；画风沿用 `docs/画风v2.md`；发布文案：`docs/发布.md`
- 角色全部是 Canvas 代码画的剪纸人偶（帕秋莉、琪露诺），参考图不进构建产物

## 看片和开发

开发时直接打开 `index.html`（先 `npm run font` 下载字体到 `fonts/`）。`?scene=bits` 只放一段，`?t=30` 从第 30 秒开始。段落：`opening` 开场、`guess` 猜字、`bits` 比特、`compress` 预测就是压缩、`brain` 人脑、`how` 怎么压、`ending` 结尾。

全片的主物件是八音盒打孔纸带，一个孔就是 1 比特（`src/tape.js`，还有证据蜡封 `seal`）；样张在 `tape.html`。

```sh
npm install && npm run font
node tools/frames.mjs --scene bits --grid 24    # 抽一段的联系表到 out/frames/
node tools/overlap.mjs --scene bits             # 穿模检查：不画人物渲染，报出人物包围框里有道具或字的时间段
node tools/build.mjs                            # 单文件页面 → dist/index.html（需要 pip install fonttools brotli）
node tools/voice.mjs                            # 改了台词后重新合成油库里语音 → src/voice-data.js（需要 ffmpeg；帕秋莉 f1、琪露诺 f2）
node tools/render.mjs                           # 出片 → out/patchouli-lecture-3.mp4（需要 ffmpeg）
node tools/cover.mjs                            # 封面 → out/cover/（16:9 和 4:3）

# 重测比特数（Apple Silicon，mlx-lm）
uv venv tools/bits/.venv --python 3.12 && uv pip install --python tools/bits/.venv/bin/python mlx-lm
tools/bits/.venv/bin/python tools/bits/measure.py --build   # → data/bits/*.json、src/bits-data.js
```

## 许可

- 代码：MIT。
- 字体：霞鹜文楷（SIL Open Font License，`fonts/LXGWWenKai-OFL.txt`）。
- `data/bits/guxiang.txt`：鲁迅《故乡》，公有领域，取自中文维基文库。
- 语音：AquesTalk（© 株式会社アクエスト），经 [aquestalk.js](https://github.com/y52en/aquestalk.js) 合成；仓库里只有合成出的声音，不含 AquesTalk 本体。拼音→假名表来自 [yukumo-js](https://github.com/yukumo-group/yukumo-js)（MIT）。
- 东方 Project 的角色版权归上海爱丽丝幻乐团（ZUN）。本片为同人科普作品。
