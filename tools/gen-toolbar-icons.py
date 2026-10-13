#!/usr/bin/env python3
"""実物 ccatalog.exe のツールバーアイコンを取り出して SVG (data URI) にする。

元実装のツールバーは MFC のビットマップ (16x15 / 4bpp のストリップ) でアイコンを持っている。
このスクリプトは PE の RT_BITMAP を読み、1 ボタンぶん (16x15) を 1 スロットとして
「同じ色の横方向の連続を 1 本の矩形にする」方式で SVG 化し、
`src/ui/main/toolbar-icons.ts` (data URI の定数) を生成する。

使い方:
    mise exec -- python tools/gen-toolbar-icons.py [--exe <path>]

既定の exe は DVD-ROM カタログブラウザのインストール先 (.exe)。無い場合は
`解析/target/ccatalog.exe` に落ちる。再生成したら `git diff` で差分 (アイコンの形) を確認すること。
"""

import argparse
import base64
import os
import struct

DEFAULT_EXES = [
    r"D:\develop\comiket\コミケット\カタログブラウザ96\.exe",
    r"D:\develop\comiket\解析\target\ccatalog.exe",
]

OUT_TS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "ui", "main", "toolbar-icons.ts")

RT_BITMAP = 2
TOOLBAR_BITMAP_ID = 130  # 22 ボタンのメインストリップ (368x15)
# 「チェックリストから外す」だけはストリップに無い (実行時に作られるボタン)。
# 実機キャプチャのチェックツールバー右端のボタン (× 印) をそのまま切り出す。
SHOT = r"D:\develop\comiket\解析\ui_capture\3-コミックマーケット カタロム - 新規チェックリスト.png"
SHOT_ICONS = {
    # name: (x, y, w, h) — 実測: × 印は x 846..866 / y 56..71 あたり
    "checkRemove": (845, 56, 16, 15),
}
PALETTE_BITMAP_ID = 184  # 「色編集」のパレットアイコン (17x16)
SLOT_W, SLOT_H = 16, 15
BG = (192, 192, 192)  # ツールバーの背景 (透過にする)

# ストリップのスロット番号 (1 始まり) → このアプリのボタン名。
# RT_TOOLBAR 137 のヒント文字列 (解析/UI-SPEC.md §4) と実測の並びに対応する。
SLOTS = {
    1: "zoomOut",
    2: "zoomIn",
    3: "fitWidth",
    4: "fitHeight",
    5: "actualSize",
    6: "antiAlias",
    7: "pagePrev",
    8: "pageNext",
    9: "checklistOpen",
    10: "checklistSave",
    11: "preferences",
    12: "checklistAppend",
    13: "print",
    14: "search",
    15: "newChecklist",
    16: "about",
    # 17/18 はヒント文字列が空。実物のチェックツールバーで使われる「チェックから外す」相当
    # と見て 18 を採用 (推測。17 は赤いペン風)。
    18: "checkRemove",
    19: "printOrder",
    20: "listLock",
    21: "goBack",
    22: "goForward",
}


def read_bitmaps(exe):
    data = open(exe, "rb").read()
    pe = struct.unpack_from("<I", data, 0x3C)[0]
    coff = pe + 4
    nsec = struct.unpack_from("<H", data, coff + 2)[0]
    optsz = struct.unpack_from("<H", data, coff + 16)[0]
    opt = coff + 20
    magic = struct.unpack_from("<H", data, opt)[0]
    ddoff = opt + (96 if magic == 0x10B else 112)
    rsrc_rva, _ = struct.unpack_from("<II", data, ddoff + 2 * 8)
    sections = []
    for i in range(nsec):
        o = opt + optsz + i * 40
        vsz, va, rsz, ptr = struct.unpack_from("<IIII", data, o + 8)
        sections.append((va, vsz, ptr, rsz))

    def rva2off(r):
        for va, vsz, ptr, rsz in sections:
            if va <= r < va + max(vsz, rsz):
                return ptr + (r - va)
        raise ValueError(f"rva {r:#x} not mapped")

    base = rva2off(rsrc_rva)

    def walk(off, path=()):
        nnamed, nid = struct.unpack_from("<HH", data, off + 12)
        out = []
        for i in range(nnamed + nid):
            e = off + 16 + i * 8
            nameid, offset = struct.unpack_from("<II", data, e)
            ident = (nameid & 0x7FFFFFFF) if not (nameid & 0x80000000) else None
            child = base + (offset & 0x7FFFFFFF)
            if offset & 0x80000000:
                out += walk(child, path + (ident,))
            else:
                drva, dsize = struct.unpack_from("<II", data, child)
                out.append((path + (ident,), drva, dsize))
        return out

    return data, rva2off, {p[1]: (drva, dsize) for p, drva, dsize in walk(base) if p[0] == RT_BITMAP}


