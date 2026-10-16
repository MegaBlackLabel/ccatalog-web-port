#!/usr/bin/env python3
"""実物 ccatalog.exe の「印刷」ダイアログのアイコンを SVG (data URI) にする。

印刷部数グループの左下にある絵 (「3」の紙 + 「1」の紙) は PE のリソース
(RT_BITMAP / RT_GROUP_ICON) には無く、実行時に描かれるため、CHM マニュアルの実写
(`解析/chm_out/IMAGES/PRINT1.PNG`) から切り出して SVG 化する。切り出しは
gen-toolbar-icons.py の SHOT_ICONS と同じやり方。

使い方:
    mise exec -- python tools/gen-print-icons.py

再生成したら `git diff` で差分 (アイコンの形) を確認すること。
"""

import base64
import os

from PIL import Image

OUT_TS = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "src", "ui", "print", "print-icons.ts"
)

# 実写 (CHM マニュアル)。印刷ダイアログの全体が 508x471。
SHOT = r"D:\develop\comiket\解析\chm_out\IMAGES\PRINT1.PNG"
# 印刷部数グループの左下の絵。実測: x 294..334 / y 212..246 (40x34)。
COPIES_BOX = (294, 212, 334, 246)
# 切り出す絵の背景 (ダイアログの面色)。透過にする。
SHOT_BG = (212, 208, 200)


def svg_for(rows, w, h, bg):
    """同じ色の矩形にまとめて SVG にする (縦にも伸ばせるだけ伸ばす)。"""
    used = [[False] * w for _ in range(h)]
    runs = {}
    for y in range(h):
        for x in range(w):
            if used[y][x]:
                continue
            c = rows[y][x]
            used[y][x] = True
            if c == bg:
                continue
            x2 = x
            while x2 + 1 < w and not used[y][x2 + 1] and rows[y][x2 + 1] == c:
                x2 += 1
                used[y][x2] = True
            y2 = y
            while y2 + 1 < h and all(
                not used[y2 + 1][xx] and rows[y2 + 1][xx] == c for xx in range(x, x2 + 1)
            ):
                y2 += 1
                for xx in range(x, x2 + 1):
                    used[y2][xx] = True
            runs.setdefault(c, []).append((x, y, x2 - x + 1, y2 - y + 1))
    parts = []
    for color, rects in sorted(runs.items()):
        d = "".join(f"M{x} {y}h{wd}v{ht}h-{wd}z" for x, y, wd, ht in rects)
        parts.append(f'<path fill="#{color[0]:02x}{color[1]:02x}{color[2]:02x}" d="{d}"/>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'shape-rendering="crispEdges">{"".join(parts)}</svg>'
    )


def data_uri(svg):
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode("utf-8")).decode("ascii")


def main():
    if not os.path.exists(SHOT):
        raise SystemExit(f"実写が見つかりません: {SHOT}")
    im = Image.open(SHOT).convert("RGB")
    px = im.load()
    x0, y0, x1, y1 = COPIES_BOX
    rows = [[px[x0 + x, y0 + y] for x in range(x1 - x0)] for y in range(y1 - y0)]
    # 実写の背景は (212,208,200) ぴったりとは限らないので、いちばん多い色を背景にする
    counts = {}
    for row in rows:
        for c in row:
            counts[c] = counts.get(c, 0) + 1
    bg = max(counts, key=counts.get)
    icons = {"copies": data_uri(svg_for(rows, x1 - x0, y1 - y0, bg))}
    print(f"shot: {SHOT} box={COPIES_BOX} bg={bg}")

    lines = [
        "/**",
        " * 元実装 (ccatalog.exe) の「印刷」ダイアログのアイコンを SVG 化したもの。",
        " * 生成: tools/gen-print-icons.py (手で編集しない)。",
        " * 印刷部数グループの絵 (「3」の紙 + 「1」の紙) はリソースに無く実行時に描かれるため、",
        " * CHM マニュアルの実写から切り出している (40x34)。",
        " * 形は 1px 単位でそのまま (shape-rendering: crispEdges)、背景の面色は透過。",
        " */",
        "export const PRINT_ICONS = {",
    ]
    for name in sorted(icons):
        lines.append(f"  {name}: '{icons[name]}',")
    lines.append("} as const;")
    lines.append("")
    lines.append("export type PrintIconName = keyof typeof PRINT_ICONS;")
    lines.append("")
    out = os.path.normpath(OUT_TS)
    open(out, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
    total = sum(len(v) for v in icons.values())
    print(f"wrote {out}: {len(icons)} icons, {total // 1024} KB")


if __name__ == "__main__":
    main()
