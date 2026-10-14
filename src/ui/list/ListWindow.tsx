import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Button,
  Dropdown,
  Groove,
  StatusBar,
  StatusBarField,
  TableView,
  TextBox,
  ToolbarBand,
  ToolbarRow,
  Window,
  useToolbarRows,
} from '@megablacklabel/react98retro';
import type { DropdownOption, TableColumn } from '@megablacklabel/react98retro';
import { TOOLBAR_ICONS } from '../main/toolbar-icons';
import {
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
import type { CheckColor } from '../../app/catalog-state';
import { CHECK_COLOR_IDS, checkColorPalette, checkSwatchIcon } from '../check-colors';
import { DEFAULT_LIST_DISPLAY_SETTINGS, type ListColumnKey } from '../../domain/app-settings';
import { KANA_ROWS, OTHER_KANA_ROW, kanaRowOf } from '../../domain/kana';
import type { Circle, Genre } from '../../domain/types';
import { assetUrl } from '../asset-url';

/** リスト中のカット (32868)。行の高さに収まる小さな画像。 */
const LIST_CUT_STYLE: CSSProperties = {
  display: 'block',
  height: 28,
  width: 'auto',
};

/** 表示モードボックス (1WINDOW/6LIST.HTM) の選択肢。 */
type ListDisplayMode = 'dateBlock' | 'dateIndex' | 'lotteryMiss' | 'searchResults';

export type ListWindowProps = {
  /** カタログの全サークル。日付／ブロック／インデックスの候補と表示内容をここから作る。 */
  circles: readonly Circle[];
  genres: readonly Genre[];
  /** 直前の検索結果。null は未検索。 */
  results: readonly Circle[] | null;
  selectedId: number | null;
  status: string;
  onSelect: (id: number | null) => void;
  onOpenDetail: (id: number) => void;
  /** 簡易検索 (簡易検索ボックスでリターンキー)。キーワード以外の条件は呼び出し側が引き継ぐ。 */
  onSearch: (keywords: string) => void;
  /** 検索ボタン。検索ダイアログを開く。 */
  onOpenSearch: () => void;
  /** リストロック (順番入れ替え・ソートのロック)。 */
  locked: boolean;
  onToggleLock: () => void;
  /** 色1〜色9 の名称 (index 0 が「色1」)。空文字なら「色N」。 */
  colorNames: readonly string[];
  onSetColor: (ids: number[], color: CheckColor) => void;
  onRemove: (ids: number[]) => void;
  onClose: () => void;
  /** タイトルバーの最小化 (アイコン化)。動作設定 1714「個別窓のアイコン化を連動する」。 */
  onMinimize?: () => void;
  /** 「色の設定」の表示色 (動作設定)。未指定なら実物から実測した色。 */
  checkColors?: readonly string[];
  /** 「リスト表示」の設定 (動作設定 210)。一覧に出す列と並び。 */
  visibleColumns?: readonly ListColumnKey[];
  /**
   * 動作設定 1022「選択サークルのブロックが変わった際にサークル一覧の表示も追従する」。
   * null 以外なら、その日付 / ブロックの表示へ切り替える (アプリ側が選択サークルから決める)。
   */
  followDay?: number | null;
  followBlockId?: number | null;
  /** 表示 > リスト中のカット表示 (32868)。行の先頭にカット画像の列を足す。 */
  showCuts?: boolean;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** TableView は文字列 id を要求するため、元の数値 ID は circleId に持たせる。 */
type ListRow = Omit<Circle, 'id'> & { id: string; circleId: number };

/**
 * ツールバーの項目 1 個。id は data-testid の接尾辞と計測の索引に使う。
 * separatorBefore を立てた項目は、直前の項目との間に区切り線を置く (段の先頭では出さない)。
 * keepWithNext を立てた項目は、次の項目が同じ段に入らないなら自分も次の段の先頭へ回す。
 */
type ToolbarItem = {
  id: string;
  node: ReactNode;
  separatorBefore?: boolean;
  keepWithNext?: boolean;
};

/** 表示モードボックスの選択肢 (リソース文字列 0x1a7e80〜0x1a7ebc と同じ並び)。 */
const MODE_OPTIONS: DropdownOption[] = [
  { value: 'dateBlock', label: '日付／ブロック指定' },
  { value: 'dateIndex', label: '日付／インデックス' },
  { value: 'lotteryMiss', label: '抽選漏れサークル' },
  { value: 'searchResults', label: '検索結果' },
];

const CHECK_COLORS = CHECK_COLOR_IDS;

const TABLE_STYLE = { flex: '1 1 auto', minHeight: 0 } as const;

/**
 * ツールバー 1 段分の、このウィンドウ固有の見た目。帯 (外周の溝)・段の並び (flex)・
 * 背景・折り返しの許可はライブラリの `ToolbarBand` / `ToolbarRow` が持つので、
 * ここは段の左右の余白と項目の間隔だけを決める。段分けは計測して決めるので、
 * 計測できないときはライブラリの CSS の折り返し (flex-wrap: wrap) に任せる。
 */
const TOOLBAR_ROW_LOCAL: CSSProperties = {
  padding: `0 ${TOOLBAR_PADDING_X}px`,
  gap: TOOLBAR_ITEM_GAP,
  whiteSpace: 'nowrap',
};

/** ツールバーの項目 1 個。ラベルとコントロールは段をまたがないようまとめて持つ。 */
const TOOLBAR_ITEM_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: TOOLBAR_ITEM_GAP,
  flexShrink: 0,
};

/** 簡易検索ボックスの幅 (元実装のエディット 32802 と同じ 1 行入力)。 */
const QUICK_SEARCH_INPUT_STYLE: CSSProperties = { width: 160 };

/**
 * サークル一覧ウィンドウ (1WINDOW/6LIST.HTM)。ツールバーで表示モード (日付／ブロック指定・
 * 日付／インデックス・抽選漏れサークル・検索結果) を切り替え、検索結果やデータベースの
 * 全サークルをリスト形式で表示する。
 */
export function ListWindow({
  circles,
  genres,
  results,
  selectedId,
  status,
  onSelect,
  onOpenDetail,
  onSearch,
  onOpenSearch,
  locked,
  onToggleLock,
  colorNames,
  onSetColor,
  onRemove,
  onClose,
  onMinimize,
  checkColors,
  visibleColumns = DEFAULT_LIST_DISPLAY_SETTINGS.list,
  followDay = null,
  followBlockId = null,
  showCuts = false,
  initialX = 120,
  initialY = 90,
  width = 920,
  height = 460,
  zIndex,
}: ListWindowProps) {
  // 色ボタン (色1〜9) の色。「色の設定」(動作設定) を反映する。
  const palette = checkColorPalette(checkColors);
  const [mode, setMode] = useState<ListDisplayMode>(() =>
    results === null ? 'dateBlock' : 'searchResults',
  );
  const [day, setDay] = useState<number | null>(null);
  const [blockId, setBlockId] = useState<number | null>(null);
  const [kanaRow, setKanaRow] = useState<string | null>(null);
  const [keywords, setKeywords] = useState('');
  /** リストビューの選択 (チェック色変更・チェック解除はこの ID 全部に効く)。 */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  /** 直前に選択としてアプリへ通知した ID (外からの選択変更と区別する)。 */
  const notifiedRef = useRef<number | null>(null);

  // 検索結果が出たら一覧は検索結果表示に切り替わる
  // (3SEARCH/1SEARCH.HTM「検索結果は、サークル一覧ウィンドウに表示されます」)。
  useEffect(() => {
    if (results !== null) setMode('searchResults');
  }, [results]);

  // カット・マップ側でサークルを選び直したら、その 1 件を選択にする。
  useEffect(() => {
    if (selectedId === null || selectedId === notifiedRef.current) return;
    setSelectedIds([selectedId]);
  }, [selectedId]);

  // 動作設定 1022: 選んだサークルの日付 / ブロックに一覧の表示を合わせる。
  useEffect(() => {
    if (followDay === null) return;
    setMode('dateBlock');
    setDay(followDay);
  }, [followDay]);

  useEffect(() => {
    if (followBlockId === null) return;
    setBlockId(followBlockId);
  }, [followBlockId]);


  // 日付・ブロック・インデックスの選択肢はデータから作る (ハードコードしない)。
  const days = new Set<number>();
  for (const circle of circles) {
    if (circle.day > 0) days.add(circle.day);
  }
  const dayOptions: DropdownOption[] = [...days]
    .sort((a, b) => a - b)
    .map((value) => ({ value: String(value), label: `${value}日目` }));

  // ブロックは日付ごとに違う (元実装の「金曜日 / 西2壁」も 1 日目のブロック) ので、
  // 選んだ日付のサークルから作る。読みのインデックスも同じ理由で日付ごとに作る。
  const activeDay = day ?? Number(dayOptions[0]?.value ?? 0);
  const dayCircles = circles.filter((circle) => circle.day === activeDay);

  const blocks = new Set<number>();
  const kanaRowLabels = new Set<string>();
  for (const circle of dayCircles) {
    if (circle.blockId > 0) blocks.add(circle.blockId);
    kanaRowLabels.add(kanaRowOf(circle.circleKana));
  }
  const blockOptions: DropdownOption[] = [...blocks].sort((a, b) => a - b).map((value) => ({
    // ブロックの表示はサークル詳細と同じく blockId 1 が A。
    value: String(value),
    label: String.fromCharCode(0x40 + value),
  }));
  const kanaRowOptions: DropdownOption[] = [...KANA_ROWS.map((row) => row.label), OTHER_KANA_ROW]
    .filter((label) => kanaRowLabels.has(label))
    .map((label) => ({ value: label, label }));

  // 未選択・選択肢から外れた値なら先頭の候補にする (コンボの表示と中身をずらさない)。
  const activeBlockId = blockOptions.some((option) => option.value === String(blockId))
    ? (blockId as number)
    : Number(blockOptions[0]?.value ?? 0);
  const activeKanaRow = kanaRowOptions.some((option) => option.value === kanaRow)
    ? (kanaRow as string)
    : kanaRowOptions[0]?.value ?? '';

  let shown: readonly Circle[];
  switch (mode) {
    case 'dateIndex':
      shown = dayCircles.filter((circle) => kanaRowOf(circle.circleKana) === activeKanaRow);
      break;
    case 'lotteryMiss':
      shown = circles.filter((circle) => circle.day === 0);
      break;
    case 'searchResults':
      shown = results ?? [];
      break;
    default:
      shown = dayCircles.filter((circle) => circle.blockId === activeBlockId);
  }

  const genreNames: Record<number, string> = {};
  for (const genre of genres) genreNames[genre.id] = genre.name;

  /** 列 1 本の定義。「リスト表示」の設定 (動作設定 210) の並びで表示する列だけを並べる。 */
  const columnDefs: Record<Exclude<ListColumnKey, 'color'>, TableColumn<ListRow>> = {
    name: { key: 'circleName', header: 'サークル名', width: 200 },
    kana: { key: 'circleKana', header: '読み', width: 110 },
    pen: { key: 'penName', header: '執筆者', width: 140 },
    book: { key: 'bookName', header: '発行誌', width: 150 },
    description: {
      key: 'description',
      header: '補足',
      width: 140,
      render: (_value, row) => (row.description === '' ? '—' : row.description),
    },
    memo: { key: 'memo', header: 'メモ', width: 140, render: (_value, row) => (row.memo === '' ? '—' : row.memo) },
    space: {
      key: 'spaceNo',
      header: '位置',
      width: 70,
      render: (_value, row) => `${row.spaceNo}${row.spaceNoSub === 1 ? 'b' : 'a'}`,
    },
    day: {
      key: 'day',
      header: '日付',
      width: 80,
      render: (_value, row) => (row.day === 0 ? '抽選漏れ' : `${row.day}日目`),
    },
    genre: {
      key: 'genreId',
      header: 'ジャンル',
      width: 130,
      render: (_value, row) => genreNames[row.genreId] ?? String(row.genreId),
    },
  };

  const columns: readonly TableColumn<ListRow>[] = [
    // 表示 > リスト中のカット表示 (32868) を入れると、行の先頭にカット画像の列が出る。
    ...(showCuts
      ? [
          {
            key: 'circleId' as const,
            header: 'カット',
            width: 60,
            render: (_value: string | number, row: ListRow) => (
              <img
                data-testid="list-cut"
                src={assetUrl(`/cuts/${row.circleId}.png`)}
                alt=""
                draggable={false}
                style={LIST_CUT_STYLE}
              />
            ),
          },
        ]
      : []),
    // チェック色はサークル一覧の行に持たせていないので、この一覧では出さない。
    ...visibleColumns
      .filter((key): key is Exclude<ListColumnKey, 'color'> => key !== 'color')
      .map((key) => columnDefs[key]),
  ];

  const rows: ListRow[] = shown.map((circle) => ({
    ...circle,
    id: String(circle.id),
    circleId: circle.id,
  }));

  const hasSelection = selectedIds.length > 0;
  const dayEnabled = mode === 'dateBlock' || mode === 'dateIndex';

  const handleSelectionChange = (ids: string[]) => {
    const numbers = ids.map(Number);
    setSelectedIds(numbers);
    notifiedRef.current = numbers[0] ?? null;
    onSelect(numbers[0] ?? null);
  };

  // ツールバーの項目 (1WINDOW/6LIST.HTM の並び)。ラベルとコントロールは段をまたがないよう
  // まとめて 1 項目にしている。項目の区切りはチェックリストと同じく 1px の溝の線で、
  // 段をまたぐ位置には出さない (次の項目に前置きする)。
  const toolbarItems: readonly ToolbarItem[] = [
    {
      id: 'mode',
      node: (
        <>
          <span>表示モード：</span>
          <Dropdown
            aria-label="表示モード"
            data-ctrl-id={132}
            data-testid="list-mode"
            options={MODE_OPTIONS}
            value={mode}
            onChange={(event) => setMode(event.target.value as ListDisplayMode)}
          />
        </>
      ),
    },
    {
      id: 'day',
      node: (
        <Dropdown
          aria-label="日付"
          data-ctrl-id={133}
          data-testid="list-day"
          options={dayOptions}
          value={String(activeDay)}
          disabled={!dayEnabled}
          onChange={(event) => setDay(Number(event.target.value))}
        />
      ),
    },
    {
      id: 'blockIndex',
      node:
        mode === 'dateIndex' ? (
          <Dropdown
            aria-label="インデックス"
            data-ctrl-id={131}
            data-testid="list-index"
            options={kanaRowOptions}
            value={activeKanaRow}
            onChange={(event) => setKanaRow(event.target.value)}
          />
        ) : (
          <Dropdown
            aria-label="ブロック"
            data-ctrl-id={131}
            data-testid="list-block"
            options={blockOptions}
            value={String(activeBlockId)}
            disabled={mode !== 'dateBlock'}
            onChange={(event) => setBlockId(Number(event.target.value))}
          />
        ),
    },
    {
      id: 'search',
      separatorBefore: true,
      node: (
        // 実物のツールバーと同じ虫めがねのアイコンだけのボタン (文字は持たない)。
        <Button
          type="button"
          data-testid="list-search"
          aria-label="検索"
          title="サークルを検索"
          style={TOOLBAR_ICON_BUTTON_STYLE}
          onClick={onOpenSearch}
        >
          <img src={TOOLBAR_ICONS.search} alt="" aria-hidden="true" style={TOOLBAR_ICON_STYLE} />
        </Button>
      ),
    },
    {
      id: 'quick',
      node: (
        <TextBox
          aria-label="簡易検索"
          title="簡易検索 (キーワードを入れてリターンキー)"
          data-ctrl-id={32802}
          data-testid="list-quick-search"
          style={QUICK_SEARCH_INPUT_STYLE}
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSearch(keywords);
          }}
        />
      ),
    },
    {
      id: 'lock',
      separatorBefore: true,
      // 色パレットが次の段へ回るときは、ソートのロックをその段の先頭に置く。
      keepWithNext: true,
      node: (
        // 実物のツールバーのアイコン (南京錠) だけのボタン (チェックリストと同じデザイン)。
        <Button
          type="button"
          data-testid="list-lock"
          aria-label="リストロック"
          aria-pressed={locked}
          title={locked ? 'リストのソートのロックを解除' : 'リストのソートのロック'}
          style={locked ? { ...TOOLBAR_ICON_BUTTON_STYLE, ...TOOLBAR_PRESSED_STYLE } : TOOLBAR_ICON_BUTTON_STYLE}
          onClick={onToggleLock}
        >
          <img src={TOOLBAR_ICONS.listLock} alt="" aria-hidden="true" style={TOOLBAR_ICON_STYLE} />
        </Button>
      ),
    },
    {
      id: 'color',
      separatorBefore: true,
      node: (
        // チェックリストと同じく色の見出しの文字は持たない (パレットだけを並べる)。
        <div style={TOOLBAR_PALETTE_STYLE}>
          {CHECK_COLORS.map((color) => {
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
                  src={checkSwatchIcon(palette[color - 1])}
                  alt=""
                  aria-hidden="true"
                  style={TOOLBAR_SWATCH_STYLE}
                />
              </Button>
            );
          })}
        </div>
      ),
    },
    {
      id: 'remove',
      separatorBefore: true,
      node: (
        // サークルカット ウィンドウの「チェックリストから外す」と同じアイコン (×) だけのボタン。
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
      ),
    },
  ];

  // ツールバーの段分け。実物の一覧ウィンドウのツールバーは 1 本だが、Web 版は色 1〜9 の
  // ボタンを並べるため 1 行に収まらないので、入りきらない項目を次の段へ回す。幅は
  // レイアウト後にしか分からないので、ライブラリの useToolbarRows が計測して詰める
  // (計測できないときは 1 段のまま CSS の折り返しに任せる。考え方は MainWindow と同じ)。
  const {
    stripRef,
    itemRefs,
    rows: toolbarRows,
  } = useToolbarRows({
    count: toolbarItems.length,
    gap: TOOLBAR_ITEM_GAP,
    paddingX: TOOLBAR_PADDING_X,
    keepWithNext: toolbarItems.map((item) => item.keepWithNext === true),
    // 区切り線は項目の外側 (前) に付くので、段詰めの幅には足しておく。
    measure: (element, index) =>
      element.getBoundingClientRect().width +
      (toolbarItems[index].separatorBefore ? TOOLBAR_SEPARATOR_WIDTH : 0),
  });

  return (
    <div data-testid="list-window">
      <Window
        title="サークル一覧"
        onClose={onClose}
        onMinimize={onMinimize}
        width={width}
        height={height}
        initialX={initialX}
        initialY={initialY}
        zIndex={zIndex}
        statusBar={
          <StatusBar>
            <StatusBarField>{status}</StatusBarField>
            <StatusBarField>{`表示 ${rows.length} 件`}</StatusBarField>
          </StatusBar>
        }
      >
        <ToolbarBand
          ref={stripRef}
          data-testid="list-toolbar"
          rows={toolbarRows.map((row) => (
            <ToolbarRow key={row[0]} data-testid="list-toolbar-row" style={TOOLBAR_ROW_LOCAL}>
              {row.map((itemIndex, columnIndex) => {
                const item = toolbarItems[itemIndex];
                return (
                  <Fragment key={item.id}>
                    {/* 段の先頭には区切り線を出さない (チェックリストと同じ 1px の溝)。 */}
                    {item.separatorBefore && columnIndex > 0 ? (
                      <Groove
                        orientation="vertical"
                        data-testid="list-toolbar-separator"
                        style={TOOLBAR_SEPARATOR_STYLE}
                      />
                    ) : null}
                    <div
                      data-testid={`list-toolbar-item-${item.id}`}
                      data-separator-before={item.separatorBefore ? 'true' : undefined}
                      data-keep-with-next={item.keepWithNext ? 'true' : undefined}
                      ref={(element) => {
                        itemRefs.current[itemIndex] = element;
                      }}
                      style={TOOLBAR_ITEM_STYLE}
                    >
                      {item.node}
                    </div>
                  </Fragment>
                );
              })}
            </ToolbarRow>
          ))}
        />
        <TableView<ListRow>
          columns={columns}
          rows={rows}
          selectedIds={selectedIds.map(String)}
          onSelectionChange={handleSelectionChange}
          onRowDoubleClick={(row) => onOpenDetail(row.circleId)}
          height="100%"
          style={TABLE_STYLE}
        />
      </Window>
    </div>
  );
}
