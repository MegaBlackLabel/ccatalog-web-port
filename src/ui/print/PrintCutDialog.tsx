import type { ChangeEvent, CSSProperties } from 'react';
import { Button, Checkbox, Dropdown, GroupBox, OptionButton } from '@megablacklabel/react98retro';

/** 印刷範囲。days は抽選漏れが 0、colors は 1〜9。 */
export type PrintCutTarget = {
  days: number[];
  halls: string[];
  colors: number[];
};

/** サークルカット印刷の詳細設定 (元ダイアログ 164 の各コントロール)。 */
export type PrintCutSettings = {
  /** 印刷範囲: 日付 (1180-1184) / ホール (1190-1218) / チェック色 (1220-1238)。 */
  target: PrintCutTarget;
  /** 印刷項目リスト (1244, 表示名)。デフォルトは [サークル名, 読み, 執筆者, 発行誌, 位置, 日付, ジャンル] */
  items: string[];
  /** 補足を拡大 (1721)。 */
  enlargeDescription: boolean;
  /** メモを拡大 (1722)。 */
  enlargeMemo: boolean;
  /** 印刷順 (1239)。CHM 4PRINT/3CUT.HTM の 4 種。 */
  pageBreakOrder: 'checklist' | 'space' | 'name' | 'color';
  /** 改ページ条件 (1240-1243)。 */
  pageBreakBy: 'day' | 'hall' | 'block' | 'color';
  /** レイアウト (1245)。exe の文字列 0x1a3dc4-0x1a3e34 の 8 タイプ。 */
  layout:
    | 'landscape4x4'
    | 'landscape5x5'
    | 'landscape6x6'
    | 'landscape7x7'
    | 'portrait2x5'
    | 'portrait3x7'
    | 'portrait4x9'
    | 'portrait5x1';
  /** サークル通し番号の印刷 (1248)。 */
  printSequenceNumber: boolean;
  /** 枠の印刷 (1251)。 */
  printFrame: boolean;
  /** チェック色一覧の印刷 (1249)。 */
  printColorLegend: boolean;
  /** ブロックの全サークルを印刷 (1717)。 */
  printWholeBlock: boolean;
  /** カット詰め方向 (1252 / 1253)。 */
  cutPacking: 'horizontal' | 'vertical';
};

/** サークルカット印刷のタブの中身 (元ダイアログ 164 のクライアント領域) の props。 */
export type PrintCutPageProps = {
  settings: PrintCutSettings;
  /** 変更された項目だけを渡す。 */
  onChange: (patch: Partial<PrintCutSettings>) => void;
  /** プレビュー。タブを載せている側が現在の設定でプレビューを出す。 */
  onPreview: () => void;
};

type DayOption = { day: number; label: string; controlId: number };
type HallOption = { hall: string; controlId: number };
type ColorOption = { color: number; controlId: number; swatchId: number };
type PageBreakOrder = PrintCutSettings['pageBreakOrder'];
type PageBreakBy = PrintCutSettings['pageBreakBy'];
type PrintCutLayout = PrintCutSettings['layout'];
type CutPacking = PrintCutSettings['cutPacking'];

/** 印刷項目リスト (元リソース 164 の 1244 に並ぶ項目)。 */
const PRINT_ITEMS: readonly string[] = [
  'サークル名',
  '読み',
  '執筆者',
  '発行誌',
  '位置',
  '日付',
  'ジャンル',
];

/** 日付チェックボックス (元リソース 164 の 1180-1184)。抽選漏れは 0。 */
const DAY_OPTIONS: readonly DayOption[] = [
  { day: 1, label: '1日目', controlId: 1180 },
  { day: 2, label: '2日目', controlId: 1181 },
  { day: 3, label: '3日目', controlId: 1182 },
  { day: 4, label: '4日目', controlId: 1183 },
  { day: 0, label: '抽選漏れ', controlId: 1184 },
];

/**
 * ホールチェックボックス (元リソース 164 の 1190-1203) と、その右に並ぶまとめホール
 * (1212-1218)。元の並びと同じ 3 列で、まとめホールも個々のホールと同じく halls に入れる。
 */
const HALL_COLUMNS: readonly (readonly HallOption[])[] = [
  [
    { hall: '東1', controlId: 1190 },
    { hall: '東2', controlId: 1191 },
    { hall: '東3', controlId: 1192 },
    { hall: '東4', controlId: 1195 },
    { hall: '東5', controlId: 1194 },
    { hall: '東6', controlId: 1193 },
    { hall: '東7･8', controlId: 1199 },
  ],
  [
    { hall: '西1', controlId: 1197 },
    { hall: '西2', controlId: 1196 },
    { hall: '西3･4', controlId: 1198 },
    { hall: '南1', controlId: 1201 },
    { hall: '南2', controlId: 1200 },
    { hall: '南3', controlId: 1203 },
    { hall: '南4', controlId: 1202 },
  ],
  [
    { hall: '東123', controlId: 1212 },
    { hall: '東456', controlId: 1213 },
    { hall: '西12', controlId: 1214 },
    { hall: '南12', controlId: 1217 },
    { hall: '南34', controlId: 1218 },
  ],
];

