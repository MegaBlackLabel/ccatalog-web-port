"""開発用のダミーカタログ（データ + 画像）を生成する。

構造 (info / dates / maps / areas / blocks / genres と机の座標) は、実物の
ccatalog96.db を復号して TSV に落としたファイルからそのまま読む。ダミーなのは
サークル名・執筆者名などの個人データと、カット/マップの画像だけ。

出力:
  src/data/fixtures/dummy-catalog.json   … CatalogData
                                           (info / dates / areas / blocks / genres / circles / layouts / maps)
  public/cuts/<circleId>.png             … サークルカットのダミー画像 (105x150 / 16 色)
  public/maps/<filename>.png             … 会場マップのダミー画像 (実物の印刷サイズ)

使い方: mise exec -- python tools/gen-dummy-data.py [--source-dir <実物 TSV のディレクトリ>]
"""

import argparse
import collections
import json
import os
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_JSON = os.path.join(ROOT, "src", "data", "fixtures", "dummy-catalog.json")
CUT_DIR = os.path.join(ROOT, "public", "cuts")
MAP_DIR = os.path.join(ROOT, "public", "maps")

# 実物 DB (復号済み) を TSV に落としたディレクトリ。構造テーブルはここから読む。
DEFAULT_SOURCE_DIR = r"D:\develop\comiket\解析\sqlite2\out\raw-cp932"

# 実物のカット枠 (枠と区切り線だけの 2 値画像)。カットの幾何はここから実測する。
CUT_TEMPLATE = os.path.join(ROOT, "tools", "cut-template.png")

# カット画像の寸法。実物の高解像度カット (`CM96/C096CUTH.CCZ` の `NNNN.PNG`) と同じ 211x300。
# 実物は 105x150 (低解像度 `C096CUTL.CCZ`) と 211x300 の 2 種類を持ち、一覧は 178x253 に
# 縮小して表示する。ダミーは高解像度版と同じ寸法で作る。
CUT_IMAGE_W, CUT_IMAGE_H = 211, 300

# 実物のカットは 105x150 の設計空間で描かれている (枠・文字・絵の寸法はすべてこの空間の値)。
# 211x300 の画像でも見え方が実物と同じになるよう、設計値の 2 倍で描く。
DESIGN_W, DESIGN_H = 105, 150
SCALE_X = CUT_IMAGE_W / DESIGN_W
SCALE_Y = CUT_IMAGE_H / DESIGN_H

# 実物の低解像度カット (解析/recuts/103747.PNG など) が使っている 16 段のグレー。
# 実物のカットは 2 値ではなく、この 16 階調でイラストの濃淡を作っている。
CUT_GRAY_LEVELS = [0, 40, 68, 88, 112, 130, 145, 160, 177, 188, 199, 210, 219, 229, 238, 255]


def _quantize_cut(image):
    """カット画像を実物と同じ 16 段のグレーに丸める (パレットも 16 色)。"""
    levels = CUT_GRAY_LEVELS
    index_of = {level: i for i, level in enumerate(levels)}
    # 元の値 (0..255) を、そのままパレットのインデックス (0..15) に写す変換表。
    table = [index_of[min(levels, key=lambda level: abs(level - value))] for value in range(256)]
    indexed = image.convert('L').point(table).convert('P')
    indexed.putpalette([v for level in levels for v in (level, level, level)])
    return indexed


def _shade(draw, box, base, spread, seed):
    """絵の範囲に、id から決まる淡いグラデーションを敷く。

    実物のカットは白地ではなく、うっすらした濃淡の上にイラストが乗っている
    (実測のインク量: 白 24〜53% / 黒 13〜27% / グレー 28〜54%)。
    """
    x0, y0, x1, y1 = box
    step = _design(3, SCALE_Y)
    for i, y in enumerate(range(int(y0), int(y1), step)):
        # 上下で明るさを変え、id ごとに位相をずらす。
        phase = ((i + seed) % 8) / 7
        level = base + int(spread * (1 - abs(phase * 2 - 1)))
        draw.rectangle([x0, y, x1, min(y1, y + step)], fill=min(255, level))


def _design(value, scale):
    """105x150 の設計値を画像の画素に写す (最低 1px)。"""
    return max(1, round(value * scale))


# 見出し帯に焼き込むサークル名の文字 (設計: グリフ 14px → フォント 17px 相当)。
HEADING_FONT_SIZE = _design(17, SCALE_Y)
# 机 (ComiketLayout) の座標は実物と同じ 10px ピッチ。机 1 つ分の大きさは info.mapSizeW/H。
DESK_PITCH = 10
# 地区の印刷範囲の内側に机を置くときの左右の余白と、机を並べ始める上端 (地図名と地区名のぶん)。
DESK_MARGIN = 5
DESK_TOP = 40
# ブロック 1 つの帯に並べる机の列数の上限。
DESK_MAX_COLS = 4
# 抽選漏れ (day / blockId / spaceNo / pageNo / cutIndex が 0) の数。
# 配置するサークル数はブロック数 x 1 ページぶんのスペース x 2 (a/b) で決まる。
MISSED_CIRCLES = 3
# 1 ページに載るスペース数。実物 (ComiketCircle の pageNo 104〜) は 1 ページ = 1 ブロックで、
# 15〜18 スペース (a/b の 2 カットで 30〜36 枚) が入る。ダミーは 15 スペース = 30 カット固定にする。
# スペース番号はブロックの中で 1 から連番。最初のページ番号は実物の ComiketCircle から読む。
SPACES_PER_PAGE = 15
SEED = 96

