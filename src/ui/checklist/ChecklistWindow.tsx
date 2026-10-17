import type { CSSProperties } from 'react';
import {
  Button,
  Groove,
  StatusBar,
  StatusBarField,
  TableView,
  Tabs,
  ToolbarBand,
  ToolbarRow,
  Window,
} from '@megablacklabel/react98retro';
import type { TabItem, TableColumn } from '@megablacklabel/react98retro';
import type { CheckColor, ChecklistEntry, ChecklistSortColumn } from '../../app/catalog-state';
import { checkColorHex, checkColorPalette, checkSwatchIcon } from '../check-colors';
import { DEFAULT_LIST_DISPLAY_SETTINGS, type ListColumnKey } from '../../domain/app-settings';
import { assetUrl } from '../asset-url';
// 実物のツールバー アイコン (PE の RT_BITMAP を SVG 化したもの) をそのまま使う。
import { TOOLBAR_ICONS } from '../main/toolbar-icons';
import {
  TOOLBAR_CONTENT_HEIGHT,
  TOOLBAR_ICON_BUTTON_STYLE,
  TOOLBAR_ICON_STYLE,
  TOOLBAR_ITEM_GAP,
  TOOLBAR_PADDING_X,
  TOOLBAR_PALETTE_STYLE,
  TOOLBAR_PRESSED_STYLE,
  TOOLBAR_SEPARATOR_STYLE,
  TOOLBAR_SEPARATOR_WIDTH,
  TOOLBAR_SWATCH_STYLE,
} from '../main/toolbar-groove';
import type { Circle } from '../../domain/types';

/** チェックリストの 1 行 (登録内容とサークルを呼び出し側で突き合わせ済み)。 */
export type ChecklistRow = { entry: ChecklistEntry; circle: Circle; genreName: string };

