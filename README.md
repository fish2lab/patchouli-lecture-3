# 从 9 分到 90 分：笨蛋都能懂的学习公式（帕秋莉讲座 第 2 集）

「帕秋莉讲座」系列科普动画的第二集（第 1 集《我是帕秋莉，我来教你调理身体！》：<https://github.com/fish2lab/patchouli-lecture-1>，本仓库的引擎、画具和剪纸帕秋莉从那里沿用）。帕秋莉给考了 9 分的琪露诺讲一个学习模型：大脑一直在预测，预测错了就「惊讶」，按惊讶的大小修正自己（雷斯科拉-瓦格纳模型，和神经网络的 delta 规则很像）。注意、主动参与、错误反馈是这个模型的三个零件，巩固在模型外面。给中学生、大学生看，约 4 分钟。

- 知识来源：斯坦尼斯拉斯·迪昂《精准学习》，依据作者的读书划线（划线导出含原书摘录和个人笔记，没有放进公开仓库；`docs/方案.md` 里的「L行号」指那份导出），另补 Dunlosky 等 2013、Roediger & Karpicke 2006
- 目的、主线、台词和出处、取舍：`docs/方案.md`；工作包和接口：`docs/施工.md`；画风沿用 `docs/画风v2.md`
- 角色全部是 Canvas 代码画的剪纸人偶（帕秋莉、琪露诺），参考图不进构建产物

## 看片和开发

开发时直接打开 `index.html`（先 `npm run font` 下载字体到 `fonts/`）。`?scene=model` 只放一段，`?t=30` 从第 30 秒开始。段落：`opening` 开场、`model` 预测机、`pillars` 三根柱子、`consolidate` 巩固、`ending` 结尾。

全片两种编配：开场和结尾是第 1 集那本魔导书；中间三段是同一张「冰的网络」——输入、线（粗细是权重）、冰晶求和节点、预测牌和现实牌、沿线往回跑的红色「惊讶」火花。

```sh
npm install && npm run font
node tools/frames.mjs --scene model --grid 36   # 抽一段的联系表到 out/frames/
node tools/build.mjs                            # 单文件页面 → dist/index.html（需要 pip install fonttools brotli）
node tools/voice.mjs                            # 改了台词后重新合成油库里语音 → src/voice-data.js（需要 ffmpeg；帕秋莉 f1、琪露诺 f2）
node tools/render.mjs                           # 出片 → out/patchouli-lecture-2.mp4（需要 ffmpeg）
```

## 许可

- 代码：MIT。
- 字体：霞鹜文楷（SIL Open Font License，`fonts/LXGWWenKai-OFL.txt`）。
- 语音：AquesTalk（© 株式会社アクエスト），经 [aquestalk.js](https://github.com/y52en/aquestalk.js) 合成；仓库里只有合成出的声音，不含 AquesTalk 本体。拼音→假名表来自 [yukumo-js](https://github.com/yukumo-group/yukumo-js)（MIT）。
- 东方 Project 的角色版权归上海爱丽丝幻乐团（ZUN）。本片为同人科普作品。