AREA_PREFIX = ["あお", "きん", "しろ", "ゆめ", "ほし", "かぜ", "みず", "ひか", "つき", "そら",
               "もり", "はな", "ゆき", "なつ", "あき", "ふゆ", "こはく", "ぎん", "たけ", "うみ"]
AREA_SUFFIX = ["ぞら工房", "いろ堂", "みみ舎", "やま書房", "の家", "ぱん屋", "スタジオ", "プロジェクト",
               "ラボ", "亭", "商会", "社中", "クラブ", "制作室", "工房", "屋"]
PEN_FAMILY = ["佐倉", "東雲", "小鳥遊", "藤原", "桐生", "白石", "水無月", "九条", "橘", "綾小路",
              "ナナセ", "ハルカ", "ミナト", "アオイ", "そらまめ", "ゆず"]
PEN_GIVEN = ["みなと", "あおい", "かえで", "つばさ", "ひなた", "りん", "そら", "ゆき", "まひろ", "こはる",
             "ナツキ", "ハル", "レン", "ユウ"]
BOOK_PREFIX = ["春の", "夏の", "秋の", "冬の", "はじめての", "まったり", "きまぐれ", "ひみつの",
               "夜空の", "週末の", "いつもの", "ちいさな"]
BOOK_SUFFIX = ["記録帳", "スケッチ", "研究ノート", "まとめ", "アンソロジー", "カタログ", "手帳",
               "ファイル", "コレクション", "日誌", "読本", "ゼミ資料"]
DESC = [
    "ダミー説明文です。頒布物の紹介がここに入ります。",
    "新刊のサンプルを置いています。既刊も少し持っていきます。",
    "（ダミー）評論・考察本を頒布予定です。お気軽にお立ち寄りください。",
    "当日はスケッチブックとポストカードを頒布します。",
    "（ダミー）グッズと冊子のセットを用意しています。",
    "",
]
# 半角カナ (実物 DB と同じ格納)。読みのダミーはここから選ぶ。
#
# 実物 DB ではブロック名 (あ/い/う/…/リ) と読みのかな行は一致しない。実測すると
# ブロック名のかな行 = 読みの 1 文字目のかな行になるサークルは 309/32,352 件 (1.0%) で、
# ブロック「あ」にも ｱ 行から ﾜ 行までの読みが入っている (blockId と circleKana を
# 突き合わせて全数測定)。ブロック名は読み順のラベルではなくホール内ブロックの記号なので、
# 読みは行を選ばず全体からランダムに選ぶ。ここにかな行テーブルを足さないこと。
KANA_CHARS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ"

# ---------------------------------------------------------------------------
# 実物 DB (復号した TSV) から構造テーブルと関係を読む
# ---------------------------------------------------------------------------

TABLE_FILES = {
    "info": "ComiketInfo.tsv",
    "dates": "ComiketDate.tsv",
    "maps": "ComiketMap.tsv",
    "areas": "ComiketArea.tsv",
    "blocks": "ComiketBlock.tsv",
    "genres": "ComiketGenre.tsv",
    "layouts": "ComiketLayout.tsv",
    "circles": "ComiketCircle.tsv",
}


def read_tsv(source_dir, filename):
    """実物 DB をタブ区切りで書き出したファイルを読む。"""
    path = os.path.join(source_dir, filename)
    try:
        with open(path, "rb") as handle:
            raw = handle.read()
    except OSError as error:
        raise SystemExit(
            "%s を読めません: %s\n--source-dir (または環境変数 CCATALOG_SOURCE_DIR) で"
            "実物 TSV のディレクトリを指定してください。" % (path, error)
        )
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        # 書き出しツールによっては CP932 のままの列が残るので、その場合は CP932 で読む。
        text = raw.decode("cp932")
    return [line.split("\t") for line in text.splitlines() if line.strip()]


