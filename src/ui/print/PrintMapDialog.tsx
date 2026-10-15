import { useState, type ChangeEvent, type CSSProperties } from 'react';
import {
  Button,
  Checkbox,
  Dropdown,
  GroupBox,
  OptionButton,
  Window,
} from '@megablacklabel/react98retro';
import { DEFAULT_PRINT_TARGET, type PrintTarget } from './PrintListDialog';

/** マップ印刷 / 白地図印刷の詳細設定 (元ダイアログ 165 / 166 の各コントロール)。 */
export type PrintMapSettings = {
  /** 印刷範囲: 日付 (1280-1284 / 1380-1384) / ホール (1290-1318 / 1390-1418) / チェック色 (1330-1338)。 */
  target: PrintTarget;
  /** 印刷項目リスト (1344, 表示名)。地図＋リスト / 地図＋カットのときに印刷する項目。 */
  items: string[];
  /** 補足を拡大 (1726) / メモを拡大 (1727)。 */
  enlargeDescription: boolean;
  enlargeMemo: boolean;
  /** 印刷順 (1339)。CHM 4PRINT/4MAP.HTM の 5 種。 */
  pageBreakOrder: 'checklist' | 'space' | 'name' | 'color' | 'coordinate';
  /** 改ページ条件 (1340-1343)。 */
  pageBreakBy: 'day' | 'hall' | 'block' | 'color';
  /** レイアウト (1345)。exe の文字列と同じ 10 タイプ。 */
  layout:
    | 'landscapeColor'
    | 'landscapeList'
    | 'landscapeCutSmall'
    | 'landscapeCutMedium'
    | 'landscapeCutLarge'
    | 'portraitColor'
    | 'portraitList'
    | 'portraitCutSmall'
    | 'portraitCutMedium'
    | 'portraitCutLarge';
  /** サークル通し番号の印刷 (1348) / チェック色一覧の印刷 (1349)。 */
  printSequenceNumber: boolean;
  printColorLegend: boolean;
  /** ジャンルを重ねて印刷 (1352 / 1451)。 */
  overlayGenre: boolean;
  /** ジャンルを重ねる濃さ % (濃度 1353-1355 / 1452-1454)。 */
  overlayDensity: number;
  /** 略図マップの印刷 (1356 / 1456) / 略図を地図表示に合わせて回転 (1357 / 1457)。 */
  printSketchMap: boolean;
  rotateSketchMap: boolean;
  /** 地図詰めの方向 (1359 / 1459)。 */
  mapPacking: 'leftBottom' | 'rightBottom' | 'center' | 'leftTop' | 'rightTop';
  /** 指示線の太さ (1351) と、指示線を引く色 (1370-1378)。 */
  indicatorWidth: 'none' | 'thin' | 'medium' | 'thick';
  indicatorColors: number[];
  /** true なら白地図印刷 (元ダイアログ 166)。 */
  blank: boolean;
};

