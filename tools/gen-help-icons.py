"""HTML Help ビューア (hhctrl.ocx) のツールバー アイコンを、実機の画面から切り出して
`src/ui/help/help-icons.ts` にする。

入力: D:/develop/comiket/解析/ui_capture/help/help_win3.png (実機のヘルプ ウィンドウ 480x360 の取り込み)
出力: src/ui/help/help-icons.ts

元実装のヘルプは OS の HTML Help ビューア (hhctrl.ocx) を開く。ビューアのアイコンは
hhctrl.ocx の資源にあり ccatalog.exe には入っていないので、実機のウィンドウを取り込んだ
画像から、ツールバーの各ボタンのアイコンをそのまま切り出す (色も形も元のまま)。

- 非表示 (ナビゲーション パネルを隠す): アイコン + 文字
- 戻る / 進む: 同じ矢印の左右反転 (実機も反転した対のアイコンを使う)
- 印刷 / オプション(Q)

進む は実機の起動直後は出ていない (戻る履歴が無い) ため、戻る のアイコンを反転して使う。
戻る / 進む には「使えないときは薄くする」を当てるので、有効時のアイコンは実測の
グレー版より少し濃くしてある (実機の有効時は黒い矢印)。
"""

import os
import re

from PIL import Image

SHOT = r"D:\develop\comiket\解析\ui_capture\help\help_win3.png"
OUT = r"D:\develop\comiket\ccatalog-web-port\src\ui\help\help-icons.ts"
SHOT_DIR = r"D:\develop\comiket\ccatalog-web-port\tmp\help-icons"

# ツールバーのアイコンのある行 (実測) と、ボタンごとの x 範囲 (実測)。
ICON_ROWS = (31, 55)
BUTTONS = {
    "hide": (32, 51),
    "back": (103, 117),
    "print": (170, 189),
    "options": (239, 258),
}


def icon_box(px, x_range):
    """ボタンの x 範囲から、アイコンのバウンディング ボックスを求める。"""
    def ink(x, y):
        r, g, b = px[x, y]
        return not (abs(r - 240) <= 12 and abs(g - 240) <= 12 and abs(b - 240) <= 12)

    xs = [x for x in range(x_range[0] - 4, x_range[1] + 5) if any(ink(x, y) for y in range(*ICON_ROWS))]
    ys = [y for y in range(*ICON_ROWS) if any(ink(x, y) for x in range(x_range[0] - 4, x_range[1] + 5))]
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def darken(image):
    """実測のグレーの矢印を、有効時のアイコン (黒) にする。白は残す。"""
    out = image.copy()
    px = out.load()
    for y in range(out.size[1]):
        for x in range(out.size[0]):
            r, g, b = px[x, y]
            if max(r, g, b) > 225:
                continue  # 背景と白ハイライト
            px[x, y] = (0, 0, 0)
    return out


def main():
    shot = Image.open(SHOT).convert("RGB")
    px = shot.load()
    icons = {}
    os.makedirs(SHOT_DIR, exist_ok=True)
    for name, x_range in BUTTONS.items():
        crop = shot.crop(icon_box(px, x_range))
        crop.save(os.path.join(SHOT_DIR, f"{name}.png"))
        icons[name] = crop
    icons["back"] = darken(icons["back"])
    icons["forward"] = icons["back"].transpose(Image.FLIP_LEFT_RIGHT)
    icons["show"] = icons["hide"].transpose(Image.FLIP_LEFT_RIGHT)

    lines = [
        "// HTML Help ビューア (hhctrl.ocx) のツールバー アイコン。実機のヘルプ ウィンドウの",
        "// 取り込み画像から切り出したものを data URI で持つ。",
        "// 生成: tools/gen-help-icons.py  (手で編集しない)",
        "",
        "export const HELP_ICONS = {",
    ]
    for name in ("hide", "show", "back", "forward", "print", "options"):
        saved = os.path.join(SHOT_DIR, f"{name}.png")
        icons[name].save(saved)
        import base64

        encoded = base64.b64encode(open(saved, "rb").read()).decode("ascii")
        lines.append(f"  /** {name} */")
        lines.append(f"  {name}: 'data:image/png;base64,{encoded}',")
    lines.append("} as const;")
    lines.append("")
    lines.append("export type HelpIconName = keyof typeof HELP_ICONS;")
    lines.append("")
    open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
    print("wrote %s (%d icons)" % (OUT, len(icons)))


if __name__ == "__main__":
    main()
