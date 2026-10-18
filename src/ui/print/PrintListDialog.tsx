import type { ChangeEvent, CSSProperties } from 'react';
import { Button, Checkbox, Dropdown, GroupBox, OptionButton } from '@megablacklabel/react98retro';

/** 印刷範囲。days は抽選漏れが 0、colors は 1〜9。 */
export type PrintTarget = {
  days: number[];
  halls: string[];
  colors: number[];
};

/** サークルリスト印刷の詳細設定 (元ダイアログ 163 の各コントロール)。 */
export type PrintListSettings = {
  /** 印刷範囲: 日付 (1080-1084) / ホール (1090-1118) / チェック色 (1130-1138)。 */
  target: PrintTarget;
  /** 印刷項目リスト (1144, 表示名)。デフォルトは [サークル名, 読み, 執筆者, 発行誌, 位置, 日付, ジャンル] */
  items: string[];
  /** 印刷順 (1139)。CHM 4PRINT/2LIST.HTM の 4 種。 */
  pageBreakOrder: 'checklist' | 'space' | 'name' | 'color';
  /** 改ページ条件 (1140-1143)。 */
  pageBreakBy: 'day' | 'hall' | 'block' | 'color';
  /** レイアウト (1145)。CHM 4PRINT/2LIST.HTM の 5 タイプ。 */
  layout: 'portrait' | 'portraitLarge' | 'landscape1' | 'landscape1Large' | 'landscape2';
  /** サークル通し番号の印刷 (1148)。 */
  printSequenceNumber: boolean;
  /** チェック色一覧の印刷 (1149)。 */
  printColorLegend: boolean;
  /** ブロックの全サークルを印刷 (1719)。 */
  printWholeBlock: boolean;
};

/** サークルリスト印刷のタブの中身 (元ダイアログ 163 のクライアント領域) の props。 */
export type PrintListPageProps = {
  settings: PrintListSettings;
  /** 変更された項目だけを渡す。 */
  onChange: (patch: Partial<PrintListSettings>) => void;
  /** プレビュー。 */
  onPreview: () => void;
};

type DayOption = { day: number; label: string; controlId: number };
type HallOption = { hall: string; controlId: number };
type ColorOption = { color: number; controlId: number; swatchId: number };
type PageBreakOrder = PrintListSettings['pageBreakOrder'];
type PageBreakBy = PrintListSettings['pageBreakBy'];
type PrintLayout = PrintListSettings['layout'];

/** 印刷項目リスト (元リソース 163 の 1144 に並ぶ項目)。 */
const PRINT_ITEMS: readonly string[] = [
  'サークル名',
  '読み',
  '執筆者',
  '発行誌',
  '位置',
  '日付',
  'ジャンル',
];

/** 日付チェックボックス (元リソース 163 の 1080-1084)。抽選漏れは 0。 */
const DAY_OPTIONS: readonly DayOption[] = [
  { day: 1, label: '1日目', controlId: 1080 },
  { day: 2, label: '2日目', controlId: 1081 },
  { day: 3, label: '3日目', controlId: 1082 },
  { day: 4, label: '4日目', controlId: 1083 },
  { day: 0, label: '抽選漏れ', controlId: 1084 },
];

/** ホールチェックボックス (元リソース 163 の 1090-1118)。元の並びと同じ 3 列。 */
const HALL_COLUMNS: readonly (readonly HallOption[])[] = [
  [
    { hall: '東1', controlId: 1090 },
    { hall: '東2', controlId: 1091 },
    { hall: '東3', controlId: 1092 },
    { hall: '東4', controlId: 1095 },
    { hall: '東5', controlId: 1094 },
    { hall: '東6', controlId: 1093 },
    { hall: '東7･8', controlId: 1099 },
  ],
  [
    { hall: '西1', controlId: 1097 },
    { hall: '西2', controlId: 1096 },
    { hall: '西3･4', controlId: 1098 },
    { hall: '南1', controlId: 1101 },
    { hall: '南2', controlId: 1100 },
    { hall: '南3', controlId: 1103 },
    { hall: '南4', controlId: 1102 },
  ],
  [
    { hall: '東123', controlId: 1112 },
    { hall: '東456', controlId: 1113 },
    { hall: '西12', controlId: 1114 },
    { hall: '南12', controlId: 1117 },
    { hall: '南34', controlId: 1118 },
  ],
];

/**
 * チェック色チェックボックス (元リソース 163 の 1130-1138) と、その左に並ぶ見本色
 * (1120-1128, 元は #130 のオーナードロー)。元の並びと同じ 2 列。
 */