def load_dib(data, rva2off, drva, dsize):
    off = rva2off(drva)
    raw = data[off:off + dsize]
    hdrsize, w, h, _planes, bpp, _comp, _size, _x, _y, clrused, _clrimp = struct.unpack_from("<IiiHHIIiiII", raw, 0)
    nclr = clrused or (1 << bpp)
    pal_raw = raw[hdrsize:hdrsize + nclr * 4]
    palette = [tuple(pal_raw[i * 4:i * 4 + 3][::-1]) for i in range(nclr)]
    pix = raw[hdrsize + nclr * 4:]
    stride = ((w * bpp + 31) // 32) * 4
    rows = []
    for y in range(h):
        row = pix[y * stride:(y + 1) * stride]
        line = []
        for x in range(w):
            if bpp == 4:
                v = (row[x // 2] >> (0 if x % 2 else 4)) & 0xF
            elif bpp == 8:
                v = row[x]
            elif bpp == 1:
                v = (row[x // 8] >> (7 - x % 8)) & 1
            else:
                v = 0
            line.append(palette[v] if v < len(palette) else (0, 0, 0))
        rows.append(line)
    return rows[::-1]  # DIB は下から上


def svg_for(rows, x0, y0, w, h):
    """1 スロットを SVG にする (同じ色の横ランを矩形 1 本ずつ)。"""
    runs = {}
    for y in range(h):
        x = 0
        while x < w:
            c = rows[y0 + y][x0 + x]
            if c == BG:
                x += 1
                continue
            x2 = x
            while x2 + 1 < w and rows[y0 + y][x0 + x2 + 1] == c:
                x2 += 1
            runs.setdefault(c, []).append((x, y, x2 - x + 1))
            x = x2 + 1
    parts = []
    for color, rects in sorted(runs.items()):
        d = "".join(f"M{x} {y}h{width}v1h-{width}z" for x, y, width in rects)
        parts.append(f'<path fill="#{color[0]:02x}{color[1]:02x}{color[2]:02x}" d="{d}"/>')
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        f'shape-rendering="crispEdges">{"".join(parts)}</svg>'
    )


def data_uri(svg):
    """SVG は base64 で包む (属性値のなかで引用符や # を気にしなくて済む)。"""
    return "data:image/svg+xml;base64," + base64.b64encode(svg.encode("utf-8")).decode("ascii")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--exe", default=None)
    args = ap.parse_args()
    exe = args.exe or next((p for p in DEFAULT_EXES if os.path.exists(p)), None)
    if exe is None:
        raise SystemExit("ccatalog.exe が見つかりません。--exe で指定してください")
    print("exe:", exe)
    data, rva2off, bmps = read_bitmaps(exe)

    strip = load_dib(data, rva2off, *bmps[TOOLBAR_BITMAP_ID])
    strip_h = len(strip)
    strip_w = len(strip[0])
    print(f"toolbar strip {strip_w}x{strip_h} = {strip_w // SLOT_W} slots")
    icons = {}
    for slot, name in sorted(SLOTS.items()):
        x0 = (slot - 1) * SLOT_W
        if x0 + SLOT_W > strip_w:
            continue
        icons[name] = data_uri(svg_for(strip, x0, 0, SLOT_W, strip_h))
    # 「色編集」のパレットアイコン (RT_BITMAP 184)。
    pal = load_dib(data, rva2off, *bmps[PALETTE_BITMAP_ID])
    icons["colorEdit"] = data_uri(svg_for(pal, 0, 0, min(16, len(pal[0])), min(16, len(pal))))

    # 実機キャプチャから切り出すアイコン (ストリップに無いもの)。
    if os.path.exists(SHOT):
        from PIL import Image
        shot = Image.open(SHOT).convert("RGB")
        spx = shot.load()
        for name, (sx, sy, sw, sh) in SHOT_ICONS.items():
            rows = [[spx[sx + x, sy + y] for x in range(sw)] for y in range(sh)]
            # キャプチャの背景 (240,240,240) も透過にする
            flat = []
            for row in rows:
                flat.append([(192, 192, 192) if c == (240, 240, 240) else c for c in row])
            icons[name] = data_uri(svg_for(flat, 0, 0, sw, sh))

    lines = [
        "/**",
        " * 元実装 (ccatalog.exe) のツールバーアイコンを PE の RT_BITMAP から SVG 化したもの。",
        " * 生成: tools/gen-toolbar-icons.py (手で編集しない)。",
        f" * 元: {os.path.basename(exe)} の RT_BITMAP {TOOLBAR_BITMAP_ID} (16x15 x {strip_w // SLOT_W}) と {PALETTE_BITMAP_ID}。",
        " * 形は 1px 単位でそのまま (shape-rendering: crispEdges)、背景の silver は透過。",
        " */",
        "export const TOOLBAR_ICONS = {",
    ]
    for name in sorted(icons):
        lines.append(f"  {name}: '{icons[name]}',")
    lines.append("} as const;")
    lines.append("")
    lines.append("export type ToolbarIconName = keyof typeof TOOLBAR_ICONS;")
    lines.append("")
    out = os.path.normpath(OUT_TS)
    open(out, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
    total = sum(len(v) for v in icons.values())
    print(f"wrote {out}: {len(icons)} icons, {total // 1024} KB")


if __name__ == "__main__":
    main()