export type PrintMapDialogProps = {
  settings: PrintMapSettings;
  /** 変更された項目だけを渡す。 */
  onChange: (patch: Partial<PrintMapSettings>) => void;
  /** プレビュー。現在の設定をそのまま渡す。 */
  onPreview: (settings: PrintMapSettings) => void;
  /** 閉じる。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** タブの中身 (元ダイアログ 165 / 166 のクライアント領域)。Window は含まない。 */
type PrintMapPageProps = {
  settings: PrintMapSettings;
  /** 変更された項目だけを渡す。 */
  onChange: (patch: Partial<PrintMapSettings>) => void;
  /** プレビュー。 */
  onPreview: () => void;
};

type DayOption = { day: number; label: string };
type ColorOption = { color: number; controlId: number; swatchId: number };
type PageBreakOrder = PrintMapSettings['pageBreakOrder'];
type PageBreakBy = PrintMapSettings['pageBreakBy'];
type PrintMapLayout = PrintMapSettings['layout'];
type PrintMapPacking = PrintMapSettings['mapPacking'];
type PrintIndicatorWidth = PrintMapSettings['indicatorWidth'];

/** 印刷項目リスト (元リソース 165 の 1344 に並ぶ項目)。 */
const PRINT_ITEMS: readonly string[] = [
  'サークル名',
  '読み',
  '執筆者',
  '発行誌',
  '位置',
  '日付',
  'ジャンル',
];

/** 日付チェックボックス (元リソース 165 の 1280-1284 / 166 の 1380-1384)。抽選漏れは 0。 */
const DAY_OPTIONS: readonly DayOption[] = [
  { day: 1, label: '1日目' },
  { day: 2, label: '2日目' },
  { day: 3, label: '3日目' },
  { day: 4, label: '4日目' },
  { day: 0, label: '抽選漏れ' },
];

/**
 * ホールチェックボックス (元リソース 165 の 1290-1318 / 166 の 1390-1418)。
 * 元の並びと同じ 3 列で、3 列目はホールを連結した地図。
 */
const HALL_COLUMNS: readonly (readonly string[])[] = [
  ['東1', '東2', '東3', '東4', '東5', '東6', '東7･8'],
  ['西1', '西2', '西3･4', '南1', '南2', '南3', '南4'],
  ['東123', '東456', '西12', '南12', '南34'],
];

/**
 * チェック色チェックボックス (元リソース 165 の 1330-1338) と、その左に並ぶ見本色
 * (1320-1328, 元は #130 のオーナードロー)。元の並びと同じ 2 列。
 */
const COLOR_COLUMNS: readonly (readonly ColorOption[])[] = [
  [
    { color: 1, controlId: 1330, swatchId: 1320 },
    { color: 2, controlId: 1331, swatchId: 1321 },
    { color: 3, controlId: 1332, swatchId: 1322 },
    { color: 4, controlId: 1333, swatchId: 1323 },
    { color: 5, controlId: 1334, swatchId: 1324 },
  ],
  [
    { color: 6, controlId: 1335, swatchId: 1325 },
    { color: 7, controlId: 1336, swatchId: 1326 },
    { color: 8, controlId: 1337, swatchId: 1327 },
    { color: 9, controlId: 1338, swatchId: 1328 },
  ],
];

/**
 * 指示線の色チェックボックス (元リソース 165 の 1370-1378) と、その左に並ぶ見本色
 * (1360-1368, 元は #130 のオーナードロー)。元の並びと同じ 2 列。
 */
const INDICATOR_COLOR_COLUMNS: readonly (readonly ColorOption[])[] = [
  [
    { color: 1, controlId: 1370, swatchId: 1360 },
    { color: 2, controlId: 1371, swatchId: 1361 },
    { color: 3, controlId: 1372, swatchId: 1362 },
    { color: 4, controlId: 1373, swatchId: 1363 },
    { color: 5, controlId: 1374, swatchId: 1364 },
  ],
  [
    { color: 6, controlId: 1375, swatchId: 1365 },
    { color: 7, controlId: 1376, swatchId: 1366 },
    { color: 8, controlId: 1377, swatchId: 1367 },
    { color: 9, controlId: 1378, swatchId: 1368 },
  ],
];

/** チェック色の見本色 (ChecklistWindow / CheckColorDialog と同じ値)。 */
const COLOR_SWATCHES: Record<number, string> = {
  1: '#ff0000',
  2: '#ff8000',
  3: '#ffff00',
  4: '#008000',
  5: '#00ffff',
  6: '#0000c0',
  7: '#800080',
  8: '#ff00ff',
  9: '#808080',
};

/**
 * レイアウトコンボ (元リソース 165 / 166 の 1345)。
 * exe の文字列 (0x1a4cec〜0x1a4dbc) と同じ 10 タイプ (横向き / 縦向き × 5)。
 */
const LAYOUT_OPTIONS: readonly { value: PrintMapLayout; label: string }[] = [
  { value: 'landscapeColor', label: '横向き地図＋チェック色' },
  { value: 'landscapeList', label: '横向き地図＋リスト' },
  { value: 'landscapeCutSmall', label: '横向き地図＋カット小' },
  { value: 'landscapeCutMedium', label: '横向き地図＋カット中' },
  { value: 'landscapeCutLarge', label: '横向き地図＋カット大' },
  { value: 'portraitColor', label: '縦向き地図＋チェック色' },
  { value: 'portraitList', label: '縦向き地図＋リスト' },
  { value: 'portraitCutSmall', label: '縦向き地図＋カット小' },
  { value: 'portraitCutMedium', label: '縦向き地図＋カット中' },
  { value: 'portraitCutLarge', label: '縦向き地図＋カット大' },
];

/** 印刷順コンボ (元リソース 165 / 166 の 1339)。CHM 4PRINT/4MAP.HTM の並び。 */
const ORDER_OPTIONS: readonly { value: PageBreakOrder; label: string }[] = [
  { value: 'checklist', label: 'チェックリスト順' },
  { value: 'space', label: '配置順' },
  { value: 'name', label: 'サークル名順' },
  { value: 'color', label: '色順' },
  { value: 'coordinate', label: '配置座標順' },
];

/** 改ページ条件 (元リソース 165 の 1340-1343)。元の並びは 日付 / ホール / ブロック / チェック色。 */
const PAGE_BREAK_OPTIONS: readonly { by: PageBreakBy; label: string; controlId: number }[] = [
  { by: 'day', label: '日付', controlId: 1340 },
  { by: 'hall', label: 'ホール', controlId: 1341 },
  { by: 'block', label: 'ブロック', controlId: 1343 },
  { by: 'color', label: 'チェック色', controlId: 1342 },
];

/**
 * 地図詰めの方向コンボ (元リソース 165 の 1359 / 166 の 1459)。
 * exe の文字列 (0x1a4de4〜0x1a4e14) と同じ並び。既定は元の並びの先頭。
 */
const PACKING_OPTIONS: readonly { value: PrintMapPacking; label: string }[] = [
  { value: 'leftBottom', label: '左下' },
  { value: 'rightBottom', label: '右下' },
  { value: 'center', label: '中央' },
  { value: 'leftTop', label: '左上' },
  { value: 'rightTop', label: '右上' },
];

/**
 * 指示線の太さコンボ (元リソース 165 の 1351)。
 * CHM 4PRINT/4MAP.HTM の「なし」「細」「中」「太」。既定は先頭の「なし」。
 */
const INDICATOR_WIDTH_OPTIONS: readonly { value: PrintIndicatorWidth; label: string }[] = [
  { value: 'none', label: 'なし' },
  { value: 'thin', label: '細' },
  { value: 'medium', label: '中' },
  { value: 'thick', label: '太' },
];

/** 濃度 (元リソース 165 の 1353-1355 / 166 の 1452-1454) の指定範囲。 */
const DENSITY_MIN = 1;
const DENSITY_MAX = 100;

export const DEFAULT_PRINT_MAP_SETTINGS: PrintMapSettings = {
  target: DEFAULT_PRINT_TARGET,
  items: [...PRINT_ITEMS],
  enlargeDescription: false,
  enlargeMemo: false,
  pageBreakOrder: 'checklist',
  pageBreakBy: 'day',
  layout: 'landscapeColor',
  printSequenceNumber: false,
  printColorLegend: false,
  overlayGenre: false,
  overlayDensity: 50,
  printSketchMap: false,
  rotateSketchMap: false,
  mapPacking: 'leftBottom',
  indicatorWidth: 'none',
  indicatorColors: INDICATOR_COLOR_COLUMNS.flat().map((option) => option.color),
  blank: false,
};

/**
 * 165 (マップ印刷) と 166 (白地図印刷) で同じ用途のコントロールの ID。
 * 両方で同じ ID のもの (1345 のレイアウトコンボ) はそのまま使い、資源が別 ID のものだけ
 * ここで切り替える。
 */
type DialogIds = {
  /** 日付のチェック (1280 / 1380, 以降は +1 ずつ)。 */
  dayFirst: number;
  /** ホールのチェック (1290-1318 / 1390-1418) を 3 列で並べたもの。 */
  hallColumns: readonly (readonly number[])[];
  /** レイアウトの見本枠 (1346 / 1446)。 */
  layoutFrame: number;
  /** ジャンルを重ねて印刷 (1352 / 1451)。 */
  overlayGenre: number;
  /** 濃度の見出し (1354 / 1453)・値 (1353 / 1452)・単位 (1355 / 1454)。 */
  densityLabel: number;
  densityValue: number;
  densityUnit: number;
  /** 略図マップの印刷 (1356 / 1456) と 略図を地図表示に合わせて回転 (1357 / 1457)。 */
  sketchMap: number;
  rotateSketch: number;
  /** 地図詰めの方向の見出し (1358 / 1458) とコンボ (1359 / 1459)。 */
  packingLabel: number;
  packing: number;
  /** プレビュー (1347 / 1447)。 */
  preview: number;
};

/** ダイアログ 165 (マップ印刷) の ID。 */
const MAP_IDS: DialogIds = {
  dayFirst: 1280,
  hallColumns: [
    [1290, 1291, 1292, 1295, 1294, 1293, 1299],
    [1297, 1296, 1298, 1301, 1300, 1303, 1302],
    [1312, 1313, 1314, 1317, 1318],
  ],
  layoutFrame: 1346,
  overlayGenre: 1352,
  densityLabel: 1354,
  densityValue: 1353,
  densityUnit: 1355,
  sketchMap: 1356,
  rotateSketch: 1357,
  packingLabel: 1358,
  packing: 1359,
  preview: 1347,
};

/** ダイアログ 166 (白地図印刷) の ID。 */
const BLANK_IDS: DialogIds = {
  dayFirst: 1380,
  hallColumns: [
    [1390, 1391, 1392, 1395, 1394, 1393, 1399],
    [1397, 1396, 1398, 1401, 1400, 1403, 1402],
    [1412, 1413, 1414, 1417, 1418],
  ],
  layoutFrame: 1446,
  overlayGenre: 1451,
  densityLabel: 1453,
  densityValue: 1452,
  densityUnit: 1454,
  sketchMap: 1456,
  rotateSketch: 1457,
  packingLabel: 1458,
  packing: 1459,
  preview: 1447,
};

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 4,
  overflow: 'auto',
  // 親 (window-body) は block なので flex では伸びない。プレビュー ボタンを
  // タブ ページの下端へ寄せるため、親の高さいっぱいまで伸ばす。
  minHeight: '100%',
  flex: '1 1 auto',
};