const COLOR_COLUMNS: readonly (readonly ColorOption[])[] = [
  [
    { color: 1, controlId: 1130, swatchId: 1120 },
    { color: 2, controlId: 1131, swatchId: 1121 },
    { color: 3, controlId: 1132, swatchId: 1122 },
    { color: 4, controlId: 1133, swatchId: 1123 },
    { color: 5, controlId: 1134, swatchId: 1124 },
  ],
  [
    { color: 6, controlId: 1135, swatchId: 1125 },
    { color: 7, controlId: 1136, swatchId: 1126 },
    { color: 8, controlId: 1137, swatchId: 1127 },
    { color: 9, controlId: 1138, swatchId: 1128 },
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

/** 印刷順コンボ (元リソース 163 の 1139)。CHM 4PRINT/2LIST.HTM の並び。 */
const ORDER_OPTIONS: readonly { value: PageBreakOrder; label: string }[] = [
  { value: 'checklist', label: 'チェックリスト順' },
  { value: 'space', label: '配置順' },
  { value: 'name', label: 'サークル名順' },
  { value: 'color', label: '色順' },
];

/** レイアウトコンボ (元リソース 163 の 1145)。CHM 4PRINT/2LIST.HTM の 5 タイプ。 */
const LAYOUT_OPTIONS: readonly { value: PrintLayout; label: string }[] = [
  { value: 'portrait', label: '縦向き' },
  { value: 'portraitLarge', label: '縦向き (フォント大)' },
  { value: 'landscape1', label: '横向き 1段組' },
  { value: 'landscape1Large', label: '横向き 1段 (フォント大)' },
  { value: 'landscape2', label: '横向き 2段組' },
];

/** 改ページ条件 (元リソース 163 の 1140-1143)。元の並びは 日付 / ホール / ブロック / チェック色。 */
const PAGE_BREAK_OPTIONS: readonly { by: PageBreakBy; label: string; controlId: number }[] = [
  { by: 'day', label: '日付', controlId: 1140 },
  { by: 'hall', label: 'ホール', controlId: 1141 },
  { by: 'block', label: 'ブロック', controlId: 1143 },
  { by: 'color', label: 'チェック色', controlId: 1142 },
];

/** 印刷範囲の初期値: 1〜4日目・全ホール・全チェック色。 */
export const DEFAULT_PRINT_TARGET: PrintTarget = {
  days: DAY_OPTIONS.map((option) => option.day),
  halls: HALL_COLUMNS.flat().map((option) => option.hall),
  colors: COLOR_COLUMNS.flat().map((option) => option.color),
};

export const DEFAULT_PRINT_LIST_SETTINGS: PrintListSettings = {
  target: DEFAULT_PRINT_TARGET,
  items: [...PRINT_ITEMS],
  pageBreakOrder: 'checklist',
  pageBreakBy: 'day',
  layout: 'portrait',
  printSequenceNumber: false,
  printColorLegend: false,
  printWholeBlock: false,
};

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 4,
  overflow: 'auto',
  flex: '1 1 auto',
  // 親 (window-body) は block なので flex では伸びない。プレビュー ボタンを
  // タブ ページの下端へ寄せるため、親の高さいっぱいまで伸ばす。
  minHeight: '100%',
};

const TOP_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  // 同じ段のグループは高さを揃える (実物は 1 段目 273/275、2 段目 213/213)。
  alignItems: 'stretch',
  gap: 8,
};

const RANGE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: 6,
};

/**
 * チェックボックス 1 列分。
 * 行の間隔は実物の実測 (1 行 30px ピッチ) に合わせる。
 */
const CHECK_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  rowGap: 11,
};

const COLUMNS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  columnGap: 8,
};

/** 改ページ (実物は 161x275 の縦長): 印刷順と改ページ条件を縦に積む。 */
const BREAK_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  rowGap: 4,
};

/** 見本色とチェックボックスを 1 行に並べる (元の #130 と auto-check の組)。 */
const COLOR_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  columnGap: 2,
};

/** チェック色の見本色 (元は #130 のオーナードロー)。 */
const SWATCH_STYLE: CSSProperties = {
  display: 'inline-block',
  width: 13,
  height: 13,
  border: '1px solid #808080',
  flex: '0 0 auto',
};

const LABEL_STYLE: CSSProperties = { fontSize: 12 };

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

/** レイアウト: 左にコンボ (1145) と見本枠 (1146)、右にチェック (1148/1149/1719)。 */
const LAYOUT_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  columnGap: 8,
};

/** レイアウトのコンボとその下の見本枠を縦に並べる。 */
const LAYOUT_SAMPLE_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  rowGap: 4,
  alignItems: 'flex-start',
};

/** 1146: レイアウトの見本枠 (資源ではテキストが空の #130 Static, 142 x 90)。 */
const LAYOUT_FRAME_STYLE: CSSProperties = {
  width: 142,
  height: 90,
  border: '1px solid #808080',
  background: '#ffffff',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
  // 実物はタブ ページの下端右に置く (実測 rel y=535)。
  marginTop: 'auto',
  paddingTop: 6,
};

/**
 * サークルリスト印刷のタブの中身 (元ダイアログ 163 のクライアント領域)。
 * 印刷詳細設定 (プロパティシート 163〜166) のタブ本文として PrintSettingsDialog が載せる。
 */
