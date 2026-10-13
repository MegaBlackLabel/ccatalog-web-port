"""ccatalog.exe のメニューリソース (RT_MENU 128) から src/ui/menu/menu-defs.ts を生成する。

入力: D:/develop/comiket/解析/ui.json  (ui_spec.py が .exe をパースして出力したもの)
出力: src/ui/menu/menu-defs.ts
"""

import json
import os
import re

UI_JSON = r"D:\develop\comiket\解析\ui.json"
OUT = r"D:\develop\comiket\ccatalog-web-port\src\ui\menu\menu-defs.ts"

MENU_ID = "128"

# 「ダミー」は MFC が動的に差し替えるプレースホルダ (実体は実行時に 日付/ホール/ブロック/ジャンル
# などの一覧が入る)。Web 版では無効項目として出す。
DUMMY_COMMANDS = {32809, 32810, 32811, 32812, 32835, 32820}

ui = json.load(open(UI_JSON, encoding="utf-8"))
tree = ui["menus"][MENU_ID]


def clean(text):
    """'新規作成(&N)\tCtrl+N' -> ('新規作成(N)', 'Ctrl+N')"""
    label, _, shortcut = text.partition("\t")
    label = label.replace("&", "")
    return label, shortcut or None


def convert(items):
    out = []
    for it in items:
        label, shortcut = clean(it["text"])
        if it["id"] is None:  # submenu
            out.append(
                {
                    "type": "submenu",
                    "label": label,
                    "items": convert(it["items"]),
                    "disabled": bool(it["flags"] & 1),
                }
            )
            continue
        if it["id"] == 0 and label == "":
            out.append({"type": "separator"})
            continue
        entry = {"type": "item", "label": label, "command": it["id"]}
        if shortcut:
            entry["shortcut"] = shortcut
        if it["flags"] & 1 or it["id"] in DUMMY_COMMANDS:
            entry["disabled"] = True
        if it["flags"] & 8:  # MF_CHECKED
            entry["checked"] = True
        out.append(entry)
    return out


menus = []
for top in tree:
    label, _ = clean(top["text"])
    menus.append({"label": label, "items": convert(top["items"])})


def ts_string(value):
    escaped = value.replace("\\", "\\\\").replace("'", "\\'")
    return "'" + escaped + "'"


def ts(obj, indent=0):
    pad = "  " * indent
    if isinstance(obj, dict):
        parts = []
        for k, v in obj.items():
            key = k if re.fullmatch(r"[A-Za-z_$][\w$]*", k) else ts_string(k)
            parts.append(f"{'  ' * (indent + 1)}{key}: {ts(v, indent + 1)}")
        return "{\n" + ",\n".join(parts) + f"\n{pad}}}"
    if isinstance(obj, list):
        if not obj:
            return "[]"
        inner = ",\n".join(f"{'  ' * (indent + 1)}{ts(v, indent + 1)}" for v in obj)
        return "[\n" + inner + f"\n{pad}]"
    if isinstance(obj, str):
        return ts_string(obj)
    return json.dumps(obj)


body = ts(menus)

head = '''// メインメニュー定義。ccatalog.exe の RT_MENU リソース 128 から生成したものをそのまま持つ。
// 生成: tools/gen-menu-defs.py  (元データ: 解析/ui.json ← ui_spec.py が PE をパース)
// 手で編集しない。

export type CatalogMenuItem =
  | {
      type: 'item';
      /** 元実装の WM_COMMAND メニュー ID。 */
      command: number;
      label: string;
      shortcut?: string;
      disabled?: boolean;
      checked?: boolean;
    }
  | { type: 'separator' }
  | { type: 'submenu'; label: string; items: CatalogMenuItem[]; disabled?: boolean };

export type CatalogMenu = { label: string; items: CatalogMenuItem[] };

/** ファイル / 表示 / ページ移動 / ブックマーク / チェックリスト / 検索 / ウィンドウ / ヘルプ */
export const CCATALOG_MENUS: CatalogMenu[] = '''

tail = ''';

/** メニュー ID (元実装の WM_COMMAND) のうち、Web 版でも意味を持つもの。 */
export const MENU_COMMANDS = {
  newChecklist: 32818,
  openChecklist: 32793,
  appendChecklist: 32795,
  saveChecklist: 32794,
  saveChecklistAs: 32819,
  print: 32771,
  preferences: 32780,
  switchComiket: 32829,
  search: 32801,
  searchQuick: 32799,
  googleSearch: 32831,
  googleSearchConfig: 32836,
  printDetails: 32823,
  imageOutput: 32866,
  circleData: 32828,
  imageData: 32827,
  databaseInit: 32858,
  netUpdate: 32856,
  fileUpdate: 32857,
  importCircleMs: 32870,
  exportCircleMs: 32871,
  bookmarkAdd: 32824,
  bookmarkOrganize: 32825,
  memoEdit: 32860,
  zoomOut: 32787,
  zoomIn: 32788,
  fitWidth: 32791,
  fitHeight: 32790,
  fitAll: 32814,
  actualSize: 32789,
  pagePrev: 32774,
  pageNext: 32775,
  gotoPage: 32803,
  back: 32845,
  forward: 32846,
  exit: 57665,
  about: 57664,
} as const;
'''

os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, "w", encoding="utf-8").write(head + body + tail)
count = sum(1 for m in menus for _ in m["items"])
print("wrote %s (%d menus, %d top-level items)" % (OUT, len(menus), count))
