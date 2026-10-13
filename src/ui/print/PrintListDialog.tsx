import type { ChangeEvent, CSSProperties } from 'react';
import {
  Button,
  Checkbox,
  Dropdown,
  GroupBox,
  OptionButton,
  Window,
} from '@megablacklabel/react98retro';

/** 印刷範囲。days は抽選漏れが 0、colors は 1〜9。 */
export type PrintTarget = {
  days: number[];
  halls: string[];
  colors: number[];
};

export type PrintListSettings = {
  target: PrintTarget;
  /** 印刷項目リスト (表示名)。デフォルトは [サークル名, 読み, 執筆者, 発行誌, 位置, 日付, ジャンル] */
  items: string[];
  /** 補足/メモを拡大 */
  enlargeDescription: boolean;
  enlargeMemo: boolean;
  /** 改ページ */
  pageBreakOrder: 'space' | 'color' | 'name';
  pageBreakBy: 'day' | 'hall' | 'block' | 'color';
  /** レイアウト: サークル通し番号の印刷 / チェック色一覧の印刷 / ブロックの全サークルを印刷 */
  printSequenceNumber: boolean;
  printColorLegend: boolean;
  printWholeBlock: boolean;
};

export type PrintListDialogProps = {
  settings: PrintListSettings;
  /** 変更された項目だけを渡す。 */
  onChange: (patch: Partial<PrintListSettings>) => void;
  /** プレビュー。現在の設定をそのまま渡す。 */
  onPreview: (settings: PrintListSettings) => void;
  /** 閉じる。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

type DayOption = { day: number; label: string; controlId: number };
type HallOption = { hall: string; controlId: number };
type ColorOption = { color: number; controlId: number };
type PageBreakOrder = PrintListSettings['pageBreakOrder'];
type PageBreakBy = PrintListSettings['pageBreakBy'];

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

/** ホールチェックボックス (元リソース 163 の 1090-1102)。元の並びと同じ 2 列。 */
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
];

/** チェック色チェックボックス (元リソース 163 の 1130-1138)。元の並びと同じ 2 列。 */
const COLOR_COLUMNS: readonly (readonly ColorOption[])[] = [
  [
    { color: 1, controlId: 1130 },
    { color: 2, controlId: 1131 },
    { color: 3, controlId: 1132 },
    { color: 4, controlId: 1133 },
    { color: 5, controlId: 1134 },
  ],
  [
    { color: 6, controlId: 1135 },
    { color: 7, controlId: 1136 },
    { color: 8, controlId: 1137 },
    { color: 9, controlId: 1138 },
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

/** 印刷順コンボ (元リソース 163 の 1139)。 */
const ORDER_OPTIONS: readonly { value: PageBreakOrder; label: string }[] = [
  { value: 'space', label: 'スペース順' },
  { value: 'color', label: 'チェック色順' },
  { value: 'name', label: 'サークル名順' },
];

/** 改ページ条件 (元リソース 163 の 1140-1143)。 */
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
  enlargeDescription: false,
  enlargeMemo: false,
  pageBreakOrder: 'space',
  pageBreakBy: 'day',
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
  minHeight: 0,
};

const TOP_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: 6,
};

const RANGE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: 6,
};

/** チェックボックス 1 列分。 */
const CHECK_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  rowGap: 2,
};

const COLUMNS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  columnGap: 8,
};

const SWATCH_STYLE: CSSProperties = {
  display: 'inline-block',
  width: 13,
  height: 13,
  marginRight: 4,
  border: '1px solid #808080',
  verticalAlign: 'middle',
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

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** サークルリスト印刷ダイアログ (元ダイアログ 163)。 */
export function PrintListDialog({
  settings,
  onChange,
  onPreview,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: PrintListDialogProps) {
  const { target } = settings;

  const handleOrderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = ORDER_OPTIONS.find((option) => option.value === event.target.value);
    if (next === undefined) return;
    onChange({ pageBreakOrder: next.value });
  };

  return (
    <Window
      data-testid="print-list-dialog"
      title="サークルリスト印刷"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div style={TOP_ROW_STYLE}>
          <GroupBox legend="印刷範囲" style={{ flex: '0 0 auto' }}>
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
                        onChange({
                          target: {
                            ...target,
                            days: target.days.includes(option.day)
                              ? target.days.filter((day) => day !== option.day)
                              : [...target.days, option.day],
                          },
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
                          id={`print-list-hall-${option.hall}`}
                          label={option.hall}
                          checked={target.halls.includes(option.hall)}
                          onChange={() =>
                            onChange({
                              target: {
                                ...target,
                                halls: target.halls.includes(option.hall)
                                  ? target.halls.filter((hall) => hall !== option.hall)
                                  : [...target.halls, option.hall],
                              },
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
                        <Checkbox
                          key={option.color}
                          id={`print-list-color-${option.color}`}
                          label={
                            <>
                              <span
                                style={{
                                  ...SWATCH_STYLE,
                                  background: COLOR_SWATCHES[option.color],
                                }}
                              />
                              色{option.color}
                            </>
                          }
                          checked={target.colors.includes(option.color)}
                          onChange={() =>
                            onChange({
                              target: {
                                ...target,
                                colors: target.colors.includes(option.color)
                                  ? target.colors.filter((color) => color !== option.color)
                                  : [...target.colors, option.color],
                              },
                            })
                          }
                          data-ctrl-id={option.controlId}
                        />
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

          <GroupBox legend="印刷項目" style={{ flex: '0 0 auto' }}>
            <div data-ctrl-id={1144} style={ITEM_LIST_STYLE}>
              {PRINT_ITEMS.map((item, index) => (
                <Checkbox
                  key={item}
                  id={`print-list-item-${index}`}
                  label={item}
                  checked={settings.items.includes(item)}
                  onChange={() =>
                    onChange({
                      items: settings.items.includes(item)
                        ? settings.items.filter((entry) => entry !== item)
                        : [...settings.items, item],
                    })
                  }
                />
              ))}
            </div>
            <Checkbox
              id="print-list-enlarge-description"
              label="補足を拡大"
              checked={settings.enlargeDescription}
              onChange={(event) => onChange({ enlargeDescription: event.target.checked })}
              data-ctrl-id={1724}
            />
            <Checkbox
              id="print-list-enlarge-memo"
              label="メモを拡大"
              checked={settings.enlargeMemo}
              onChange={(event) => onChange({ enlargeMemo: event.target.checked })}
              data-ctrl-id={1725}
            />
          </GroupBox>
        </div>

        <div style={TOP_ROW_STYLE}>
          <GroupBox legend="改ページ" style={{ flex: '0 0 auto' }}>
            <span style={LABEL_STYLE}>印刷順 :</span>
            <Dropdown
              id="print-list-order"
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
          </GroupBox>

          <GroupBox legend="レイアウト" style={{ flex: '1 1 auto' }}>
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
          </GroupBox>
        </div>

        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-testid="print-list-preview"
            data-ctrl-id={1147}
            onClick={() => onPreview(settings)}
          >
            プレビュー
          </Button>
          <Button data-ctrl-id={2} onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
