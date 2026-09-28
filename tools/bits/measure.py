"""逐字量「要付多少比特」：用一个开源 base 语言模型给文本打分，输出每个字的 −log₂p 和下一个字的候选分布。

  tools/bits/.venv/bin/python tools/bits/measure.py --text "我是最强的！"            # 打印 JSON
  tools/bits/.venv/bin/python tools/bits/measure.py --build                          # 重算 data/bits/*.json 和 src/bits-data.js

一个 token 盖住几个字时，这个 token 的比特数按字均分（JSON 里记下 token 边界）。
top 是「看到这个字之前」模型给下一个 token 的前 8 名，按 token 首字合并。
"""
import argparse, gzip, json, lzma, math, os, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODEL = os.environ.get('BITS_MODEL', 'Qwen/Qwen3-1.7B-Base')
LN2 = math.log(2)
_M = {}


def model():
    if not _M:
        from mlx_lm import load
        _M['m'], _M['tok'] = load(MODEL)
    return _M['m'], _M['tok']


def score(text, topk=8):
    import mlx.core as mx
    m, tok = model()
    bos = tok.bos_token_id if tok.bos_token_id is not None else tok.eos_token_id
    ids = tok.encode(text, add_special_tokens=False)
    logits = m(mx.array([[bos] + ids]))[0].astype(mx.float32)
    logp = logits - mx.logsumexp(logits, axis=-1, keepdims=True)
    lp = logp.tolist()
    chars, bits, top, toks = [], [], [], []
    for i, t in enumerate(ids):
        piece = tok.decode(ids[:i + 1])[len(tok.decode(ids[:i])):]
        b = -lp[i][t] / LN2
        row = lp[i]
        best = sorted(range(len(row)), key=row.__getitem__, reverse=True)[:40]
        merged = Counter()
        for j in best:
            s = tok.decode([j])
            s = s.strip() or s
            if s and '�' not in s:
                merged[s[0]] += math.exp(row[j])
        cand = [[k, round(v, 4)] for k, v in merged.most_common(topk)]
        toks.append({'text': piece, 'bits': round(b, 3)})
        n = max(1, len(piece))
        for k, ch in enumerate(piece or '?'):
            chars.append(ch)
            bits.append(round(b / n, 3))
            top.append(cand if k == 0 else [])
    return {'text': text, 'chars': chars, 'bits': bits, 'top': top, 'tokens': toks,
            'total': round(sum(bits), 2), 'perChar': round(sum(bits) / max(1, len(chars)), 3), 'model': MODEL}


def long_bits(text, win=1024):
    """长文本按 token 窗口滚动打分（每窗前一半作上下文），返回总比特。"""
    import mlx.core as mx
    m, tok = model()
    ids = tok.encode(text, add_special_tokens=False)
    bos = tok.bos_token_id if tok.bos_token_id is not None else tok.eos_token_id
    total, pos, ctx = 0.0, 0, win // 2
    while pos < len(ids):
        start = max(0, pos - ctx)
        seg = [bos] + ids[start:pos + (win - (pos - start))]
        logits = m(mx.array([seg]))[0].astype(mx.float32)
        logp = logits - mx.logsumexp(logits, axis=-1, keepdims=True)
        end = min(len(ids), start + len(seg) - 1)
        for i in range(pos, end):
            total += -logp[i - start, ids[i]].item() / LN2
        pos = end
    return total


def dial(text):
    n = len(text)
    cnt = Counter(text)
    zero = -sum(c / n * math.log2(c / n) for c in cnt.values())
    raw = text.encode('utf-8')
    out = {
        'chars': n,
        'utf8': round(len(raw) * 8 / n, 2),
        'gbk': round(len(text.encode('gbk', errors='replace')) * 8 / n, 2),
        'zero': round(zero, 2),
        'gzip': round(len(gzip.compress(raw, 9)) * 8 / n, 2),
        'xz': round(len(lzma.compress(raw, preset=9 | lzma.PRESET_EXTREME)) * 8 / n, 2),
    }
    mb = long_bits(text)
    out['model'] = round(mb / n, 2)
    out['arith'] = round((math.ceil(mb) + 2) / n, 2)   # 算术编码上界：总码长 ≤ ⌈Σ−log₂p⌉ + 2
    return out


LINES = ['我是最强的！', '床前明月光，疑是地上霜。', '今天的晚饭是冰冻青蛙！']
PREFIX = ['床前明月光，疑是地上', '今天的晚饭是冰冻']


def build():
    d = os.path.join(ROOT, 'data', 'bits')
    old = open(os.path.join(d, 'guxiang.txt'), encoding='utf-8').read().strip()
    new = open(os.path.join(d, 'new.txt'), encoding='utf-8').read().strip()
    dl = {'model': MODEL, 'guxiang': dial(old), 'new': dial(new)}
    lines = {t: score(t) for t in LINES}
    nxt = {}
    for p in PREFIX:
        r = score(p + '。')
        nxt[p] = r['top'][len(p)] if len(r['top']) > len(p) else []
    json.dump(dl, open(os.path.join(d, 'dial.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump({'lines': lines, 'next': nxt}, open(os.path.join(d, 'lines.json'), 'w'), ensure_ascii=False, indent=1)
    js = {'model': MODEL, 'dial': {'old': dl['guxiang'], 'new': dl['new']},
          'lines': {t: {k: lines[t][k] for k in ('chars', 'bits', 'top', 'total')} for t in LINES}, 'next': nxt}
    with open(os.path.join(ROOT, 'src', 'bits-data.js'), 'w', encoding='utf-8') as f:
        f.write("'use strict';\n// 由 tools/bits/measure.py --build 生成，不要手改。本机开源 base 模型逐字量出的比特数，见 data/bits/README.md。\n")
        f.write('const BITS = ' + json.dumps(js, ensure_ascii=False) + ';\n')
    print(json.dumps(dl, ensure_ascii=False, indent=1))
    for t in LINES:
        print(t, list(zip(lines[t]['chars'], lines[t]['bits'])), lines[t]['total'])
    print(json.dumps(nxt, ensure_ascii=False))


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--text')
    ap.add_argument('--build', action='store_true')
    a = ap.parse_args()
    if a.build:
        build()
    elif a.text:
        print(json.dumps(score(a.text), ensure_ascii=False))
    else:
        ap.print_help(); sys.exit(1)