def load_tables(source_dir):
    """構造テーブル (info / dates / maps / areas / blocks / genres) を実物の値のまま読む。"""
    info_row = read_tsv(source_dir, TABLE_FILES["info"])[0]
    return {
        "info": {
            "comiketNo": int(info_row[0]),
            "comiketName": info_row[1],
            "cutSizeW": int(info_row[2]),
            "cutSizeH": int(info_row[3]),
            "cutOriginX": int(info_row[4]),
            "cutOriginY": int(info_row[5]),
            "cutOffsetX": int(info_row[6]),
            "cutOffsetY": int(info_row[7]),
            "mapSizeW": int(info_row[8]),
            "mapSizeH": int(info_row[9]),
            "mapOriginX": int(info_row[10]),
            "mapOriginY": int(info_row[11]),
        },
        # weekday は元 DB の値のまま (1=日, 2=月, … 7=土)。
        "dates": [
            {
                "id": int(row[1]),
                "year": int(row[2]),
                "month": int(row[3]),
                "day": int(row[4]),
                "weekday": int(row[5]),
            }
            for row in read_tsv(source_dir, TABLE_FILES["dates"])
        ],
        # w/h がマップ画像の原寸 (印刷範囲)。x/y はその原点。
        "maps": [
            {
                "id": int(row[1]),
                "name": row[2],
                "filename": row[3],
                "w": int(row[6]),
                "h": int(row[7]),
                "allFilename": row[8],
            }
            for row in read_tsv(source_dir, TABLE_FILES["maps"])
        ],
        # 壁の地区は印刷範囲が 0x0 (机を置かない)。
        "areas": [
            {
                "id": int(row[1]),
                "name": row[2],
                "simpleName": row[3],
                "mapId": int(row[4]),
                "x": int(row[5]),
                "y": int(row[6]),
                "w": int(row[7]),
                "h": int(row[8]),
                "allFilename": row[9],
            }
            for row in read_tsv(source_dir, TABLE_FILES["areas"])
        ],
        "blocks": [
            {"id": int(row[1]), "name": row[2], "areaId": int(row[3])}
            for row in read_tsv(source_dir, TABLE_FILES["blocks"])
        ],
        "genres": [
            {"id": int(row[1]), "name": row[2], "code": int(row[3])}
            for row in read_tsv(source_dir, TABLE_FILES["genres"])
        ],
    }


def derive_relations(source_dir, areas, blocks):
    """実物のサークル表を集計して、日程とジャンルの関係を求める。

    戻り値:
      map_days     … 地図 ID → その地図を使っている日程 (実物では 1 つとは限らない)
      block_genres … ブロック ID → 実物でそのブロックに入っているジャンル ID
      first_page   … 実物のカットの最初のページ番号 (抽選漏れの 0 は除く)
    """
    area_by_id = {area["id"]: area for area in areas}
    block_by_id = {block["id"]: block for block in blocks}
    map_days = {}
    block_genres = {}
    first_page = None
    for row in read_tsv(source_dir, TABLE_FILES["circles"]):
        page_no, day, block_id, genre_id = int(row[2]), int(row[4]), int(row[5]), int(row[8])
        if page_no > 0 and (first_page is None or page_no < first_page):
            first_page = page_no
        block = block_by_id.get(block_id)
        # 抽選漏れ (day / blockId が 0) はどの地図にも属さない。
        if block is None or day == 0:
            continue
        map_id = area_by_id[block["areaId"]]["mapId"]
        map_days.setdefault(map_id, set()).add(day)
        block_genres.setdefault(block_id, set()).add(genre_id)
    if first_page is None:
        raise SystemExit("実物の %s にページ番号のあるサークルがありません。" % TABLE_FILES["circles"])
    return (
        {map_id: sorted(days) for map_id, days in map_days.items()},
        {block_id: sorted(genre_ids) for block_id, genre_ids in block_genres.items()},
        first_page,
    )


def kana_of(rng, length):
    """読みがなのダミー。元 DB と同じく半角カナで持たせる。

    実物 DB のブロック名は読み順のラベルではないので、行を選ばず全体から選ぶ
    (KANA_CHARS のコメントに実測を書いてある)。
    """
    return "".join(rng.choice(KANA_CHARS) for _ in range(length))


def day_for_block(block_id, area, map_days):
    """実物の関係 (ブロック → 地区 → 地図 → その地図を使う日程) で日程を決める。"""
    days = map_days[area["mapId"]]
    return days[(block_id - 1) % len(days)]


def plan_spaces(areas, blocks, map_days):
    """机の割り当て (blockId, spaceNo) を組む。

    ブロックは実物の 100 件をそのまま使い、実物の ComiketLayout / ComiketCircle と同じく
    1 から始まるスペース番号を振る。カタログ全体で (blockId, spaceNo) が重複しない。
    壁の地区 (印刷範囲が 0x0) には机を置けないので使わない。
    """
    area_by_id = {area["id"]: area for area in areas}
    block_by_id = {block["id"]: block for block in blocks}
    usable = [
        block["id"]
        for block in blocks
        if area_by_id[block["areaId"]]["w"] > 0 and area_by_id[block["areaId"]]["h"] > 0
    ]
    if not usable:
        raise SystemExit("机を置けるブロックがありません (地区の印刷範囲を確認してください)。")
    # 実物は 1 ページ = 1 ブロックで、1 ブロックに 15〜18 スペースが入る。
    # ダミーも同じにして、どのブロックも SPACES_PER_PAGE スペース (1 ページぶん) を持たせる。
    plan = []
    for block_id in usable:
        for space_no in range(1, SPACES_PER_PAGE + 1):
            plan.append((block_id, space_no))
    return sorted(plan)