export type ChecklistWindowProps = {
  /** 現在のタブの行だけが渡される (呼び出し側で絞り込み済み)。 */
  rows: readonly ChecklistRow[];
  /** タブに並べる参加日。[1, 2, 3, 4, 0] の 0 は抽選漏れ。 */
  days: readonly number[];
  activeDay: number;
  /** タブごとの登録件数。ステータスバーの合計に使う (実物と同じくタブ名には出さない)。 */
  counts: Record<number, number>;
  /** 色1〜色9 の名称 (index 0 が「色1」)。空文字なら「色N」。 */
  colorNames: readonly string[];
  /** リストロック (順番入れ替え・ソートのロック)。 */
  locked: boolean;
  selectedIds: readonly number[];
  onActiveDayChange: (day: number) => void;
  onSelectionChange: (ids: number[]) => void;
  onToggleLock: () => void;
  onSetColor: (ids: number[], color: CheckColor) => void;
  onRemove: (ids: number[]) => void;
  /**
   * 印刷順の確定 (ツールバーの「印刷順確定」アイコン ボタン)。並べ替えのドロップダウンは
   * 実物に合わせて削除したので、呼び出し元は 'space' (位置順) だけを使う。
   */
  onOrderBy: (column: ChecklistSortColumn) => void;
  onOpenDetail: (id: number) => void;
  onClose: () => void;
  /** ツールバーの RSS ボタン (元実装はサークルの RSS 情報をネットから取得する)。 */
  onFetchRss?: () => void;
  /** タイトルバーの最小化 (アイコン化)。動作設定 1714「個別窓のアイコン化を連動する」。 */
  onMinimize?: () => void;
  /** 「色の設定」の表示色 (動作設定)。未指定なら実物から実測した色。 */
  checkColors?: readonly string[];
  /** 「リスト表示」の設定 (動作設定 210)。表に出す列と並び。 */
  visibleColumns?: readonly ListColumnKey[];
  /** ツールバーが折り返さない最小幅 (既定 782)。 */
  minWidth?: number;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** TableView は文字列 id を要求するため、元の数値 ID は circleId に持たせる。 */
export type ChecklistListRow = {
  id: string;
  circleId: number;
  /** 表示順の連番 (1 始まり)。実物の「No.」列。 */
  no: number;
  color: CheckColor;
  name: string;
  kana: string;
  pen: string;
  /** 発行誌 (DB の bookName)。 */
  book: string;
  space: string;
  day: string;
  genre: string;
  /** 補足 (DB の description)。 */
  description: string;
  /** メモ (アプリ側の memos)。 */
  memo: string;
  /** 更新情報 (DB の updateData)。 */
  updateInfo: string;
  /** 更新状態 (DB の updateFlag)。 */
  updateStatus: string;
  /** URL (DB の url)。 */
  url: string;
  /** Mail (DB の mailAddr)。 */
  mail: string;
};

/** チェック色の見本色 (0 は標準色 = 緑)。定義は 5 ウィンドウ共通 (ui/check-colors.ts)。 */

const SWATCH_STYLE: CSSProperties = {
  display: 'inline-block',
  width: 12,
  height: 12,
  border: '1px solid #808080',
  verticalAlign: 'middle',
};

/**
 * 補足 / メモ の空欄は「—」で埋める (実物の表も空欄をダッシュで示す)。
 */
const renderText = (value: ChecklistListRow[keyof ChecklistListRow]): string =>
  value === '' || value == null ? '—' : String(value);

/** 表の列 1 本の定義 (色以外は「リスト表示」の設定で表示 / 並びが変わる)。 */
const CHECKLIST_COLUMN_DEFS: Record<Exclude<ListColumnKey, 'color'>, TableColumn<ChecklistListRow>> = {
  name: { key: 'name', header: 'サークル名', width: 190 },
  kana: { key: 'kana', header: '読み', width: 110 },
  pen: { key: 'pen', header: '執筆者', width: 120 },
  book: { key: 'book', header: '発行誌', width: 160 },
  space: { key: 'space', header: 'スペース', width: 90 },
  day: { key: 'day', header: '参加日', width: 70 },
  genre: { key: 'genre', header: 'ジャンル', width: 110 },
  description: { key: 'description', header: '補足', width: 200, render: (value) => renderText(value) },
  memo: { key: 'memo', header: 'メモ', width: 200, render: (value) => renderText(value) },
  updateInfo: { key: 'updateInfo', header: '更新情報', width: 200, render: (value) => renderText(value) },
  updateStatus: { key: 'updateStatus', header: '更新状態', width: 120, render: (value) => renderText(value) },
  url: { key: 'url', header: 'URL', width: 160, render: (value) => renderText(value) },
  mail: { key: 'mail', header: 'Mail', width: 160, render: (value) => renderText(value) },
  cut: {
    key: 'circleId',
    header: 'サークルカット',
    // カット 111px + セルの左右の余白 (6px x 2) + 左の罫線 1px = 124px。
    // これがカットのぴったりの幅 (実物もカットが列幅の 93% を占める)。
    width: 124,
    render: (_value, row) => (
      <img
        data-testid="checklist-cut"
        src={assetUrl(`/cuts/${row.circleId}.png`)}
        alt=""
        draggable={false}
        style={CUT_STYLE}
      />
    ),
  },
};

/**
 * カット列の画像。実物 (revealed-3-チェックリスト.png) はカット 79x116 で、
 * 列幅 (約 85px) の 93% を占める。このアプリの見出しは実物の 1.40 倍の幅なので
 * 同じ比で 111x162 にする (DB 上の表示サイズ 178x253 と同じ縦横比 0.70)。
 * 他のセルは左寄せだが、カットだけは列の左右中央に置く。
 */
const CUT_STYLE: CSSProperties = {
  display: 'block',
  width: 111,
  height: 162,
  maxWidth: '100%',
  margin: '0 auto',
  objectFit: 'contain',
  imageRendering: 'pixelated',
};

/**
 * 表の列。並びと幅の比率は実物のチェックリスト (1WINDOW/3CHECK.HTM) の
 * 印刷セパレータ (No. / サークル / 読み / 執筆者 / 発行誌 / 補足 / メモ / 位置 / 色)
 * に合わせ、元アプリのデータにある日付 / ジャンルを末尾に足している。
 * 合計がウィンドウ幅を超える分は横スクロールになる。
 *
 * No. と 色 は固定 (色は常に左端。5LIST.HTM) で、そのあとに「リスト表示」の設定の列が続く。
 */
function checklistColumns(
  checkColors: readonly string[] | undefined,
  visible: readonly ListColumnKey[],
): TableColumn<ChecklistListRow>[] {
  return [
    // 実物の先頭は「印刷順」列で、色の見本を左に、連番を右に置く (色列の見出しは無い)。
    {
      key: 'color',
      header: '',
      width: 34,
      render: (_value, row) => (
        <span
          data-color={row.color}
          style={{ ...SWATCH_STYLE, background: checkColorHex(row.color, checkColors) }}
        />
      ),
    },
    { key: 'no', header: '印刷順', width: 60 },
    ...visible
      .filter((key): key is Exclude<ListColumnKey, 'color'> => key !== 'color')
      .map((key) => CHECKLIST_COLUMN_DEFS[key]),
  ];
}

/**
 * ツールバー 1 段分の、このウィンドウ固有の見た目。帯 (外周の溝) と段の並びは
 * ライブラリの `ToolbarBand` / `ToolbarRow` が持つので、ここは段の左右の余白・
 * 項目の間隔・折り返さないこと (入りきらない分は横スクロール) だけを決める。
 * 実測 (`解析/ui_capture/windows.tsv`) の帯は 28px (ボタン 22px の上下に余白 2px ずつ)
 * だが、5 ウィンドウ共通の帯 (内容 22px + 溝 3px = 25px) に揃えるため、その余白は入れない。
 */
const TOOLBAR_ROW_LOCAL: CSSProperties = {
  padding: `0 ${TOOLBAR_PADDING_X}px`,
  gap: TOOLBAR_ITEM_GAP,
  flexWrap: 'nowrap',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
};

/**
 * ツールバー (リストロック + 印刷順確定 + RSS + 9 色パレット + チェック解除) が 1 行に収まる幅。
 * アイコン ボタン 4 個 (22x22) + パレット (22x22 の 9 個 + 隙間 1px = 206) + 区切り線 4 本 (8px)
 * + 項目の間隔 4px×8 + 段の左右の余白 2px×2。
 */
const MIN_WINDOW_WIDTH =
  4 * TOOLBAR_CONTENT_HEIGHT +
  206 +
  4 * TOOLBAR_SEPARATOR_WIDTH +
  8 * TOOLBAR_ITEM_GAP +
  2 * TOOLBAR_PADDING_X;

const TABS_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
};

