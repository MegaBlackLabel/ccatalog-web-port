#!/usr/bin/env python3
"""実物の会場マップ PNG を SVG に変換する (2 値化 + 矩形ベクター化)。

元実装の地図画像は 2 値に近い線画 (例: GNR1W12 はほぼ白 + 薄い灰色の線) なので、
しきい値で 2 値化してから矩形のパスにする。`viewBox` は元画像の実寸なので、
アプリ側が机のセルを `xpos`/`ypos` (元画像のピクセル座標) で置いてもずれない。

使い方:
    mise exec -- python tools/gen-map-svg.py [--source-dir <MDATA>] [--out-dir public/maps]

既定の元画像 (ComiketMap: 地図 1=西12 W12 / 2=西34 W34 / 3=南12 S12 / 4=南34 S34):
    4 面ともユーザー提供の高解像度版 (HMP*) を 1/2 縮尺で使う (DB の w2/h2 = 2 x w1/h1)。
    W12 <- HMP1W12.PNG / W34 <- HMP1W34.PNG / S12 <- HMP1S12.PNG / S34 <- HMP1S34.PNG
"""

import argparse
import os

# name: (元画像, 縮尺)。縮尺は DB (ComiketMap) の印刷範囲の座標に合わせるための係数で、
# viewBox は「元画像の実寸 x 縮尺」= DB の印刷範囲 (実測値) になる。
MAP_SOURCES = {
    # 4 面とも DB の高解像度側 (ComiketMap の x2/y2/w2/h2 = 低解像度のちょうど 2 倍) を
    # 1/2 縮尺で使う。机のセルの xpos/ypos は低解像度側 (w1/h1) の座標なので、
    # viewBox を 1/2 にした実寸 (= w1/h1) にすると情報量を保ったまま重なる。
    "W12": ("HMP1W12.PNG", 0.5),
    "W34": ("HMP1W34.PNG", 0.5),
    "S12": ("HMP1S12.PNG", 0.5),
    "S34": ("HMP1S34.PNG", 0.5),
}

DEFAULT_SOURCE_DIR = r"D:\develop\comiket\コミケット\カタログブラウザ96\CM96\MDATA"
THRESHOLD = 200  # これより暗い画素を線とみなす


def rectangles(pixels, width, height, threshold=THRESHOLD):
    """しきい値で 2 値化し、同じ列範囲が縦に続く分を 1 つの矩形にまとめる。

    potrace (純 Python 実装) は 1000x800 級で数分かかるため、線画向けに
    ランレングスの矩形でベクター化する。地図はほぼ 2 値なので見た目は十分。
    """
    ink = [[px < threshold for px in row] for row in pixels]
    rects = []
    # 直前の行のランの (x0, x1) → 開始 y
    active = {}
    for y in range(height):
        row = ink[y]
        runs = {}
        x = 0
        while x < width:
            if not row[x]:
                x += 1
                continue
            x1 = x
            while x1 + 1 < width and row[x1 + 1]:
                x1 += 1
            runs[(x, x1)] = y
            x = x1 + 1
        # 前の行から続いているランはそのまま、消えたランは矩形を確定
        for key, y0 in list(active.items()):
            if key not in runs:
                rects.append((key[0], y0, key[1] - key[0] + 1, y - y0))
                del active[key]
        for key in runs:
            if key not in active:
                active[key] = y
    for key, y0 in active.items():
        rects.append((key[0], y0, key[1] - key[0] + 1, height - y0))
    return rects


def trace_to_svg(pixels, width, height, scale=1.0, ink="#202020"):
    """矩形の集まりを SVG にする (shape-rendering は既定のまま = 拡大しても滑らか)。

    scale は元画像の画素を DB の印刷範囲の座標へ移す係数 (等倍なら 1.0)。
    viewBox も同じ係数で縮めるので、机のセルの xpos/ypos (DB の座標) と重なる。
    """
    rects = rectangles(pixels, width, height)
    view_w, view_h = round(width * scale), round(height * scale)
    # 座標は縮尺を掛けた実数 (0.5 刻み) のまま出す。整数に丸めないので、拡大しても
    # 線が階段状にならない (shape-rendering も既定のまま = 斜めはアンチエイリアス)。
    d = "".join(
        f"M{x * scale:g} {y * scale:g}h{w * scale:g}v{h2 * scale:g}h{-w * scale:g}z"
        for x, y, w, h2 in rects
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w} {view_h}" '
        f'width="{view_w}" height="{view_h}">'
        f'<rect width="{view_w}" height="{view_h}" fill="#ffffff"/>'
        f'<path d="{d}" fill="{ink}" />'
        f"</svg>"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source-dir", default=DEFAULT_SOURCE_DIR)
    ap.add_argument("--out-dir", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "maps"))
    args = ap.parse_args()

    from PIL import Image

    out_dir = os.path.normpath(args.out_dir)
    os.makedirs(out_dir, exist_ok=True)
    for name, (source, scale) in MAP_SOURCES.items():
        path = os.path.join(args.source_dir, source)
        if not os.path.exists(path):
            print(f"skip {name}: {source} がありません ({args.source_dir})")
            continue
        image = Image.open(path).convert("L")
        width, height = image.size
        pixels = list(image.getdata())
        rows = [pixels[y * width:(y + 1) * width] for y in range(height)]
        svg = trace_to_svg(rows, width, height, scale)
        out = os.path.join(out_dir, f"{name}.svg")
        with open(out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(svg)
        print(
            f"{name}.svg <- {source} ({width}x{height} x{scale:g}"
            f" -> {round(width * scale)}x{round(height * scale)}, {len(svg) // 1024} KB)"
        )


if __name__ == "__main__":
    main()
