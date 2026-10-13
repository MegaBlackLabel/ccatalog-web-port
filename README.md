# ccatalog-web-port

コミックマーケット DVD-ROM カタログブラウザ（`ccatalog.exe` / C96）の **Web 移植版**。
元 exe と同じ検索・絞込み・チェックリスト・会場マップが Web で動くかを確かめるための実装で、
UI は [react98retro](https://github.com/MegaBlackLabel/react98retro)（Windows 98 風 React コンポーネント）で組む。

## 何が入っているか

| 層 | 場所 | 状態 |
|---|---|---|
| 検索エンジン | `src/domain/normalize.ts`, `src/domain/search.ts`, `src/domain/search-fields.ts` | **実装済み**（元実装の挙動を移植） |
| アプリ状態 | `src/app/catalog-state.ts` | **実装済み**（検索 / 絞込み / やり直し / 条件初期化 / チェックリスト / メモ） |
| メニュー定義 | `src/ui/menu/menu-defs.ts`（生成物） | **実装済み**（元の RT_MENU 128 そのまま） |
| 画面 | `src/ui/main`, `src/ui/search`, `src/ui/list`, `src/ui/detail`, `src/ui/checklist`, `src/ui/map`, `src/ui/dialog` | **実装済み**（元アプリの 5 ウィンドウ + 主要ダイアログ） |
| データ | `src/data/catalog-source.ts` + `src/data/fixtures/dummy-catalog.json` | **ダミーデータ同梱** / JSON 取得口あり |

## 元アプリの画面と対応

| 元アプリの画面 | このアプリ | ファイル |
|---|---|---|
| サークルカットウィンドウ（メイン） | 実装済み | `src/ui/main/MainWindow.tsx` + `CircleCutView.tsx` |
| サークル一覧ウィンドウ | 実装済み | `src/ui/list/ListWindow.tsx` |
| サークル検索ダイアログ | 実装済み | `src/ui/search/SearchWindow.tsx` |
| サークル詳細ウィンドウ | 実装済み | `src/ui/detail/DetailWindow.tsx` |
| チェックリストウィンドウ | 実装済み | `src/ui/checklist/ChecklistWindow.tsx` |
| 会場マップウィンドウ | 実装済み | `src/ui/map/MapWindow.tsx` |
| メモ編集 / 移動先ページ / バージョン情報 / チェック色 | 実装済み | `src/ui/dialog/*.tsx`, `src/ui/checklist/CheckColorDialog.tsx`

逆解析の根拠（関数アドレス・リソース ID・正規化テーブル）は下の「根拠」節を参照。

## 開発

```bash
mise exec -- bun install       # 依存 (react98retro はローカルの dist を vite alias で参照)
mise exec -- bun run dev       # http://localhost:5173
mise exec -- bun run test      # vitest + jsdom + Testing Library
mise exec -- bun run build     # tsc -b && vite build
mise exec -- bun run sync:lib  # react98retro の dist を vendor/ に取り直す (CI / Pages 用)
```

### GitHub Pages の動作チェックページ

`main` に push すると `.github/workflows/deploy.yml`（テスト → ビルド → Pages 公開）が走り、
**https://megablacklabel.github.io/ccatalog-web-port/** が更新される。
react98retro の https://megablacklabel.github.io/react98retro/ と同じ、ブラウザで挙動を確認するためのページ。

- プロジェクトページは `https://<user>.github.io/<repo>/` のサブパスに出るので、Pages 用のビルドは
  `bun run build:pages`（= `tsc -b && vite build --base=/ccatalog-web-port/`）で base を切り替える。
  `public/` の画像（元実装と同じ絶対パス `/cuts/1.png`）は `src/ui/asset-url.ts` の `assetUrl()` が
  `import.meta.env.BASE_URL` を前置きする。開発サーバ / テストでは base が `/` なので結果は変わらない。
- CI にはローカルの react98retro ツリーが無いため、リポジトリに固定した `vendor/react98retro/dist`
  を使う（下記「react98retro の参照方法」）。
- 手元で Pages と同じものを作る場合:

  ```bash
  mise exec -- bun run build:pages
  mise exec -- bun run preview:pages   # http://localhost:4173/ccatalog-web-port/
  ```

- 公開ページは元実装と同じく **起動確認 → シリアル番号入力 → 情報送信の確認** の順にダイアログから始まる。

### react98retro の参照方法

`@megablacklabel/react98retro` は **node_modules ではなくローカルの作業ツリー**を
`vite.config.ts` の alias / `tsconfig.app.json` の paths で直接参照している。

- `bun install` の `file:` / `link:` 依存は Windows 上のチェックアウト全体をコピー/リンクしようとして失敗するため。
- 参照先はライブラリ **0.4.3**。`dist/react98retro.js` を使うので、ライブラリの
  `src` を変更したら `mise exec -- bun run build:lib`（ライブラリ側）で `dist` を作り直すこと。
- ライブラリ側で `dist/react98retro.js`（ライブラリバンドル）が存在すればそれを使い、
  dist がアプリ用ビルドに置き換わっている等で無い場合は `src/index.ts` を直接コンパイルする
  （その際は 98.css を `.win98` 配下にスコープする postcss 変換をこのアプリ側で適用する）。
- **ローカルツリーが無い環境（GitHub Actions）では `vendor/react98retro` を使う。**
  これは `mise exec -- bun run sync:lib`（`tools/sync-vendor-lib.mjs`）が
  `../../react/react98retro/dist` をコピーした固定スナップショットで、コミット対象。
  ライブラリの `dist` を作り直したら `sync:lib` を実行して差分もコミットすること
  （手で編集しない。取り込んだバージョンは `vendor/react98retro/VERSION.txt` に出る）。
- React は `resolve.dedupe` で 1 コピーに固定している（ライブラリを別ディレクトリから読むため、
  これが無いとフックが二重 React を掴んで落ちる）。
- CSS の `cssMinify` 上書きは 0.2.4 で不要になった（同梱 CSS が `@media not (hover)` に正規化済み）。

### 元実装の部品との対応

| 元実装 | このアプリ |
|---|---|
| メニュー（RT_MENU 128, 8 メニュー / 71 項目） | `ui/menu/menu-defs.ts` → `MenuBar` |
| SQL `cnt()` / `ncnt()` / `normalize()` / `getMemo()` | `domain/search.ts` の `searchCircles`（`normalize` は `domain/normalize.ts`、メモは `app/catalog-state.ts` の `memos`） |
| 検索条件の INI 保存（`Search` セクション） | `SearchCondition`（`app/catalog-state.ts`） |
| チェックリスト（色 1〜9・印刷順） | `ChecklistEntry` / `checklist/*` アクション |

### 検索の移植で外せないポイント

1. **正規化は両側に効く**。あいまい検索 ON のとき、元実装は検索語も `FUN_00475cb0` で正規化してから
   SQL に埋め込む。したがって `normalize(値).includes(normalize(語))` が正しい意味論。
2. **選択列は連結してから部分一致する**。元実装は `cnt(circleName||circleKana||…,'語')` を実行するため、
   列をまたぐ語（例: 名前末尾＋読み先頭）でもヒットする。`domain/search.test.ts` に挙動テストあり。
3. **あいまい検索 OFF は生の部分一致**。大文字小文字・全半角・かな種別を区別する。
4. **絞込み検索は直前の結果が対象**、**やり直しで絞込み前に戻る**。検索前は絞込み不可（元実装ではボタン無効）。
5. 参加日は `0 = 抽選漏れ`、ジャンルは `genreId`、`メモのみ` / `更新のみ` はそれぞれ
   `memo !== ''` / `updateFlag !== 0` に対応する。

## データ（すべてダミー）

**実データはこのプロジェクトの対象外**。DVD-ROM カタログの `ccatalog96.db` は使わず、
スキーマだけ元実装に合わせた完全なフィクションを同梱している。

- `src/data/fixtures/dummy-catalog.json` — 5 ページ / 183 サークル（配置 180 + 抽選漏れ 3）。
  **構造（地図・地区・ブロック・ジャンル・日程・座標・ページ割り）は復号した実物 DB の値**で、
  名前・執筆者・発行誌・説明・連絡先だけが生成した架空のもの:
  - `dates` 実物 4 件（2019/8/9 金 〜 8/12 月、`weekday` は 1=日…7=土）
  - `maps` 実物 4 件（西12 `W12` 1000x800 / 西34 `W34` 760x800 / 南12 `S12` 800x460 / 南34 `S34` 800x460）
  - `areas` 実物 12 件（西2壁 / 西2 / … / 南3）、`blocks` 実物 100 件（あ / い / う / …）、`genres` 実物 50 件
  - 1 ページ 36 席（6x6 格子、`cutIndex` 1..36）。`(blockId, spaceNo)` はカタログ全体で一意（実物 PK と同じ）
- `public/cuts/<circleId>.png` — サークルカットのダミー画像。実物の低解像度カットを実測した特性に合わせて
  105x150 / パレット 16 色 / 白 25〜53%・黒 13〜27%・グレー 12〜54% で描く（DB 上の表示サイズは 178x253）。
- `public/maps/W12.svg` `W34.svg` `S12.svg` `S34.svg` — **実物の地図画像 (GNR1W12 / GNR1W34 / GNR1S12 / ユーザー提供 HMP1S34) をベクター化したもの**。
  生成: `mise exec -- python tools/gen-map-svg.py`（2 値化 + 矩形化）。`viewBox` は元画像の実寸 ×
  縮尺で、DB（`ComiketMap`）の印刷範囲の座標に合わせてあるので机のセル座標とそのまま重なる。
  4 面ともユーザー提供の高解像度版（`HMP1W12.PNG` 2000x1600 / `HMP1W34.PNG` 1520x1600 /
  `HMP1S12.PNG`・`HMP1S34.PNG` 1600x920 = いずれも DB の `w2`/`h2`）を 1/2 縮尺で使い、
  `viewBox` を DB の `w1`/`h1` に合わせる。座標は 0.5 刻みのまま出し、`shape-rendering` も
  既定（拡大しても線が階段状にならない）。会場マップウィンドウはこれを表示し、読めない環境では
  従来の PNG にフォールバックする。
- `public/maps/W12.png` `W34.png` `S12.png` `S34.png` — ダミー画像（フォールバック用）。
- 再生成: `mise exec -- python tools/gen-dummy-data.py`。
  構造テーブルは復号 DB の TSV（既定 `D:\develop\comiket\解析\sqlite2\out\raw-cp932`、
  `CCATALOG_SOURCE_DIR` で変更可）を読む。TSV が無い環境では構造部だけ実物値のコピーが必要。
- 取得口は `src/data/catalog-source.ts` の `CatalogSource`。`createJsonCatalogSource(url)` を渡せば
  外部 JSON（将来 DuckDB-WASM / 公式 Web カタログ API など）へ差し替えられる。
- `memo` は元実装と同じく DB ではなくアプリ側に保存される（SQL 関数 `getMemo()` 相当 →
  `src/app/catalog-state.ts` の `memos` と `memo/set`）。
- **チェックリストはデモ用に 65 件（1日目 20 / 2〜4日目 各 14 / 抽選漏れ 3）を起動時に登録する**。
  実物は空から始まる仕様なので、これは「一覧のスクロールを確認するための割り切り」
  （`src/App.tsx` の `DEMO_CHECKLIST_COUNTS`。ユーザーが全件解除しても再投入しない）。
- 参加日のタブは実物どおり**日付名だけ**（`1日目` / `抽選漏れ`）。件数はステータスバーに出す。
- チェックリストの表は実物どおり**罫線つき**（行高 17px、セル境界 1px `#d4d0c8`（実測値）。`src/styles/app.css` の
  `[data-testid='checklist-window'] ... table td` で描く）で、列は **No. / 色 / サークル名 / 読み / 執筆者 /
  発行誌 / 補足 / メモ / 位置 / 日付 / ジャンル**（元実装のフィールド名は `cpr.ini` のセパレータ名に対応）。

## 生成物（手で編集しない）

| ファイル | 生成元 |
|---|---|
| `src/domain/normalize.ts` | `解析/gen_normalize.py`（対象 `.exe` の正規化テーブル 332 対 + 削除 3 文字） |
| `src/ui/menu/menu-defs.ts` | `tools/gen-menu-defs.py`（`解析/ui.json` ← `解析/ui_spec.py` が PE をパース） |
| `src/data/fixtures/dummy-catalog.json` + `public/cuts/*.png` + `public/maps/*.png` | `tools/gen-dummy-data.py` |

## 根拠（逆解析）

- `D:/develop/comiket/解析/REPORT-ccatalog-search.md` — 検索機能のリバース結果（関数アドレス・SQL・正規化）
- `D:/develop/comiket/解析/UI-SPEC.md` — ダイアログ 36 件 / メニュー / ツールバー / 実機ウィンドウ実測
- `D:/develop/comiket/解析/UI-WIREFRAME.html` — 元ダイアログの復元ワイヤーフレーム

## ウィンドウ配置と既知の制約

`src/App.tsx` がウィンドウの位置とサイズを決める（各ウィンドウは `initialX` / `initialY` /
`width` / `height` を任意 prop で受ける）。元アプリの初期寸法（実測 3840x2160:
カット 1261x1120 / 詳細 1200x1056 / チェックリスト 1200x1056 / 一覧・マップ 2640x1920）から、
画面に収まる範囲へ並べ替えている。座標は**ライブラリのデスクトップ余白 8px 基準**で、
隣り合うウィンドウの間を 8px 空ける（`Window` の `getResponsiveSize` が x/y を 8 未満から 8 に
持ち上げるため、0 起点で並べると 4px 重なる）。

`LAYOUT_WIDE`（内寸 **1920x1040** 以上のとき。地図が実物と同じ 690x542 なので、右端でサークル詳細とだけ重なる）:

| ウィンドウ | 位置 | サイズ | 初期表示 |
|---|---|---|---|
| メイン（サークルカット） | (8, 8) | 856 x 600 | 表示 |
| サークル詳細 | (872, 8) | 500 x 600 | 表示 |
| 会場マップ | (1222, 8) | 690 x 560 | 表示 |
| チェックリスト | (8, 616) | 782 x 390 | 表示 |
| サークル一覧 | (798, 616) | 714 x 390 | 表示 |
| 検索ダイアログ | (608, 128) | 620 x 470 | 検索メニュー |

`LAYOUT_COMPACT`（それ未満の画面。地図と検索は必要なときに開く）:

| ウィンドウ | 位置 | サイズ | 初期表示 |
|---|---|---|---|
| メイン（サークルカット） | (8, 8) | 716 x 440 | 表示 |
| サークル詳細 | (736, 8) | 512 x 600 | 表示 |
| チェックリスト | (8, 452) | 784 x 310 | 表示 |
| サークル一覧 | (804, 452) | 460 x 310 | 表示 |
| 会場マップ | (120, 120) | 700 x 500 | 表示 |
| 検索ダイアログ | (520, 70) | 620 x 470 | 検索メニュー |

- 起動確認 / シリアル番号入力 / 情報送信の確認 の 3 ダイアログは**モーダルにしない**
  （元実装はモーダルだが、Web 版は他のウィンドウを操作できるようにする。ユーザー指示）。
- 元アプリの**起動直後はカットとサークル詳細の 2 枚だけ**（実測 `ui_capture/zorder.tsv`: 一覧・
  チェックリスト・マップは hidden）。このアプリは**実装済みの 5 枚を最初から全部出す**（ユーザー指示）。
  狭い画面では重なる（実物の初期配置もカット/一覧/地図が重なっている）ので、好みで動かして使う。
- 会場マップのツールバー「ジャンル表示」は実物と同じく**押せない見出し**（Static）で、右の
  ComboBox が**なし〜100% を 25% 刻み**の濃さ。選んだ濃さで、サークルのある机にジャンル色
  （`src/ui/map/genre-colors.ts` の VGA 原色 12 色をジャンル ID 順）を半透明で重ねる
  （ヘルプ 1WINDOW/5MAP.HTM の「マップに半透明処理で重ねて表示するジャンル情報の濃さ」）。
- サークル詳細の色ボタンは**その色でチェック**（未チェックのサークルはその色で登録し、
  登録済みは色だけ変える）。カットの左上スペース番号ボックスにその色が出る
  （サークル詳細のカット欄も同じボックスを重ねる。定義は `src/ui/main/cut-space.tsx` の共通部品）。
- チェック色の標準色（0）は実物の会場マップのスクリーンショット (`解析/chm_out/IMAGES/WINDOW4.PNG`)
  でチェック済みの机が塗られている緑 `#00c060`（`src/ui/check-colors.ts`）。
- 会場マップの机は**左半分が a 席・右半分が b 席**で、チェック済みの席だけチェック色を重ねる。
  机とスペース番号は会場図の SVG に描かれているので、**アプリからは文字も枠も足さない**。
  色は会場図と**同じ座標系の SVG オーバーレイ** (`viewBox="0 0 <地図の幅> <地図の高さ>"`) に
  `<rect>` として描く。実物の机の四角は `xpos`/`ypos` が左上 (会場図の枠と一致) なので、席の矩形は
  `(xpos, ypos, w/2, h)` と `(xpos + w/2, ypos, w/2, h)` (a が左半分、b が右半分)。フィルは
  `mix-blend-mode: multiply` + 透過 0.7 なので、下の会場図の枠・線・スペース番号が読める。
- 会場マップのジャンル表示は、席の下にジャンル色の `<rect>` を敷く (濃さ = `fill-opacity`)。
- サークル詳細のサークルメモは**その場で編集できる**（実物は「メモの編集」ダイアログ。Web 版は
  メモ欄をテキストエリアにしていて、選んだサークルごとに入れ替わる）。ダイアログ側は
  メニュー「チェックリスト > サークルのメモを編集する」から開ける。
- チェックリストの最小幅は 782px（実物のウィンドウ実寸。ツールバーが 1 行に収まる幅で、狭いと横スクロール）。
- 会場マップの最小幅は 690px（実物のウィンドウ実寸 = ヘルプのスクリーンショット `解析/chm_out/IMAGES/WINDOW4.PNG`
  の 690x542。ツールバー 1 行が収まる幅）。
- カットビューは**カットどうしを隙間なく並べる**（セルの外側に線も色も足さない。カットの枠は画像に
  焼き込み済み）。チェック色は**枠の中のスペース番号ボックスだけ**に出す（実物と同じ。色はサークルごとの
  チェック色で、0 = 標準色は白。文字色は色の明暗で白黒を切り替える）。
- カットビューは **幅に合わせてセルを縮め（6 列の `1fr`、セルは `aspect-ratio` でカット枠の比率を保つ）、
  高さが足りない分は縦スクロールバー**で見せる（元実装の「幅に合わせる」相当。原寸 178x253 を上限にするので、
  広いウィンドウでは実物と同じ大きさで止まる）。
- 検索ダイアログ・会場マップ・サークル一覧は「ウィンドウ」「検索」メニューから開閉する。
  「ウィンドウ」メニューの中身は元実装では実行時に子ウィンドウから作られるため、RT_MENU にはダミーしか無く、
  ここでは `src/ui/menu/to-menu-bar.ts` で同じ並びを再現している。
- メニューのドロップダウンはライブラリ側が `document.body` へ portal するので、他のウィンドウに隠れない。
- ウィンドウの重なり順は **ライブラリの `Window` が持つ inline z-index**（描画順に 1,2,3…・クリックで前面化）に任せる。
  こちらで `[data-testid]` に `z-index` を当てるとスタッキングコンテキストができてダイアログが背面に回るため、
  `src/styles/app.css` では重なり順を指定していない。
- ウィンドウはドラッグで移動できるので、実際に使うときは好みの位置へ動かせる。

### メインウィンドウのツールバー / ステータスバー

公式ヘルプ（`1WINDOW/8TOOLBAR.HTM`）の 5 グループ 29 ボタンを左から並べ、
**グループ単位で次の段に折り返す**（実物のドッキング ツールバーと同じ。900px 幅のウィンドウでは 2 段 = 1 段目 基本/ジャンプ/表示、2 段目 チェック/ナビ）:

| グループ | ボタン |
|---|---|
| 基本操作 | 新規作成 / チェックリストを開く / チェックリストの保存 / 印刷 |
| ジャンプ操作 | 前のページ / 次のページ / 日付ジャンプ / ホールジャンプ / ブロックジャンプ (3 つはドロップダウン) |
| 表示 | ズームアウト / 拡大率指定 / ズームイン / 幅に合わせる / 高さに合わせる / 元のサイズ / アンチエイリアス |
| チェックリスト | 色1〜色9 (指定色でチェックに追加 / 色変更) / チェックリストから外す / 色編集 |
| （サークル詳細） | Googleで検索 (86x20) / 設定 (30x20, 未実装のため無効) / 色1〜色9 (14x11、実物の色) |
| ナビゲート | 戻る / 進む |

- ジャンプの 3 つのラベルは App が作って渡す（`jumpOptions`）。日付は実物 `ComiketDate.weekday` から
  **金曜日 / 土曜日 / 日曜日 / 月曜日**、ホールは実物 `ComiketArea.name`（西2壁 / 西2 / … / 南3）、
  インデックスは `src/domain/kana.ts` の `KANA_ROWS`（あ / か / … / ん / その他）。
- ステータスバーは実測どおり 1 行で、左から ページ番号入力 / `<<` / ページ送りスライダ / `>>`、
  その右に状態文言（`準備完了 / ページ 104 / ズーム 100% / チェック 0 件`）。
  実測ではこれらは `msctls_statusbar32` の子コントロールだった（`Toolbar` の中ではない）。
- アンチエイリアスは MainWindow 内の useState（表示だけのトグル）。
- **アイコンは実物の exe から抽出**: `ccatalog.exe` の PE リソース `RT_BITMAP`（130 = 16x15 × 23 スロット）を
  そのまま SVG 化した `src/ui/main/toolbar-icons.ts` を使う（生成: `mise exec -- python tools/gen-toolbar-icons.py`）。
  ライブラリの `ICONS` は使わない。再生成したら `git diff` で形を確認すること。
- 実物ではツールバーの中に ComboBox / Edit が埋め込まれている（実測: ジャンプのドロップダウン 64/68/40 x20、
  拡大率 Edit 36x18、色編集 Button 64x20）。ライブラリの `Toolbar` はボタン内にコントロールを持てないため、
  これらは**同じグループの行内に並べて**同じ見た目にしている（`Toolbar` の右隣）。
  ジャンプの 3 つの ComboBox は**実測値を最小幅**にして、幅は内容に合わせる
  （「西3･4壁」のような長いホール名が欠けないように）。
- ツールバー/リストのアイコンは実物 exe の RT_BITMAP を SVG 化した `src/ui/main/toolbar-icons.ts` を全ウィンドウで共用（チェックリストのリストロック・印刷順確定・チェック解除、一覧のリストロック、マップの拡大縮小など）。
- **ツールバー帯の寸法は 5 ウィンドウ共通**（`src/ui/main/toolbar-groove.ts` が単一の定義）: 1 段の帯は
  明 1px + silver 1px + 内容 22px + 暗 1px の 25px。ライブラリの `Toolbar` を段に置くときは上下の余白を
  外して内容 22px に詰める（`TOOLBAR_CONTENT_HEIGHT` / `TOOLBAR_INLINE_STYLE`）。
  折り返した段と段の間の溝は「silver 1px → 暗 #808080 1px → 明 #ffffff 1px → silver 2px」で、
  上の段の下辺が silver + 暗、下の段の上辺が明 + silver（`TOOLBAR_ROW_GAP_TOP/BOTTOM_STYLE`,
  `toolbarRowStyle`）。暗が上・明が下なので段の境目が凹んで見える（帯の上面の
  「暗 → 明」と同じ向き）。
- ツールバーの区切り線は 1px の溝（暗 `#808080` + 白 `#ffffff`、高さ 18px = 実測の 18px）、
  色パレットは 22x22 のボタン 9 個を 1px 間隔（実測のピッチ 23px = 206px）に揃える
  （`TOOLBAR_SEPARATOR_STYLE` / `TOOLBAR_PALETTE_STYLE`）。ライブラリの `Toolbar` の区切り線は
  16px なので、`src/styles/app.css` で 18px に上げる。アイコンは実物と同じ 16x15 で置く
  （ライブラリは img に 16x16 を固定で付けるため `app.css` で高さだけ戻す）。
- チェック色 1〜9 の色は実物のツールバーから実測（`src/ui/check-colors.ts`）。橙 `#ff944a` / マゼンタ `#ff00ff` /
  黄 `#fff700` / 緑 `#00b54a` / 水色 `#00b5ff` / 紫 `#9c529c` / 青 `#0000ff` / 黄緑 `#00ff00` / 赤 `#ff0000`。

### メニューから開くダイアログ（元の WM_COMMAND ID）

| メニュー | コマンド ID | 開く画面 |
|---|---|---|
| ファイル > 動作設定 | 32780 | 動作オプション |
| ファイル > 印刷 / 印刷詳細設定 | 32771 / 32823 | 印刷 → 詳細設定（チューザーから リスト/カット/マップ/白地図/用紙/画像出力） |
| ファイル > 画像ファイル出力 | 32866 | 印刷データの画像ファイル出力 |
| ファイル > コミックマーケット回数切り替え | 32829 | 回数切り替え |
| ファイル > サークルデータ / 画像データの追加・削除 | 32828 / 32827 | 追加インストールと削除 |
| ファイル > データベースの初期化 | 32858 | チューザー（古い DB の統合 / メモの統合） |
| ファイル > チェックリストを開く / 追加読み込み | 32793 / 32795 | メモの統合 → 読み込みサークル確認 / 重複登録の確認 → 読み込みサークル確認 |
| ファイル > circle.ms から/へ | 32870 / 32871 | Circle.ms 認証 / エクスポート結果表示 |
| ブックマーク > 追加 / 整理 | 32824 / 32825 | ブックマークの追加 / 整理 |
| 検索 > Google検索の条件設定 | 32836 | Google 検索設定 |
| チェックリスト > チェック色の編集 | 61227 | チェック色 |
| ヘルプ > バージョン情報 | 57664 | バージョン情報 |

起動時は元実装と同じ **起動確認 → シリアル番号入力 → 情報送信の確認** の順にダイアログが出る
（テストからは `<App startup={false} />` でスキップ）。

## 次にやること（この足場の外側）

- チェックリスト CSV（元実装の Ver2 形式）の入出力と、ブックマークの保存
- 動作設定 / ブックマーク / 印刷・プレビュー / データ追加削除 などの残りダイアログ
- ツールバーのグループ単位の表示 ON/OFF（元は 表示 > ツールバー。今は 29 ボタンを常時表示）
- データを DuckDB-WASM / SQLite-WASM に載せ、数万件での検索性能を確認
