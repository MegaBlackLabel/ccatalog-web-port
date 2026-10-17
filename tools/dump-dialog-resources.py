#!/usr/bin/env python3
"""実物 ccatalog.exe のリソース (ダイアログ テンプレート) を一覧する。

Web 移植でダイアログのジオメトリとラベルを実物に合わせるための調査用。
PE の RT_DIALOG (DLGTEMPLATE / DIALOGEX) を読み、各ダイアログのタイトル・位置・
コントロール (id / クラス / style / 位置 / テキスト) を出す。

使い方:
    mise exec -- python tools/dump-dialog-resources.py [--exe <path>] [--dialog <id>]
"""
import argparse
import os
import struct

DEFAULT_EXES = [
    r"D:\develop\comiket\コミケット\カタログブラウザ96\.exe",
    r"D:\develop\comiket\解析\target\ccatalog.exe",
]

TYPE_NAMES = {
    1: "RT_CURSOR", 2: "RT_BITMAP", 3: "RT_ICON", 4: "RT_MENU", 5: "RT_DIALOG",
    6: "RT_STRING", 7: "RT_FONTDIR", 8: "RT_FONT", 9: "RT_ACCELERATOR",
    10: "RT_RCDATA", 11: "RT_MESSAGETABLE", 12: "RT_GROUP_CURSOR",
    14: "RT_GROUP_ICON", 16: "RT_VERSION", 24: "RT_MANIFEST", 137: "RT_TOOLBAR",
}


def load(exe):
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

    return data, rva2off, rva2off(rsrc_rva)


def walk(data, base, off, path=()):
    nnamed, nid = struct.unpack_from("<HH", data, off + 12)
    out = []
    for i in range(nnamed + nid):
        e = off + 16 + i * 8
        nameid, offset = struct.unpack_from("<II", data, e)
        ident = (nameid & 0x7FFFFFFF) if not (nameid & 0x80000000) else None
        child = base + (offset & 0x7FFFFFFF)
        if offset & 0x80000000:
            out += walk(data, base, child, path + (ident,))
        else:
            drva, dsize = struct.unpack_from("<II", data, child)
            out.append((path + (ident,), drva, dsize))
    return out


_ap = argparse.ArgumentParser()
_ap.add_argument("--exe", default=None)
_ap.add_argument("--dialog", type=int, default=None, help="この id のダイアログだけ出す")
_args = _ap.parse_args()
EXE = _args.exe or next((p for p in DEFAULT_EXES if os.path.exists(p)), None)
if EXE is None:
    raise SystemExit("ccatalog.exe が見つかりません。--exe で指定してください")
ONLY = _args.dialog

data, rva2off, base = load(EXE)
entries = walk(data, base, base)
by_type = {}
for path, drva, dsize in entries:
    by_type.setdefault(path[0], []).append((path, drva, dsize))

print("=== resource types ===")
for t in sorted(by_type, key=lambda x: (x is None, x)):
    name = TYPE_NAMES.get(t, "?")
    ids = sorted({p[1] for p, _, _ in by_type[t] if len(p) > 1})
    print(f"{t:>4} {name:<18} n={len(by_type[t]):<4} ids={ids[:40]}{' ...' if len(ids) > 40 else ''}")


def read_dlg_string(off, wide):
    if wide:
        out = []
        while True:
            ch = struct.unpack_from("<H", data, off)[0]
            off += 2
            if ch == 0:
                return "".join(out), off
            out.append(chr(ch))
    else:
        out = []
        while True:
            ch = data[off]
            off += 1
            if ch == 0:
                return "".join(out), off
            out.append(chr(ch))


def parse_dialog(off, size):
    """DLGTEMPLATE / DLGTEMPLATE 拡張版 (DIALOGEX) の両方を読む。"""
    dlgver, sig = struct.unpack_from("<HH", data, off)
    is_ex = dlgver == 1 and sig == 0xFFFF
    if is_ex:
        _helpid, _exstyle, style, cdit, x, y, cx, cy = struct.unpack_from("<IIIIhhhh", data, off + 4)
        p = off + 26
    else:
        style, _exstyle, cdit, x, y, cx, cy = struct.unpack_from("<IIHhhhh", data, off)
        p = off + 18

    def read_ord_or_str(pos):
        if struct.unpack_from("<H", data, pos)[0] == 0xFFFF:
            return struct.unpack_from("<H", data, pos + 2)[0], pos + 4
        return read_dlg_string(pos, True)

    _menu, p = read_ord_or_str(p)
    _cls, p = read_ord_or_str(p)
    title, p = read_dlg_string(p, True)
    if is_ex or (style & 0x40):  # DS_SETFONT
        _ptsz, _weight = struct.unpack_from("<HH", data, p)
        p += 4
        if is_ex:
            p += 2  # italic + charset
        else:
            _italic, _charset = struct.unpack_from("<BB", data, p)
            p += 2
        _typeface, p = read_dlg_string(p, True)
    p = (p + 3) & ~3

    controls = []
    for _ in range(cdit):
        if is_ex:
            _chelpid, _cex, cstyle, cx0, cy0, ccx, ccy, cid = struct.unpack_from(
                "<IIihhhhI", data, p)
            p += 24
        else:
            cstyle, _cex, cx0, cy0, ccx, ccy, cid = struct.unpack_from("<IIhhhhH", data, p)
            p += 18
        ccls, p = read_ord_or_str(p)
        ctext, p = read_ord_or_str(p)
        if struct.unpack_from("<H", data, p)[0] == 0xFFFF:
            _ord = struct.unpack_from("<H", data, p + 2)[0]
            p += 4
        extra = struct.unpack_from("<H", data, p)[0]
        p += 2 + extra
        p = (p + 3) & ~3
        controls.append({
            "id": cid, "class": ccls, "style": cstyle, "text": ctext,
            "pos": (cx0, cy0, ccx, ccy),
        })
        if p >= off + size:
            break
    return title, (x, y, cx, cy), controls, is_ex


print()
print("=== RT_DIALOG ===")
for path, drva, dsize in by_type.get(5, []):
    if ONLY is not None and path[1] != ONLY:
        continue
    off = rva2off(drva)
    try:
        title, box, controls, is_ex = parse_dialog(off, dsize)
    except Exception as exc:  # noqa: BLE001
        print(f"id={path[1]} size={dsize} parse-error {exc}")
        continue
    mark = "EX" if is_ex else "  "
    print(f"\n--- dialog id={path[1]} [{mark}] title={title!r} box={box} controls={len(controls)}")
    for c in controls:
        cls = c["class"] if isinstance(c["class"], str) else f"0x{c['class']:04x}"
        print(f"    id={c['id']:<6} class={cls:<12} style=0x{c['style']:08x} "
              f"pos={c['pos']} text={c['text']!r}")


print()
print("=== RT_BITMAP sizes ===")
for path, drva, dsize in sorted(by_type.get(2, []), key=lambda e: e[0][1]):
    off = rva2off(drva)
    hdrsize, w, h, planes, bpp, comp, size, _x, _y, clrused, _c = struct.unpack_from("<IiiHHIIiiII", data, off)
    print(f"  id={path[1]:<6} {w}x{h} bpp={bpp} hdrsize={hdrsize} bytes={dsize}")