export function PrintListPage({ settings, onChange, onPreview }: PrintListPageProps) {
  const { target } = settings;

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

  return (
    <div style={BODY_STYLE}>
      <div style={TOP_ROW_STYLE}>
        <GroupBox legend="印刷範囲" style={{ flex: '0 0 auto', width: 470, minHeight: 273 }}>
          <div style={RANGE_ROW_STYLE}>
            <GroupBox legend="日付" style={{ flex: '0 0 auto' }}>
              <div style={CHECK_COLUMN_STYLE}>
                {DAY_OPTIONS.map((option) => (
                  <Checkbox
                    key={option.day}
                    id={`print-list-day-${option.day}`}
                    label={option.label}
                    checked={target.days.includes(option.day)}
                    onChange={() =>
                      onChange({ target: { ...target, days: toggleNumber(target.days, option.day) } })
                    }
                    data-ctrl-id={option.controlId}
                  />
                ))}
              </div>
            </GroupBox>
            <GroupBox legend="ホール" style={{ flex: '0 0 auto' }}>
              <div style={COLUMNS_STYLE}>
                {HALL_COLUMNS.map((column) => (
                  <div key={column[0].hall} style={CHECK_COLUMN_STYLE}>
                    {column.map((option) => (
                      <Checkbox
                        key={option.hall}
                        id={`print-list-hall-${option.hall}`}
                        label={option.hall}
                        checked={target.halls.includes(option.hall)}
                        onChange={() =>
                          onChange({
                            target: { ...target, halls: toggleText(target.halls, option.hall) },
                          })
                        }
                        data-ctrl-id={option.controlId}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </GroupBox>
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
                          id={`print-list-color-${option.color}`}
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
                data-ctrl-id={1150}
                style={{ marginTop: 4 }}
                disabled
                title="チェック色の編集はチェック色ダイアログで行います"
              >
                色の編集...
              </Button>
            </GroupBox>
          </div>
        </GroupBox>

        <GroupBox legend="印刷項目" style={{ flex: '0 0 auto', width: 161, minHeight: 273 }}>
          <div data-ctrl-id={1144} style={ITEM_LIST_STYLE}>
            {PRINT_ITEMS.map((item, index) => (
              <Checkbox
                key={item}
                id={`print-list-item-${index}`}
                label={item}
                checked={settings.items.includes(item)}
                onChange={() => onChange({ items: toggleText(settings.items, item) })}
              />
            ))}
          </div>
        </GroupBox>

      </div>

      <div style={TOP_ROW_STYLE}>
        <GroupBox legend="改ページ" style={{ flex: '0 0 auto', width: 131, minHeight: 213 }}>
          <div style={BREAK_COLUMN_STYLE}>
          <span style={LABEL_STYLE}>印刷順 :</span>
          <Dropdown
            id="print-list-order"
            data-testid="print-list-order"
            data-ctrl-id={1139}
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
              id={`print-list-break-${option.by}`}
              name="print-list-page-break"
              label={option.label}
              checked={settings.pageBreakBy === option.by}
              onChange={() => onChange({ pageBreakBy: option.by })}
              data-ctrl-id={option.controlId}
            />
          ))}
          </div>
        </GroupBox>


        <GroupBox legend="レイアウト" style={{ flex: '1 1 auto', minHeight: 213 }}>
          <div style={LAYOUT_ROW_STYLE}>
            <div style={LAYOUT_SAMPLE_COLUMN_STYLE}>
              {/* 1145: レイアウトのコンボ (元は #133)。 */}
              <Dropdown
                id="print-list-layout"
                data-testid="print-list-layout"
                data-ctrl-id={1145}
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
                1146: レイアウトの見本を描く枠 (元はテキストが空の #130 Static)。
                元実装は実行時にここへレイアウトの見本を描画するが、資源の時点では空。
                Web 版は見本を印刷プレビューで見せるため、枠は空のままにする。
              */}
              <div
                data-ctrl-id={1146}
                data-testid="print-list-layout-frame"
                style={LAYOUT_FRAME_STYLE}
              />
            </div>
            <div style={CHECK_COLUMN_STYLE}>
              <Checkbox
                id="print-list-sequence-number"
                label="サークル通し番号の印刷"
                checked={settings.printSequenceNumber}
                onChange={(event) => onChange({ printSequenceNumber: event.target.checked })}
                data-ctrl-id={1148}
              />
              <Checkbox
                id="print-list-color-legend"
                label="チェック色一覧の印刷"
                checked={settings.printColorLegend}
                onChange={(event) => onChange({ printColorLegend: event.target.checked })}
                data-ctrl-id={1149}
              />
              <Checkbox
                id="print-list-whole-block"
                label="ブロックの全サークルを印刷"
                checked={settings.printWholeBlock}
                onChange={(event) => onChange({ printWholeBlock: event.target.checked })}
                data-ctrl-id={1719}
              />
            </div>
          </div>
        </GroupBox>
      </div>

      <div style={BUTTON_ROW_STYLE}>
        <Button
          variant="default"
          data-testid="print-list-preview"
          data-ctrl-id={1147}
          // 実物の 93x21 (UI-SPEC ダイアログ 163)。
          style={{ width: 93, height: 21 }}
          onClick={onPreview}
        >
          プレビュー
        </Button>
      </div>
    </div>
  );
}