/** ダイアログ本体 (Window の中): ページと閉じるボタンを縦に並べる。 */
const DIALOG_BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minHeight: 0,
};

const DIALOG_FOOTER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  flex: '0 0 auto',
};

const TOP_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  // 同じ段のグループは高さを揃える (実物は 1 段目 273、2 段目 213)。
  alignItems: 'stretch',
  gap: 8,
};

const RANGE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: 6,
};

/** チェックボックス 1 列分。 */
/**
 * チェックボックス 1 列分。
 * 行の間隔は実物の実測 (1 行 30px ピッチ) に合わせる。
 */
const CHECK_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  rowGap: 11,
};

/** 改ページ (実物は 131x213 の縦長): 印刷順と改ページ条件を縦に積む。 */
const BREAK_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  rowGap: 4,
};

const COLUMNS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  columnGap: 8,
};

/** 見本色とチェックボックスを 1 行に並べる (元の #130 と auto-check の組)。 */
const COLOR_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  columnGap: 2,
};

/** ラベル付きの 1 行 (濃度など)。 */
const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  columnGap: 4,
};

/** 見本色 (元は #130 のオーナードロー)。 */
const SWATCH_STYLE: CSSProperties = {
  display: 'inline-block',
  width: 13,
  height: 13,
  border: '1px solid #808080',
  flex: '0 0 auto',
};