def build_layouts(plan, areas, blocks):
    """使った (blockId, spaceNo) の机を、そのブロックの地区の印刷範囲の内側に置く。

    地区の中をブロックごとの縦帯に分け、その中に実物と同じ 10px ピッチで並べる。
    """
    area_by_id = {area["id"]: area for area in areas}
    block_by_id = {block["id"]: block for block in blocks}
    blocks_by_area = collections.defaultdict(list)
    for block in blocks:
        blocks_by_area[block["areaId"]].append(block["id"])

    strip_by_block = {}
    for area_id, block_ids in blocks_by_area.items():
        area = area_by_id[area_id]
        if area["w"] == 0 or area["h"] == 0:
            continue
        # 帯の幅は地区の幅をブロック数で割ったもの (机 1 つ分は必ず残す)。
        strip_w = max(DESK_PITCH + 2 * DESK_MARGIN, area["w"] // len(block_ids))
        for index, block_id in enumerate(sorted(block_ids)):
            strip_by_block[block_id] = (area["x"] + index * strip_w, strip_w)

    layouts = []
    for block_id, space_no in plan:
        area = area_by_id[block_by_id[block_id]["areaId"]]
        strip_x, strip_w = strip_by_block[block_id]
        cols = max(1, min(DESK_MAX_COLS, (strip_w - 2 * DESK_MARGIN) // DESK_PITCH))
        layouts.append(
            {
                "blockId": block_id,
                "spaceNo": space_no,
                "xpos": strip_x + DESK_MARGIN + ((space_no - 1) % cols) * DESK_PITCH,
                "ypos": area["y"] + DESK_TOP + ((space_no - 1) // cols) * DESK_PITCH,
                # 机の向き。実物は 1〜4 だが、表示側 (MapWindow) が見るのは 0 と 90 だけ。
                "layout": 0 if space_no % 2 else 90,
                "mapId": area["mapId"],
            }
        )
    return layouts


def make_circle(circle_id, comiket_no, day, block_id, space_no, space_no_sub, page_no, cut_index, genre_ids, rng):
    """ダミーのサークル 1 件。名前などは作り物で、位置と日程は実物の関係から来る。"""
    name = rng.choice(AREA_PREFIX) + rng.choice(AREA_SUFFIX)
    has_contact = rng.random() < 0.5
    return {
        "id": circle_id,
        "comiketNo": comiket_no,
        "pageNo": page_no,
        "cutIndex": cut_index,
        "day": day,
        "blockId": block_id,
        "spaceNo": space_no,
        "spaceNoSub": space_no_sub,
        "genreId": rng.choice(genre_ids),
        "circleName": name,
        "circleKana": kana_of(rng, rng.randrange(4, 7)),
        "penName": rng.choice(PEN_FAMILY) + " " + rng.choice(PEN_GIVEN),
        "bookName": rng.choice(BOOK_PREFIX) + rng.choice(BOOK_SUFFIX),
        "url": f"https://example.com/circle/{circle_id}" if has_contact else "",
        "mailAddr": f"dummy{circle_id}@example.com" if rng.random() < 0.25 else "",
        "description": rng.choice(DESC),
        "memo": "要チェック（ダミー）" if rng.random() < 0.2 else "",
        "updateId": 1000 + circle_id,
        "updateData": "（ダミー）更新情報" if rng.random() < 0.2 else "",
        "circlems": f"https://webcatalog.circle.ms/Circle/{1000000 + circle_id}" if has_contact else "",
        "rss": f"https://example.com/rss/{circle_id}" if rng.random() < 0.15 else "",
        "updateFlag": 1 if rng.random() < 0.2 else 0,
        "twitter": f"dummy_circle_{circle_id}" if rng.random() < 0.3 else "",
        "pixiv": str(2000000 + circle_id) if rng.random() < 0.3 else "",
    }


def build_circles(plan, areas, blocks, map_days, block_genres, genre_ids, comiket_no, first_page, rng):
    """ダミーのサークルを組む。

    日程はブロック → 地区 → 地図 とたどり、その地図を使っている日程 (実物から集計した
    map_days) の中から決める。ページ番号はブロックごとの連番で、1 ページに
    SPACES_PER_PAGE スペース (a/b の 2 カットで 30 枚) が入る。
    """
    area_by_id = {area["id"]: area for area in areas}
    block_by_id = {block["id"]: block for block in blocks}
    # 実物と同じく、1 ページには 1 つのブロックのスペースだけを入れる。
    by_block = collections.defaultdict(list)
    for block_id, space_no in plan:
        by_block[block_id].append(space_no)

    # 日程ごとにブロックをまとめる (実物も日程ごとにページが連番で並ぶ)。
    by_day = collections.defaultdict(list)
    for block_id in sorted(by_block):
        area = area_by_id[block_by_id[block_id]["areaId"]]
        by_day[day_for_block(block_id, area, map_days)].append(block_id)

    circles = []
    page_cursor = first_page
    for day in sorted(by_day):
        for block_id in by_day[day]:
            spaces = sorted(by_block[block_id])
            # 1 ページ = SPACES_PER_PAGE スペース。1 スペースに a と b の 2 サークル。
            for offset in range(0, len(spaces), SPACES_PER_PAGE):
                chunk = spaces[offset:offset + SPACES_PER_PAGE]
                cut_index = 1
                for space_no in chunk:
                    for space_no_sub in (0, 1):
                        circles.append(
                            make_circle(
                                len(circles) + 1,
                                comiket_no,
                                day=day,
                                block_id=block_id,
                                space_no=space_no,
                                space_no_sub=space_no_sub,
                                page_no=page_cursor,
                                cut_index=cut_index,
                                genre_ids=block_genres.get(block_id) or genre_ids,
                                rng=rng,
                            )
                        )
                        cut_index += 1
                page_cursor += 1

    # 抽選漏れ。実物と同じく day / blockId / spaceNo / pageNo / cutIndex が 0。
    for _ in range(MISSED_CIRCLES):
        circles.append(
            make_circle(
                len(circles) + 1,
                comiket_no,
                day=0,
                block_id=0,
                space_no=0,
                space_no_sub=0,
                page_no=0,
                cut_index=0,
                genre_ids=genre_ids,
                rng=rng,
            )
        )
    return circles


def validate_catalog(catalog, first_page):
    """組み上がったデータが実物の構造を守っているか確かめる (壊れたデータを書かない)。"""
    area_by_id = {area["id"]: area for area in catalog["areas"]}
    block_by_id = {block["id"]: block for block in catalog["blocks"]}
    map_by_id = {map_info["id"]: map_info for map_info in catalog["maps"]}

    spots = {
        (circle["blockId"], circle["spaceNo"])
        for circle in catalog["circles"]
        if circle["blockId"] > 0
    }
    if len(spots) != len(catalog["layouts"]):
        raise SystemExit("机の数と配置したサークルの数が合いません。")

    layout_keys = set()
    for layout in catalog["layouts"]:
        key = (layout["mapId"], layout["blockId"], layout["spaceNo"])
        if key in layout_keys:
            raise SystemExit("(mapId, blockId, spaceNo) が重複しています: %s" % (key,))
        layout_keys.add(key)
        if (layout["blockId"], layout["spaceNo"]) not in spots:
            raise SystemExit("サークルのいない机があります: %s" % (key,))
        area = area_by_id[block_by_id[layout["blockId"]]["areaId"]]
        if layout["mapId"] != area["mapId"]:
            raise SystemExit("机の地図が地区の地図と違います: %s" % (key,))
        if layout["layout"] not in (0, 90):
            raise SystemExit("机の向きが 0/90 ではありません: %s" % (key,))
        # 机は地区の印刷範囲の内側 (= その地図の範囲の内側) でなければならない。
        if not area["x"] <= layout["xpos"] <= area["x"] + area["w"] - DESK_PITCH:
            raise SystemExit("机が地区の印刷範囲の外にあります: %s" % (key,))
        if not area["y"] <= layout["ypos"] <= area["y"] + area["h"] - DESK_PITCH:
            raise SystemExit("机が地区の印刷範囲の外にあります: %s" % (key,))
        map_info = map_by_id[layout["mapId"]]
        if not 0 <= layout["xpos"] <= map_info["w"] - DESK_PITCH:
            raise SystemExit("机が地図の外にあります: %s" % (key,))
        if not 0 <= layout["ypos"] <= map_info["h"] - DESK_PITCH:
            raise SystemExit("机が地図の外にあります: %s" % (key,))

    day_ids = {date["id"] for date in catalog["dates"]}
    pages = collections.defaultdict(list)
    for circle in catalog["circles"]:
        if circle["day"] == 0:
            if not (circle["pageNo"] == 0 and circle["cutIndex"] == 0):
                raise SystemExit("抽選漏れのページが 0 ではありません: サークル %d" % circle["id"])
        elif circle["day"] not in day_ids:
            raise SystemExit("日程が dates にありません: サークル %d" % circle["id"])
        else:
            pages[circle["pageNo"]].append(circle)

    # ページは 1 ブロックぶんで、cutIndex が 1 から連番でそろう (a/b の 2 件で 1 スペース)。
    if not pages or min(pages) != first_page:
        raise SystemExit("最初のページが %d ではありません。" % first_page)
    if sorted(pages) != list(range(min(pages), max(pages) + 1)):
        raise SystemExit("ページ番号が連番ではありません。")
    for page_no, page_circles in pages.items():
        # 1 スペースに a と b の 2 件なので、カット数は必ず偶数。
        if len(page_circles) % 2 != 0:
            raise SystemExit("ページ %d のカット数が奇数 (%d 件) です。" % (page_no, len(page_circles)))
        if len(page_circles) > SPACES_PER_PAGE * 2:
            raise SystemExit("ページ %d のカット数が多すぎます (%d 件)。" % (page_no, len(page_circles)))
        if sorted(circle["cutIndex"] for circle in page_circles) != list(
            range(1, len(page_circles) + 1)
        ):
            raise SystemExit("ページ %d のカット番号が 1〜%d ではありません。" % (page_no, len(page_circles)))
        if len({circle["day"] for circle in page_circles}) != 1:
            raise SystemExit("ページ %d に複数の日程が混ざっています。" % page_no)
        if len({circle["blockId"] for circle in page_circles}) != 1:
            raise SystemExit("ページ %d に複数のブロックが混ざっています。" % page_no)



FONT_PATHS = (
    # 太字を優先する (見出しのサークル名を縮小表示しても潰れないように)。
    r"C:\Windows\Fonts\YuGothB.ttc",
    r"C:\Windows\Fonts\meiryob.ttc",
    r"C:\Windows\Fonts\YuGothM.ttc",
    r"C:\Windows\Fonts\meiryo.ttc",
    r"C:\Windows\Fonts\msgothic.ttc",
)


def load_font(size):
    for path in FONT_PATHS:
        if os.path.exists(path):
            try:
                from PIL import ImageFont

                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return None


ACCENTS = [None, None, (192, 32, 32), None, (32, 64, 160), None, (24, 128, 72), None]


# カットの絵に描く短い語 (人物は描かない方針なので、文字と幾何学図形だけで構成する)。
CUT_MOTIF_WORDS = ["C96", "新刊", "ダミー", "サンプル", "既刊", "無配"]


def _motif(draw, circle, geometry, stroke):
    """絵の範囲に、id から決まる幾何学図形と短い語を描く (人物は描かない)。

    実物のカットは白地に濃淡のあるイラスト + 文字だが、ダミーは人物を描かず
    「文字とシンプルな図形」だけで構成する。形は id から決定的に決めるので、
    183 枚が同じトーンに揃う。
    """
    x0, y0, x1, y1 = geometry["art"]
    index = circle["id"]
    cx = (x0 + x1) // 2 + _design(index % 3 - 1, SCALE_X)
    cy = (y0 + y1) // 2 - _design(6 + 3 * (index % 3), SCALE_Y)
    radius = _design(26 + 3 * (index % 4), SCALE_X)
    box = [cx - radius, cy - radius, cx + radius, cy + radius]

    kind = index % 4
    if kind == 0:
        # 円 (淡いグレーの面 + 黒の輪郭)。
        draw.ellipse(box, fill=225, outline=0, width=stroke["circle"])
    elif kind == 1:
        # 四角 (同上)。
        draw.rectangle(box, fill=225, outline=0, width=stroke["circle"])
    elif kind == 2:
        # 三角。
        draw.polygon(
            [(cx, cy - radius), (cx + radius, cy + radius), (cx - radius, cy + radius)],
            fill=225,
            outline=0,
        )
        draw.line([(cx, cy - radius), (cx + radius, cy + radius)], fill=0, width=stroke["rule"])
        draw.line([(cx + radius, cy + radius), (cx - radius, cy + radius)], fill=0, width=stroke["rule"])
        draw.line([(cx - radius, cy + radius), (cx, cy - radius)], fill=0, width=stroke["rule"])
    else:
        # 同心円 + 十字線。
        draw.ellipse(box, outline=0, width=stroke["circle"])
        inner = _design(12, SCALE_X)
        draw.ellipse([cx - inner, cy - inner, cx + inner, cy + inner], fill=225, outline=0, width=stroke["rule"])
        draw.line([cx - radius, cy, cx + radius, cy], fill=0, width=stroke["rule"])
        draw.line([cx, cy - radius, cx, cy + radius], fill=0, width=stroke["rule"])

    # 図形の下に短い語を 1 つ置く (文字も入れる方針)。
    word = CUT_MOTIF_WORDS[index % len(CUT_MOTIF_WORDS)]
    font = load_font(_design(16, SCALE_Y))
    if font is not None:
        ty = min(y1 - 2, cy + radius + _design(8, SCALE_Y))
        draw.text((cx, ty), word, fill=0, font=font, anchor="mt")


def measure_cut_geometry(template_path):
    """実物のカット枠テンプレート (tools/cut-template.png) から枠と区切り線の位置を測る。

    テンプレートは実物のカットと同じ比率の「枠 + 区切り線だけ」の画像なので、ここで測った
    位置をそのまま使えばテンプレートが正であることがコード上でも分かる。
    戻り値の座標はすべてカット画像 (CUT_IMAGE_W x CUT_IMAGE_H) の画素。
    """
    from PIL import Image

    image = Image.open(template_path).convert("L")
    width, height = image.size
    pixels = image.load()

    def is_ink(x, y):
        return pixels[x, y] < 128

    def runs(values):
        """連続する値を [start, end] の区間にまとめる。"""
        out = []
        for value in values:
            if out and out[-1][1] == value - 1:
                out[-1][1] = value
            else:
                out.append([value, value])
        return out

    # 全幅が黒い行 = 上枠・見出し区切り線・下枠 / 全高が黒い列 = 左枠・右枠。
    lines = runs([y for y in range(height) if all(is_ink(x, y) for x in range(width))])
    frames = runs([x for x in range(width) if all(is_ink(x, y) for y in range(height))])
    if len(lines) != 3 or len(frames) != 2:
        raise SystemExit("カット枠テンプレートの形が想定と違います: %s" % template_path)
    top, heading, bottom = lines
    left, right = frames
    # 左上のスペース番号ボックスの縦区切り (上枠から見出し区切り線まで)。
    dividers = runs([
        x for x in range(left[1] + 1, right[0])
        if all(is_ink(x, y) for y in range(top[1] + 1, heading[0]))
    ])
    if len(dividers) != 1:
        raise SystemExit("スペース番号ボックスの区切りが %d 本あります: %s" % (len(dividers), template_path))

    def scaled(start, end, size, source_size):
        """テンプレートの区間 [start, end] をカットの寸法に写す。"""
        scale = size / source_size
        return round(start * scale), round((end + 1) * scale) - 1

    frame_left = scaled(left[0], left[1], CUT_IMAGE_W, width)
    frame_right = scaled(right[0], right[1], CUT_IMAGE_W, width)
    frame_top = scaled(top[0], top[1], CUT_IMAGE_H, height)
    frame_bottom = scaled(bottom[0], bottom[1], CUT_IMAGE_H, height)
    divider_h = scaled(heading[0], heading[1], CUT_IMAGE_H, height)
    divider_v = scaled(dividers[0][0], dividers[0][1], CUT_IMAGE_W, width)
    return {
        # 外周枠 (テンプレートの 22px がカットでは 4px になる)
        "frame_top": frame_top,
        "frame_bottom": frame_bottom,
        "frame_left": frame_left,
        "frame_right": frame_right,
        # 見出し帯の区切り線 (全幅) と、スペース番号ボックスの縦区切り
        "divider_h": divider_h,
        "divider_v": divider_v,
        # 空けておくスペース番号ボックスの内側 (アプリが番号とチェック色を描く)
        "box": (frame_left[1] + 1, frame_top[1] + 1, divider_v[0] - 1, divider_h[0] - 1),
        # サークル名を焼き込む見出し帯 (ボックスの右)
        "heading": (divider_v[1] + 1, frame_top[1] + 1, frame_right[0] - 1, divider_h[0] - 1),
        # 絵を描いてよい範囲 (枠と見出し帯の内側)
        "art": (frame_left[1] + 1, divider_h[1] + 1, frame_right[0] - 1, frame_bottom[0] - 1),
    }


def _heading(draw, circle, geometry):
    """見出し帯にサークル名を焼き込む (実物と同じく入る文字数で切る)。

    635x903 で描いて 178x253 に縮小表示するので、大きめに描いても潰れないようにする。
    """
    font = load_font(HEADING_FONT_SIZE)
    if font is None:
        return
    x0, y0, x1, y1 = geometry["heading"]
    name = ""
    for char in circle["circleName"]:
        if draw.textlength(name + char, font=font) > x1 - x0:
            break
        name += char
    if name:
        draw.text((x0 + 4, (y0 + y1) // 2), name, fill=0, font=font, anchor="lm")


def draw_cut(circle, path, geometry):
    """実物のカット枠に合わせたダミーカット (16 段のグレー)。

    枠・区切り線・スペース番号ボックスは実物のテンプレート (tools/cut-template.png) から
    測った位置に描く。ボックスの中は空のままにして、アプリがスペース番号とチェック色を描く。
    見出し帯にはサークル名を焼き込み、内側には濃淡のあるイラスト風の図形を描く。
    実物のカット (解析/recuts/*.PNG) は 2 値ではなく 16 段のグレーなので、同じ階調に丸める。
    """
    from PIL import Image, ImageDraw

    image = Image.new('L', (CUT_IMAGE_W, CUT_IMAGE_H), 255)
    draw = ImageDraw.Draw(image)

    # 設計値 (105x150) をカットの寸法に写した寸法。
    stroke = {"circle": _design(2.5, SCALE_X), "rule": _design(2, SCALE_X)}

    # 絵の範囲に淡い濃淡を敷いてから、イラストを重ねる (実物のインク量に寄せる)。
    _shade(draw, geometry["art"], base=228, spread=40, seed=circle["id"] % 8)
    _motif(draw, circle, geometry, stroke)
    _heading(draw, circle, geometry)

    # 枠と区切り線。テンプレートから測った位置にそのまま置く。
    top_y0, top_y1 = geometry["frame_top"]
    bottom_y0, bottom_y1 = geometry["frame_bottom"]
    left_x0, left_x1 = geometry["frame_left"]
    right_x0, right_x1 = geometry["frame_right"]
    divider_y0, divider_y1 = geometry["divider_h"]
    box_x0, box_x1 = geometry["divider_v"]
    draw.rectangle([0, top_y0, CUT_IMAGE_W - 1, top_y1], fill=0)
    draw.rectangle([0, bottom_y0, CUT_IMAGE_W - 1, bottom_y1], fill=0)
    draw.rectangle([left_x0, 0, left_x1, CUT_IMAGE_H - 1], fill=0)
    draw.rectangle([right_x0, 0, right_x1, CUT_IMAGE_H - 1], fill=0)
    draw.rectangle([box_x0, top_y1 + 1, box_x1, divider_y0 - 1], fill=0)
    draw.rectangle([left_x1 + 1, divider_y0, right_x0 - 1, divider_y1], fill=0)

    # 実物と同じ 16 段のグレーに丸めて保存する。
    _quantize_cut(image).save(path, optimize=True)


# マップ上の机の色。ブロックごとに変えて、どのブロックの机か分かるようにする。
BLOCK_COLORS = [
    (186, 205, 240), (200, 230, 190), (245, 220, 180), (232, 192, 232),
    (196, 226, 226), (240, 202, 202), (216, 216, 182), (206, 206, 238),
]


def draw_map(map_info, areas, layouts, path):
    """会場マップのダミー画像。

    大きさは実物の印刷サイズ (ComiketMap の w/h)。地区の枠は ComiketArea の印刷範囲、
    机のマスは ComiketLayout の座標をそのまま使うので、アプリ側の表示と重なる。
    """
    from PIL import Image, ImageDraw

    width, height = map_info["w"], map_info["h"]
    image = Image.new("RGB", (width, height), (245, 245, 240))
    draw = ImageDraw.Draw(image)
    for x in range(0, width, 50):
        draw.line([x, 0, x, height], fill=(232, 232, 226))
    for y in range(0, height, 50):
        draw.line([0, y, width, y], fill=(232, 232, 226))

    note_font = load_font(14)
    for area in areas:
        if area["w"] == 0 or area["h"] == 0:
            continue
        draw.rectangle(
            [area["x"], area["y"], area["x"] + area["w"] - 1, area["y"] + area["h"] - 1],
            outline=(120, 120, 120),
            width=2,
        )
        if note_font:
            draw.text((area["x"] + 8, area["y"] + 6), area["name"], fill=(112, 112, 112), font=note_font)

    for layout in layouts:
        x, y = layout["xpos"], layout["ypos"]
        draw.rectangle(
            [x, y, x + DESK_PITCH - 1, y + DESK_PITCH - 1],
            fill=BLOCK_COLORS[layout["blockId"] % len(BLOCK_COLORS)],
            outline=(96, 96, 96),
        )

    title_font = load_font(24)
    if title_font:
        draw.text((12, 8), map_info["name"], fill=(0, 0, 128), font=title_font)
    image.save(path, optimize=True)


def main():
    parser = argparse.ArgumentParser(description="開発用のダミーカタログ (データ + 画像) を生成する。")
    parser.add_argument(
        "--source-dir",
        default=os.environ.get("CCATALOG_SOURCE_DIR", DEFAULT_SOURCE_DIR),
        help="実物 DB をタブ区切りで書き出したディレクトリ",
    )
    args = parser.parse_args()

    rng = random.Random(SEED)
    tables = load_tables(args.source_dir)
    map_days, block_genres, first_page = derive_relations(
        args.source_dir, tables["areas"], tables["blocks"]
    )
    genres = tables["genres"]
    plan = plan_spaces(tables["areas"], tables["blocks"], map_days)
    layouts = build_layouts(plan, tables["areas"], tables["blocks"])
    circles = build_circles(
        plan,
        tables["areas"],
        tables["blocks"],
        map_days,
        block_genres,
        [genre["id"] for genre in genres],
        tables["info"]["comiketNo"],
        first_page,
        rng,
    )
    catalog = {
        "info": tables["info"],
        "dates": tables["dates"],
        "areas": tables["areas"],
        "blocks": tables["blocks"],
        "genres": genres,
        "circles": circles,
        "layouts": layouts,
        "maps": tables["maps"],
    }
    validate_catalog(catalog, first_page)
    cut_geometry = measure_cut_geometry(CUT_TEMPLATE)

    os.makedirs(CUT_DIR, exist_ok=True)
    os.makedirs(MAP_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as handle:
        json.dump(catalog, handle, ensure_ascii=False, indent=1)

    for circle in circles:
        draw_cut(circle, os.path.join(CUT_DIR, f"{circle['id']}.png"), cut_geometry)
    for map_info in tables["maps"]:
        draw_map(
            map_info,
            tables["areas"],
            layouts,
            os.path.join(MAP_DIR, f"{map_info['filename']}.png"),
        )

    pages = sorted({circle["pageNo"] for circle in circles if circle["pageNo"] > 0})
    days = collections.Counter(circle["day"] for circle in circles if circle["day"] > 0)
    print(
        "circles=%d (抽選漏れ %d) layouts=%d pages=%d..%d maps=%d areas=%d blocks=%d genres=%d dates=%d"
        % (
            len(circles),
            MISSED_CIRCLES,
            len(layouts),
            pages[0],
            pages[-1],
            len(tables["maps"]),
            len(tables["areas"]),
            len(tables["blocks"]),
            len(genres),
            len(tables["dates"]),
        )
    )
    print("日程ごとの件数: %s" % ", ".join("%d日目 %d 件" % (day, days[day]) for day in sorted(days)))
    print(
        "カット枠 (テンプレート実測): 枠 %dpx / 見出し区切り y=%s / ボックス区切り x=%s / ボックス内側 %s / 絵の範囲 %s"
        % (
            cut_geometry["frame_top"][1] + 1,
            cut_geometry["divider_h"],
            cut_geometry["divider_v"],
            cut_geometry["box"],
            cut_geometry["art"],
        )
    )
    print("-> %s" % OUT_JSON)


if __name__ == "__main__":
    main()
