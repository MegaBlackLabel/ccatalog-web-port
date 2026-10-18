"""ccatalog.chm (元実装のヘルプ) を取り出して Web 版の公開資産にする。

入力: D:/develop/comiket/コミケット/カタログブラウザ96/ccatalog.chm
出力: public/help/**  (トピックの HTML / 画像 / COMMON.CSS / ccatalog.hhc / ccatalog.hhk / search-index.json)

手順:
1. CHM を ASCII の一時パスへコピーし、hh.exe -decompile で展開する (日本語パスだと hh.exe が失敗する)
2. CP932 のテキスト (HTML / CSS / hhc / hhk) を UTF-8 にし、文字コードの宣言を足す
   (元の HTML は charset を宣言していないため、そのままだとブラウザが化ける)
3. 検索 (キーワード検索) 用の索引を JSON で書き出す (トピックのタイトル / 見出し / 本文テキスト)

出力は生成物。手で編集しない (ヘルプの中身を変えるなら元の CHM を差し替えて再生成する)。
"""

import json
import os
import re
import shutil
import subprocess
import tempfile

CHM = r"D:\develop\comiket\コミケット\カタログブラウザ96\ccatalog.chm"
OUT = r"D:\develop\comiket\ccatalog-web-port\public\help"
# スクロールバー (トピック パネルの中は別の文書なので、元の CSS では 98 風にならない)。
# ライブラリが持つ 98.css のスクロールバー規則を取り出して、トピックから読ませる。
LIBRARY_CSS = r"D:\develop\comiket\ccatalog-web-port\node_modules\@megablacklabel\react98retro\dist\style.css"

TEXT_EXT = {".htm", ".html", ".css", ".hhc", ".hhk"}


def decompile(work_dir):
    """CHM を work_dir へ展開して、展開先を返す。"""
    chm_copy = os.path.join(work_dir, "ccatalog.chm")
    shutil.copyfile(CHM, chm_copy)
    out_dir = os.path.join(work_dir, "out")
    os.makedirs(out_dir, exist_ok=True)
    # hh.exe -decompile <展開先> <CHM>
    subprocess.run(
        ["hh.exe", "-decompile", out_dir, chm_copy],
        check=True,
        cwd=work_dir,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )
    return out_dir


def decode_text(raw):
    """CHM のテキスト (CP932) を str にする。行区切りに NEL (0x85) が混ざるので LF に直す。"""
    text = raw.decode("cp932", errors="replace")
    return text.replace("\r\n", "\n").replace("\x85", "\n")


def scrollbar_css():
    """ライブラリ (98.css) のスクロールバー規則を、単体で使える CSS にする。"""
    css = open(LIBRARY_CSS, encoding="utf-8").read()
    rules = re.findall(r"\.win98\s+(::-webkit-scrollbar[^{]*)\{([^}]*)\}", css)
    lines = [
        "/* HTML Help ビューアのスクロールバー (トピック パネルの中は別の文書なので、",
        "   アプリの CSS が届かない)。規則は react98retro (98.css) のスクロールバーから取る。",
        "   生成: tools/gen-help-assets.py — 手で編集しない。 */",
        "",
    ]
    for selector, body in rules:
        # 元の規則は ".win98 ::-webkit-scrollbar..." なので、単体で使えるよう接頭辞を外す。
        lines.append("%s{%s}" % (selector.replace(".win98 ", "").strip(), body.replace(".win98 ", "")))
    return "\n".join(lines) + "\n"


def with_charset(html):
    """charset の宣言が無い HTML に UTF-8 の宣言を足す (元の宣言があれば差し替える)。"""
    if re.search(r"charset\s*=", html, re.IGNORECASE):
        html = re.sub(
            r"charset\s*=\s*[\w-]+", "charset=utf-8", html, flags=re.IGNORECASE, count=1
        )
    else:
        html = re.sub(r"(<head[^>]*>)", r'\1\n<meta charset="utf-8">', html, count=1, flags=re.IGNORECASE)
    # トピックの中のスクロールバーも 98 風にする (ビューアの見た目)。
    return re.sub(
        r"(<head[^>]*>)",
        r'\1\n<link rel="stylesheet" type="text/css" href="./../help-scrollbars.css">',
        html,
        count=1,
        flags=re.IGNORECASE,
    )


def strip_tags(html):
    """トピックの本文テキスト (タグを外して空白を詰めたもの)。検索の索引に使う。"""
    body = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", html)
    body = re.sub(r"(?s)<[^>]+>", " ", body)
    body = body.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    return re.sub(r"\s+", " ", body).strip()


def topic_title(html, fallback):
    """トピックの見出し (Title 要素 → h1 の順に拾う)。"""
    for pattern in (r"(?is)<title[^>]*>(.*?)</title>", r"(?is)<h1[^>]*>(.*?)</h1>"):
        found = re.search(pattern, html)
        if found:
            title = strip_tags(found.group(1))
            if title:
                return title
    return fallback


def main():
    with tempfile.TemporaryDirectory() as work_dir:
        source = decompile(work_dir)
        if os.path.isdir(OUT):
            shutil.rmtree(OUT)
        index = []
        topics = 0
        for root, _dirs, files in os.walk(source):
            rel_dir = os.path.relpath(root, source)
            target_dir = OUT if rel_dir == "." else os.path.join(OUT, rel_dir)
            os.makedirs(target_dir, exist_ok=True)
            for name in sorted(files):
                src = os.path.join(root, name)
                dst = os.path.join(target_dir, name)
                ext = os.path.splitext(name)[1].lower()
                if ext not in TEXT_EXT:
                    shutil.copyfile(src, dst)  # 画像などはそのまま
                    continue
                html = decode_text(open(src, "rb").read())
                if ext in {".htm", ".html"}:
                    html = with_charset(html)
                open(dst, "w", encoding="utf-8", newline="\n").write(html)
                if ext in {".htm", ".html"} and rel_dir != ".":
                    topics += 1
                    ref = os.path.join(rel_dir, name).replace("\\", "/")
                    headings = [
                        strip_tags(m.group(1))
                        for m in re.finditer(r"(?is)<h[12][^>]*>(.*?)</h[12]>", html)
                    ]
                    index.append(
                        {
                            "path": ref,
                            "title": topic_title(html, name),
                            "headings": [h for h in headings if h],
                            "text": strip_tags(html),
                        }
                    )
        open(os.path.join(OUT, "help-scrollbars.css"), "w", encoding="utf-8", newline="\n").write(
            scrollbar_css()
        )
        open(os.path.join(OUT, "search-index.json"), "w", encoding="utf-8", newline="\n").write(
            json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n"
        )
        images = len(os.listdir(os.path.join(OUT, "IMAGES")))
        print("wrote %s (%d topics, %d images)" % (OUT, topics, images))


if __name__ == "__main__":
    main()