const LABEL_STYLE: CSSProperties = { fontSize: 12 };

/** 濃度の値 (元は 1353 / 1452 のエディット)。 */
const DENSITY_INPUT_STYLE: CSSProperties = {
  width: 35,
  textAlign: 'right',
  flex: '0 0 auto',
};

const ITEM_LIST_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  rowGap: 2,
  overflowY: 'auto',
  maxHeight: 150,
  border: '1px solid #808080',
  background: '#ffffff',
  padding: 2,
};

/** レイアウト: 左にコンボ (1345) と見本枠、中にチェック類、右に指示線。 */
const LAYOUT_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  // 実物の「レイアウト」は 500px 幅に 3 列 (見本 147 / チェック / 指示線) が入る。
  // Web 版はフォント幅が広いぶん、列間を詰めて同じ幅に収める。
  columnGap: 4,
};

/** レイアウトのコンボとその下の見本枠を縦に並べる。 */
const LAYOUT_SAMPLE_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  rowGap: 1,
  alignItems: 'flex-start',
};

/** 1346 / 1446: レイアウトの見本枠 (資源ではテキストが空の #130 Static, 142 x 90)。 */
const LAYOUT_FRAME_STYLE: CSSProperties = {
  // 元リソース 1346 / 1446 の Static の実測 (147x117)。
  width: 147,
  height: 117,
  border: '1px solid #808080',
  background: '#ffffff',
};

/** 166 の注記 (元は ID を持たない #130 Static が 3 行)。 */
const NOTE_STYLE: CSSProperties = { fontSize: 11, lineHeight: 1.1, color: '#404040' };

/** 166 (白地図印刷) の 2 列 (左: 印刷範囲 + 注記 / 右: レイアウト系)。 */
const BLANK_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 14,
};

const BLANK_LEFT_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flex: '0 0 auto',
};

/**
 * 166 の右列。実測ではコンボ / 見本枠は 147px 幅のまま、列はページ右端まで使うので、
 * 「ジャンルを重ねて印刷 + 濃度」が 1 行に収まる (実測 y=196 に同居)。
 * 各行の間隔は実測 26px ピッチ。
 */