const EMPTY_STYLE: CSSProperties = { padding: 12, color: '#404040' };

/**
 * チェックリストウィンドウ (1WINDOW/3CHECK.HTM)。お気に入りに登録したサークルを
 * 参加日ごとのタブで分けて一覧し、色分け・解除・印刷順の確定を行う。
 */
export function ChecklistWindow({
  rows,
  days,
  activeDay,
  counts,
  colorNames,
  locked,
  selectedIds,
  onActiveDayChange,
  onSelectionChange,
  onToggleLock,
  onSetColor,
  onRemove,
  onOrderBy,
  onOpenDetail,
  onClose,
  onFetchRss,
  onMinimize,
  checkColors,
  visibleColumns = DEFAULT_LIST_DISPLAY_SETTINGS.checklist,
  minWidth = MIN_WINDOW_WIDTH,
  initialX = 160,
  initialY = 120,
  width = 820,
  height = 430,
  zIndex,
}: ChecklistWindowProps) {
  // 色ボタン (色1〜9) と行の色見本の色。「色の設定」(動作設定) を反映する。
  const palette = checkColorPalette(checkColors);
  const listRows: ChecklistListRow[] = rows.map(({ entry, circle, genreName }, index) => ({
    id: String(circle.id),
    circleId: circle.id,
    no: index + 1,
    color: entry.color,
    name: circle.circleName,
    kana: circle.circleKana,
    pen: circle.penName,
    book: circle.bookName,
    space: `${circle.spaceNo}${circle.spaceNoSub === 1 ? 'b' : 'a'}`,
    day: circle.day === 0 ? '抽選漏れ' : `${circle.day}日目`,
    genre: genreName,
    description: circle.description,
    memo: circle.memo,
    // 実物の「更新情報」は DB の updateData、「更新状態」は更新フラグ。
    updateInfo: circle.updateData,
    updateStatus: circle.updateFlag === 0 ? '' : '更新あり',
    url: circle.url,
    mail: circle.mailAddr,
  }));

  const hasSelection = selectedIds.length > 0;
  const totalCount = days.reduce((sum, day) => sum + (counts[day] ?? 0), 0);

  const listBody =
    listRows.length === 0 ? (
      <div style={EMPTY_STYLE}>この日のチェックリストは空です</div>
    ) : (
      <TableView<ChecklistListRow>
        columns={checklistColumns(checkColors, visibleColumns)}
        rows={listRows}
        selectedIds={selectedIds.map(String)}
        onSelectionChange={(ids) => onSelectionChange(ids.map(Number))}
        onRowDoubleClick={(row) => onOpenDetail(row.circleId)}
        // タブパネル (.window-body) の高さいっぱいに伸ばす (Tabs の fill と app.css の対)。
        height="100%"
      />
    );

  const tabs: TabItem[] = days.map((day) => ({
    id: String(day),
    // 実物のタブは日付名だけ (件数はステータスバーに出す)。1WINDOW/3CHECK.HTM。
    label: day === 0 ? '抽選漏れ' : `${day}日目`,
    content: listBody,
  }));

  return (
    <Window
      data-testid="checklist-window"
      title="チェックリスト"
      onClose={onClose}
      onMinimize={onMinimize}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
      style={{ minWidth }}
      statusBar={
        <StatusBar>
          <StatusBarField>{`全 ${totalCount} 件中 ${listRows.length} 件を表示`}</StatusBarField>
          <StatusBarField>{`選択 ${selectedIds.length} 件`}</StatusBarField>
        </StatusBar>
      }
    >
      {/* 実物のツールバー (1WINDOW/3CHECK.HTM) の並び:
          リストロック | 印刷順確定 | RSS | チェック色 1〜9 | チェック解除。
          アイコン ボタンの間仕切りは実物と同じく 1px の溝のセパレータで、色の見出しの
          文字は実物と同じく持たない (「チェック色変更」のラベルは無し)。
          ボタンはすべてアイコンだけにして、名前は aria-label と title (ツールチップ) に
          持たせる。アイコンは実物のツールバー ボタン (PE の RT_BITMAP 130) を SVG 化した
          ものをそのまま使う (RSS だけは実物画像でカーソルに隠れていたため手書き)。 */}
      <ToolbarBand
        data-testid="checklist-toolbar"
        rows={[
          <ToolbarRow key="row" style={TOOLBAR_ROW_LOCAL}>
            <Button
              type="button"
              aria-pressed={locked}
              aria-label="リストロック"
              title={locked ? 'チェックリストの順番のロックを解除' : 'チェックリストの順番のロック'}
              style={
                locked ? { ...TOOLBAR_ICON_BUTTON_STYLE, ...TOOLBAR_PRESSED_STYLE } : TOOLBAR_ICON_BUTTON_STYLE
              }
              onClick={onToggleLock}
            >
              <img src={TOOLBAR_ICONS.listLock} alt="" aria-hidden="true" style={TOOLBAR_ICON_STYLE} />
            </Button>
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            <Button
              type="button"
              aria-label="印刷順確定"
              title="印刷順確定 (位置順に並べ替える)"
              style={TOOLBAR_ICON_BUTTON_STYLE}
              onClick={() => onOrderBy('space')}
            >
              <img src={TOOLBAR_ICONS.printOrder} alt="" aria-hidden="true" style={TOOLBAR_ICON_STYLE} />
            </Button>
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            {/* 実物の RSS ボタン。Web 版は取得処理をダミーで再現する。 */}
            <Button
              type="button"
              aria-label="RSS"
              title="サークルのRSS情報をネットから取得"
              style={TOOLBAR_ICON_BUTTON_STYLE}
              onClick={onFetchRss}
            >
              <img src={TOOLBAR_ICONS.rss} alt="" aria-hidden="true" style={TOOLBAR_ICON_STYLE} />
            </Button>
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            <div style={TOOLBAR_PALETTE_STYLE}>
              {palette.map((hex, index) => {
                const color = (index + 1) as CheckColor;
                const name = colorNames[color - 1] || `色${color}`;
                return (
                  <Button
                    key={color}
                    type="button"
                    data-color={color}
                    aria-label={name}
                    title={name}
                    disabled={!hasSelection}
                    style={TOOLBAR_ICON_BUTTON_STYLE}
                    onClick={() => onSetColor([...selectedIds], color)}
                  >
                    {/* サークルカット ウィンドウの色ボタンと同じアイコン (ui/check-colors.ts)。 */}
                    <img
                      src={checkSwatchIcon(hex)}
                      alt=""
                      aria-hidden="true"
                      style={TOOLBAR_SWATCH_STYLE}
                    />
                  </Button>
                );
              })}
            </div>
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            <Button
              type="button"
              aria-label="チェック解除"
              title="チェックリストから外す"
              disabled={!hasSelection}
              style={TOOLBAR_ICON_BUTTON_STYLE}
              onClick={() => onRemove([...selectedIds])}
            >
              <img src={TOOLBAR_ICONS.checkRemove} alt="" aria-hidden="true" style={TOOLBAR_ICON_STYLE} />
            </Button>
          </ToolbarRow>,
        ]}
      />
      <Tabs
        tabs={tabs}
        activeTab={String(activeDay)}
        onTabChange={(id) => onActiveDayChange(Number(id))}
        // ライブラリ 0.2.4 の fill でタブパネルが親の高さに追従する
        // (以前は height - CHROME_HEIGHT で当て推量していた)。
        fill
        panelClassName="checklist-page"
        style={TABS_STYLE}
      />
    </Window>
  );
}