/**
 * チェック色チェックボックス (元リソース 164 の 1230-1238) と、その左に並ぶ見本色
 * (1220-1228, 元は #130 のオーナードロー)。元の並びと同じ 2 列。
 */
const COLOR_COLUMNS: readonly (readonly ColorOption[])[] = [
  [
    { color: 1, controlId: 1230, swatchId: 1220 },
    { color: 2, controlId: 1231, swatchId: 1221 },
    { color: 3, controlId: 1232, swatchId: 1222 },
    { color: 4, controlId: 1233, swatchId: 1223 },
    { color: 5, controlId: 1234, swatchId: 1224 },
  ],
  [
    { color: 6, controlId: 1235, swatchId: 1225 },
    { color: 7, controlId: 1236, swatchId: 1226 },
    { color: 8, controlId: 1237, swatchId: 1227 },
    { color: 9, controlId: 1238, swatchId: 1228 },
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

/** 印刷順コンボ (元リソース 164 の 1239)。CHM 4PRINT/3CUT.HTM の並び。 */
const ORDER_OPTIONS: readonly { value: PageBreakOrder; label: string }[] = [
  { value: 'checklist', label: 'チェックリスト順' },
  { value: 'space', label: '配置順' },
  { value: 'name', label: 'サークル名順' },
  { value: 'color', label: '色順' },
];

/** 改ページ条件 (元リソース 164 の 1240-1243)。元の並びは 日付 / ホール / ブロック / チェック色。 */
const PAGE_BREAK_OPTIONS: readonly { by: PageBreakBy; label: string; controlId: number }[] = [
  { by: 'day', label: '日付', controlId: 1240 },
  { by: 'hall', label: 'ホール', controlId: 1241 },
  { by: 'block', label: 'ブロック', controlId: 1243 },
  { by: 'color', label: 'チェック色', controlId: 1242 },
];

/** レイアウトコンボ (元リソース 164 の 1245)。exe の文字列 (0x1a3dc4-0x1a3e34) の 8 タイプ。 */
const LAYOUT_OPTIONS: readonly { value: PrintCutLayout; label: string }[] = [
  { value: 'landscape4x4', label: '横向き 4 x 4' },
  { value: 'landscape5x5', label: '横向き 5 x 5' },
  { value: 'landscape6x6', label: '横向き 6 x 6' },
  { value: 'landscape7x7', label: '横向き 7 x 7' },
  { value: 'portrait2x5', label: '縦向き 2 x 5' },
  { value: 'portrait3x7', label: '縦向き 3 x 7' },
  { value: 'portrait4x9', label: '縦向き 4 x 9' },
  { value: 'portrait5x1', label: '縦向き 5 x 1' },
];

/** カット詰め方向 (元リソース 164 の 1252 / 1253)。 */
const PACKING_OPTIONS: readonly { value: CutPacking; label: string; controlId: number }[] = [
  { value: 'horizontal', label: '横詰め', controlId: 1252 },
  { value: 'vertical', label: '縦詰め', controlId: 1253 },
];

/** 印刷範囲の初期値: 1〜4日目・全ホール (まとめホール含む)・全チェック色。 */
export const DEFAULT_PRINT_CUT_TARGET: PrintCutTarget = {
  days: DAY_OPTIONS.map((option) => option.day),
  halls: HALL_COLUMNS.flat().map((option) => option.hall),
  colors: COLOR_COLUMNS.flat().map((option) => option.color),
};

export const DEFAULT_PRINT_CUT_SETTINGS: PrintCutSettings = {
  target: DEFAULT_PRINT_CUT_TARGET,
  items: [...PRINT_ITEMS],
  enlargeDescription: false,
  enlargeMemo: false,
  pageBreakOrder: 'checklist',
  pageBreakBy: 'day',
  layout: 'landscape4x4',
  printSequenceNumber: false,
  printFrame: true,
  printColorLegend: false,
  printWholeBlock: false,
  cutPacking: 'horizontal',
};

/** タブの中身 (元ダイアログ 164 のクライアント領域)。 */
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
  // 同じ段のグループは高さを揃える (実物は 1 段目 273、2 段目 213)。
  alignItems: 'stretch',
  gap: 8,
};

/** 印刷範囲の中の 日付 / ホール / チェック色 の行。 */
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

/** レイアウト: 左にコンボ (1245) と見本枠 (1246)、右にチェック (1248/1251/1249/1717) とラジオ (1252/1253)。 */
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

/** 1246: レイアウトの見本枠 (資源ではテキストが空の #130 Static, 142 x 90)。 */
const LAYOUT_FRAME_STYLE: CSSProperties = {
  width: 142,
  height: 90,
  border: '1px solid #808080',
  background: '#ffffff',
};

/** プレビューの行 (元リソース 164 の 1247)。 */
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
 * サークルカット印刷のタブの中身 (元ダイアログ 164 のクライアント領域)。
 * 印刷詳細設定 (プロパティシート 163〜166) のタブ本文として PrintSettingsDialog が載せる。
 */
export function PrintCutPage({ settings, onChange, onPreview }: PrintCutPageProps) {
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
                    id={`print-cut-day-${option.day}`}
                    label={option.label}
                    checked={target.days.includes(option.day)}
                    onChange={() =>
                      onChange({
                        target: { ...target, days: toggleNumber(target.days, option.day) },
                      })
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
                        id={`print-cut-hall-${option.hall}`}
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
                          id={`print-cut-color-${option.color}`}
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
                data-ctrl-id={1250}
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
          <div data-ctrl-id={1244} style={ITEM_LIST_STYLE}>
            {PRINT_ITEMS.map((item, index) => (
              <Checkbox
                key={item}
                id={`print-cut-item-${index}`}
                label={item}
                checked={settings.items.includes(item)}
                onChange={() => onChange({ items: toggleText(settings.items, item) })}
              />
            ))}
          </div>
          {/* 元実装はリストの下に 4px 空けて置く (1721 / 1722)。 */}
          <div style={{ marginTop: 4 }}>
            <Checkbox
              id="print-cut-enlarge-description"
              label="補足を拡大"
              checked={settings.enlargeDescription}
              onChange={(event) => onChange({ enlargeDescription: event.target.checked })}
              data-ctrl-id={1721}
            />
            <Checkbox
              id="print-cut-enlarge-memo"
              label="メモを拡大"
              checked={settings.enlargeMemo}
              onChange={(event) => onChange({ enlargeMemo: event.target.checked })}
              data-ctrl-id={1722}
            />
          </div>
        </GroupBox>
      </div>

      <div style={TOP_ROW_STYLE}>
        <GroupBox legend="改ページ" style={{ flex: '0 0 auto', width: 131, minHeight: 213 }}>
          <div style={BREAK_COLUMN_STYLE}>
          <span style={LABEL_STYLE}>印刷順 :</span>
          <Dropdown
            id="print-cut-order"
            data-testid="print-cut-order"
            data-ctrl-id={1239}
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
              id={`print-cut-break-${option.by}`}
              name="print-cut-page-break"
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
              {/* 1245: レイアウトのコンボ (元は #133)。 */}
              <Dropdown
                id="print-cut-layout"
                data-testid="print-cut-layout"
                data-ctrl-id={1245}
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
                1246: レイアウトの見本を描く枠 (元はテキストが空の #130 Static)。
                元実装は実行時にここへレイアウトの見本を描画するが、資源の時点では空。
                Web 版は見本を印刷プレビューで見せるため、枠は空のままにする。
              */}
              <div
                data-ctrl-id={1246}
                data-testid="print-cut-layout-frame"
                style={LAYOUT_FRAME_STYLE}
              />
            </div>
            <div style={CHECK_COLUMN_STYLE}>
              <Checkbox
                id="print-cut-sequence-number"
                label="サークル通し番号の印刷"
                checked={settings.printSequenceNumber}
                onChange={(event) => onChange({ printSequenceNumber: event.target.checked })}
                data-ctrl-id={1248}
              />
              <Checkbox
                id="print-cut-frame"
                label="枠の印刷"
                checked={settings.printFrame}
                onChange={(event) => onChange({ printFrame: event.target.checked })}
                data-ctrl-id={1251}
              />
              <Checkbox
                id="print-cut-color-legend"
                label="チェック色一覧の印刷"
                checked={settings.printColorLegend}
                onChange={(event) => onChange({ printColorLegend: event.target.checked })}
                data-ctrl-id={1249}
              />
              <Checkbox
                id="print-cut-whole-block"
                label="ブロックの全サークルを印刷"
                checked={settings.printWholeBlock}
                onChange={(event) => onChange({ printWholeBlock: event.target.checked })}
                data-ctrl-id={1717}
              />
              <span style={{ ...LABEL_STYLE, marginTop: 4 }}>カット詰め方向 :</span>
              {PACKING_OPTIONS.map((option) => (
                <OptionButton
                  key={option.value}
                  id={`print-cut-packing-${option.value}`}
                  name="print-cut-packing"
                  label={option.label}
                  checked={settings.cutPacking === option.value}
                  onChange={() => onChange({ cutPacking: option.value })}
                  data-ctrl-id={option.controlId}
                />
              ))}
            </div>
          </div>
        </GroupBox>
      </div>

      <div style={BUTTON_ROW_STYLE}>
        <Button
          variant="default"
          data-testid="print-cut-preview"
          data-ctrl-id={1247}
          // 実物の 93x21 (UI-SPEC ダイアログ 164)。
          style={{ width: 93, height: 21 }}
          onClick={onPreview}
        >
          プレビュー
        </Button>
      </div>
    </div>
  );
}