const BLANK_RIGHT_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  rowGap: 5,
  flex: '1 1 auto',
  minWidth: 0,
};

/** 「ジャンルを重ねて印刷」+「濃度」の 1 行。 */
const GENRE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  columnGap: 8,
  flexWrap: 'nowrap',
};

/** 「略図を地図表示に合わせて回転」は 1 段インデント (実測 +18px)。 */
const SKETCH_INDENT_STYLE: CSSProperties = { marginLeft: 18 };

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
  // 実物は本文の直後ではなく、タブ ページの下端右に置く (実測 rel y=535)。
  marginTop: 'auto',
  paddingTop: 6,
};

type DensityFieldProps = {
  ids: DialogIds;
  value: number;
  onChange: (value: number) => void;
};

/** 濃度 (元リソース 165 の 1353-1355 / 166 の 1452-1454)。空欄や範囲外では onChange を呼ばない。 */
function DensityField({ ids, value, onChange }: DensityFieldProps) {
  // 入力中は props の値ではなく編集中の文字列を出す (空欄にできるようにするため)。
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setDraft(text);
    const parsed = Number(text.trim());
    if (text.trim() === '' || !Number.isFinite(parsed)) return;
    if (parsed < DENSITY_MIN || parsed > DENSITY_MAX) return;
    onChange(parsed);
  };

  return (
    <div style={ROW_STYLE}>
      <label style={LABEL_STYLE} htmlFor="print-map-density" data-ctrl-id={ids.densityLabel}>
        濃度 :
      </label>
      <input
        id="print-map-density"
        className="text-box"
        type="text"
        inputMode="numeric"
        data-testid="print-map-density"
        data-ctrl-id={ids.densityValue}
        style={DENSITY_INPUT_STYLE}
        title={`${DENSITY_MIN}〜${DENSITY_MAX} の範囲で指定してください`}
        value={draft ?? String(value)}
        onChange={handleChange}
        onBlur={() => setDraft(null)}
      />
      <span style={LABEL_STYLE} data-ctrl-id={ids.densityUnit}>
        %
      </span>
    </div>
  );
}

/**
 * マップ印刷 / 白地図印刷のタブの中身 (元ダイアログ 165 / 166 のクライアント領域)。
 * Window を含まないので、単体でタブに置ける。blank なら 166 (白地図印刷) の見た目になる。
 */
export function PrintMapPage({ settings, onChange, onPreview }: PrintMapPageProps) {
  const { target } = settings;
  // 165 と 166 で同じ用途のコントロールの ID を切り替える。
  const ids = settings.blank ? BLANK_IDS : MAP_IDS;

  /** チェックボックスの入れ外し (元実装と同じく配列の末尾に足す)。 */
  const toggleNumber = (list: readonly number[], value: number): number[] =>
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
  const toggleText = (list: readonly string[], value: string): string[] =>
    list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];

  const handleOrderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = ORDER_OPTIONS.find((option) => option.value === event.target.value);
    if (next === undefined) return;
    onChange({ pageBreakOrder: next.value });
  };

  const handleLayoutChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = LAYOUT_OPTIONS.find((option) => option.value === event.target.value);
    if (next === undefined) return;
    onChange({ layout: next.value });
  };

  const handlePackingChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = PACKING_OPTIONS.find((option) => option.value === event.target.value);
    if (next === undefined) return;
    onChange({ mapPacking: next.value });
  };

  const handleIndicatorWidthChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = INDICATOR_WIDTH_OPTIONS.find((option) => option.value === event.target.value);
    if (next === undefined) return;
    onChange({ indicatorWidth: next.value });
  };

  /** 印刷範囲 (165 の 1280-1350 / 166 の 1380-1418)。チェック色は 165 だけ。 */
  const range = (
    <GroupBox
      legend="印刷範囲"
      style={{
        flex: '0 0 auto',
        // 166 (白地図印刷) はチェック色が無く、内容幅 (実測 315) になる。
        width: settings.blank ? undefined : 470,
        minHeight: 273,
      }}
    >
      <div style={RANGE_ROW_STYLE}>
        {/* 日付 (165 の 1280-1284 / 166 の 1380-1384) */}
        <GroupBox legend="日付" style={{ flex: '0 0 auto' }}>
          <div style={CHECK_COLUMN_STYLE}>
            {DAY_OPTIONS.map((option, index) => (
              <Checkbox
                key={option.day}
                id={`print-map-day-${option.day}`}
                label={option.label}
                checked={target.days.includes(option.day)}
                onChange={() =>
                  onChange({ target: { ...target, days: toggleNumber(target.days, option.day) } })
                }
                data-ctrl-id={ids.dayFirst + index}
              />
            ))}
          </div>
        </GroupBox>
        {/* ホール (165 の 1290-1318 / 166 の 1390-1418) */}
        <GroupBox legend="ホール" style={{ flex: '0 0 auto' }}>
          <div style={COLUMNS_STYLE}>
            {HALL_COLUMNS.map((halls, columnIndex) => (
              <div key={halls[0]} style={CHECK_COLUMN_STYLE}>
                {halls.map((hall, rowIndex) => (
                  <Checkbox
                    key={hall}
                    id={`print-map-hall-${hall}`}
                    label={hall}
                    checked={target.halls.includes(hall)}
                    onChange={() =>
                      onChange({
                        target: { ...target, halls: toggleText(target.halls, hall) },
                      })
                    }
                    data-ctrl-id={ids.hallColumns[columnIndex][rowIndex]}
                  />
                ))}
              </div>
            ))}
          </div>
        </GroupBox>
        {/* チェック色 (1320-1338) と 色の編集 (1350)。元リソース 166 には無い。 */}
        {!settings.blank && (
          <GroupBox legend="チェック色" style={{ flex: '0 0 auto' }}>
            <div style={COLUMNS_STYLE}>
              {COLOR_COLUMNS.map((column) => (
                <div key={column[0].color} style={CHECK_COLUMN_STYLE}>
                  {column.map((option) => (
                    <div key={option.color} style={COLOR_ROW_STYLE}>
                      <span
                        data-ctrl-id={option.swatchId}
                        style={{ ...SWATCH_STYLE, backgroundColor: COLOR_SWATCHES[option.color] }}
                      />
                      <Checkbox
                        id={`print-map-color-${option.color}`}
                        data-testid={`print-map-color-${option.color}`}
                        label={`色${option.color}`}
                        checked={target.colors.includes(option.color)}
                        onChange={() =>
                          onChange({
                            target: {
                              ...target,
                              colors: toggleNumber(target.colors, option.color),
                            },
                          })
                        }
                        data-ctrl-id={option.controlId}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <Button
              data-ctrl-id={1350}
              style={{ marginTop: 4 }}
              disabled
              title="チェック色の編集はチェック色ダイアログで行います"
            >
              色の編集...
            </Button>
          </GroupBox>
        )}
      </div>
    </GroupBox>
  );

  /** 印刷項目 (1344 のリストと 1726 / 1727)。元リソース 166 には無い。 */
  const printItems = (
    <GroupBox legend="印刷項目" style={{ flex: '0 0 auto', width: 161, minHeight: 273 }}>
      {/* 1344: 元は SysListView32 (List1)。Web 版はチェックボックスのリストで出す。 */}
      <div data-ctrl-id={1344} style={ITEM_LIST_STYLE}>
        {PRINT_ITEMS.map((item, index) => (
          <Checkbox
            key={item}
            id={`print-map-item-${index}`}
            label={item}
            checked={settings.items.includes(item)}
            onChange={() => onChange({ items: toggleText(settings.items, item) })}
          />
        ))}
      </div>
      {/* 元実装はリストの下に 4px 空けて置く (1726 / 1727)。 */}
      <div style={{ marginTop: 4 }}>
        <Checkbox
          id="print-map-enlarge-description"
          label="補足を拡大"
          checked={settings.enlargeDescription}
          onChange={(event) => onChange({ enlargeDescription: event.target.checked })}
          data-ctrl-id={1726}
        />
        <Checkbox
          id="print-map-enlarge-memo"
          label="メモを拡大"
          checked={settings.enlargeMemo}
          onChange={(event) => onChange({ enlargeMemo: event.target.checked })}
          data-ctrl-id={1727}
        />
      </div>
    </GroupBox>
  );

  /** 改ページ (1339 のコンボと 1340-1343)。元リソース 166 には無い。 */
  const pageBreak = (
    <GroupBox legend="改ページ" style={{ flex: '0 0 auto', width: 131, minHeight: 213 }}>
      <div style={BREAK_COLUMN_STYLE}>
      <span style={LABEL_STYLE}>印刷順 :</span>
      {/* 1339: 印刷順のコンボ (元は #133)。 */}
      <Dropdown
        id="print-map-order"
        data-testid="print-map-order"
        data-ctrl-id={1339}
        aria-label="印刷順"
        value={settings.pageBreakOrder}
        onChange={handleOrderChange}
      >
        {ORDER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Dropdown>
      <span style={LABEL_STYLE}>改ページ条件 :</span>
      {PAGE_BREAK_OPTIONS.map((option) => (
        <OptionButton
          key={option.by}
          id={`print-map-break-${option.by}`}
          name="print-map-page-break"
          label={option.label}
          checked={settings.pageBreakBy === option.by}
          onChange={() => onChange({ pageBreakBy: option.by })}
          data-ctrl-id={option.controlId}
        />
      ))}
      </div>
    </GroupBox>
  );

  /** レイアウトのコンボ (1345) と見本枠 (1346 / 1446)。165 と 166 で共通。 */
  const layoutSample = (
    <>
      {/* 1345: レイアウトのコンボ (元は #133)。165 と 166 で同じ ID を持つ。 */}
      <Dropdown
        id="print-map-layout"
        data-testid="print-map-layout"
        data-ctrl-id={1345}
        aria-label="レイアウト"
        value={settings.layout}
        onChange={handleLayoutChange}
      >
        {LAYOUT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Dropdown>
      {/*
        1346 / 1446: レイアウトの見本を描く枠 (元はテキストが空の #130 Static, 142 x 90)。
        元実装は実行時にここへレイアウトの見本を描画するが、資源の時点では空。
        Web 版は見本を印刷プレビューで見せるため、枠は空のままにする。
      */}
      <div
        data-ctrl-id={ids.layoutFrame}
        data-testid="print-map-layout-frame"
        style={LAYOUT_FRAME_STYLE}
      />
    </>
  );

  /** 地図詰めの方向 (1358 / 1458 の見出しと 1359 / 1459 のコンボ)。165 と 166 で共通。 */
  const packingRow = (
    <div style={ROW_STYLE}>
      <span data-ctrl-id={ids.packingLabel} style={LABEL_STYLE}>
        地図詰めの方向 :
      </span>
      <Dropdown
        id="print-map-packing"
        data-testid="print-map-packing"
        data-ctrl-id={ids.packing}
        aria-label="地図詰めの方向"
        value={settings.mapPacking}
        onChange={handlePackingChange}
      >
        {PACKING_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Dropdown>
    </div>
  );

  /** ジャンルを重ねて印刷 (1352 / 1451)。165 と 166 で共通。 */
  const genreOverlay = (
    <Checkbox
      id="print-map-overlay-genre"
      label="ジャンルを重ねて印刷"
      checked={settings.overlayGenre}
      onChange={(event) => onChange({ overlayGenre: event.target.checked })}
      data-ctrl-id={ids.overlayGenre}
    />
  );

  /** 濃度 (1353-1355 / 1452-1454)。165 と 166 で共通。 */
  const densityRow = (
    <DensityField
      ids={ids}
      value={settings.overlayDensity}
      onChange={(overlayDensity) => onChange({ overlayDensity })}
    />
  );

  /** 略図マップの印刷 (1356 / 1456) と回転 (1357 / 1457)。165 と 166 で共通。 */
  const sketchRows = (
    <>
      <Checkbox
        id="print-map-sketch-map"
        label="略図マップの印刷"
        checked={settings.printSketchMap}
        onChange={(event) => onChange({ printSketchMap: event.target.checked })}
        data-ctrl-id={ids.sketchMap}
      />
      <Checkbox
        id="print-map-rotate-sketch"
        label="略図を地図表示に合わせて回転"
        checked={settings.rotateSketchMap}
        onChange={(event) => onChange({ rotateSketchMap: event.target.checked })}
        data-ctrl-id={ids.rotateSketch}
        style={SKETCH_INDENT_STYLE}
      />
    </>
  );

  /** 指示線 (1351 のコンボと 1360-1368 / 1370-1378)。元リソース 166 には無い。 */
  const indicator = (
    <GroupBox legend="指示線" style={{ flex: '0 0 auto' }}>
      {/* 1351: 指示線の太さのコンボ (元は #133)。 */}
      <Dropdown
        id="print-map-indicator-width"
        data-testid="print-map-indicator-width"
        data-ctrl-id={1351}
        aria-label="指示線の太さ"
        value={settings.indicatorWidth}
        onChange={handleIndicatorWidthChange}
      >
        {INDICATOR_WIDTH_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Dropdown>
      <div style={COLUMNS_STYLE}>
        {INDICATOR_COLOR_COLUMNS.map((column) => (
          <div key={column[0].color} style={CHECK_COLUMN_STYLE}>
            {column.map((option) => (
              <div key={option.color} style={COLOR_ROW_STYLE}>
                <span
                  data-ctrl-id={option.swatchId}
                  style={{ ...SWATCH_STYLE, backgroundColor: COLOR_SWATCHES[option.color] }}
                />
                <Checkbox
                  id={`print-map-indicator-${option.color}`}
                  data-testid={`print-map-indicator-${option.color}`}
                  label={`色${option.color}`}
                  checked={settings.indicatorColors.includes(option.color)}
                  onChange={() =>
                    onChange({
                      indicatorColors: toggleNumber(settings.indicatorColors, option.color),
                    })
                  }
                  data-ctrl-id={option.controlId}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </GroupBox>
  );

  return (
    <div style={BODY_STYLE}>
      {settings.blank ? (
        /*
         * 166 (白地図印刷) は 2 列。左に印刷範囲と注記、右にレイアウトのコンボ以下の項目が
         * 並ぶ (実測: 印刷範囲 315x273 / レイアウト列は x=359 から)。
         */
        <div style={BLANK_ROW_STYLE}>
          <div style={BLANK_LEFT_STYLE}>
            {range}
            {/* 166 の注記 3 行 (元リソースでは ID を持たない #130 Static)。 */}
            <div data-testid="print-map-blank-note" style={NOTE_STYLE}>
              <div>※ 総印刷ページ数は、</div>
              <div>[チェックした日付数×チェックしたホール数]</div>
              <div>ページになりますので、注意してください.</div>
            </div>
          </div>
          <div style={BLANK_RIGHT_STYLE}>
            {layoutSample}
            <div style={GENRE_ROW_STYLE}>
              {genreOverlay}
              {densityRow}
            </div>
            {sketchRows}
            {packingRow}
          </div>
        </div>
      ) : (
        <>
      <div style={TOP_ROW_STYLE}>
        {range}
        {printItems}
      </div>

      <div style={TOP_ROW_STYLE}>
          {pageBreak}
          <GroupBox
            legend="レイアウト"
            style={{ flex: '1 1 0px', minWidth: 0, minHeight: 213 }}
          >
            <div style={LAYOUT_ROW_STYLE}>
              <div style={LAYOUT_SAMPLE_COLUMN_STYLE}>
                {layoutSample}
                {packingRow}
              </div>
              <div style={CHECK_COLUMN_STYLE}>
                {/* 1348 / 1349: 元は「地図＋リスト」「地図＋カット」のときだけ有効。 */}
                <Checkbox
                  id="print-map-sequence-number"
                  label="サークル通し番号の印刷"
                  checked={settings.printSequenceNumber}
                  onChange={(event) => onChange({ printSequenceNumber: event.target.checked })}
                  data-ctrl-id={1348}
                />
                <Checkbox
                  id="print-map-color-legend"
                  label="チェック色一覧の印刷"
                  checked={settings.printColorLegend}
                  onChange={(event) => onChange({ printColorLegend: event.target.checked })}
                  data-ctrl-id={1349}
                />
                {genreOverlay}
                {densityRow}
                {sketchRows}
              </div>
              {indicator}
            </div>
          </GroupBox>
        </div>
        </>
      )}

      <div style={BUTTON_ROW_STYLE}>
        <Button
          variant="default"
          data-testid="print-map-preview"
          data-ctrl-id={ids.preview}
          // 実物の 93x21 (UI-SPEC ダイアログ 165 / 166)。
          style={{ width: 93, height: 21 }}
          onClick={onPreview}
        >
          プレビュー
        </Button>
      </div>
    </div>
  );
}

/**
 * マップ印刷 / 白地図印刷ダイアログ (元ダイアログ 165 / 166 / 660 x 442)。
 * blank なら元ダイアログ 166 (白地図印刷) の見た目になる。中身は {@link PrintMapPage}。
 */
export function PrintMapDialog({
  settings,
  onChange,
  onPreview,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 660,
  height = 442,
  zIndex,
}: PrintMapDialogProps) {
  return (
    <Window
      data-testid="print-map-dialog"
      title={settings.blank ? '白地図印刷' : 'マップ印刷'}
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={DIALOG_BODY_STYLE}>
        <PrintMapPage
          settings={settings}
          onChange={onChange}
          onPreview={() => onPreview(settings)}
        />
        <div style={DIALOG_FOOTER_STYLE}>
          {/* 2: 元リソース 165 / 166 の表には無いが、Web 版はダイアログ側で閉じるボタンを出す。 */}
          <Button data-ctrl-id={2} onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
