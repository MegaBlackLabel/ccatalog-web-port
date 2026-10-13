import { useState, type ChangeEvent, type CSSProperties } from 'react';
import {
  Button,
  Checkbox,
  Dropdown,
  GroupBox,
  OptionButton,
  Window,
} from '@megablacklabel/react98retro';
import {
  DEFAULT_PRINT_LIST_SETTINGS,
  type PrintListSettings,
} from './PrintListDialog';

export type PrintCutSettings = PrintListSettings & {
  /** 1ページの段数。 */
  cutsPerRow: number;
  /** カットサイズ倍率 (1 で原寸)。 */
  cutScale: number;
};

export type PrintCutDialogProps = {
  settings: PrintCutSettings;
  /** 変更された項目だけを渡す。 */
  onChange: (patch: Partial<PrintCutSettings>) => void;
  /** プレビュー。現在の設定をそのまま渡す。 */
  onPreview: (settings: PrintCutSettings) => void;
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
type PageBreakOrder = PrintCutSettings['pageBreakOrder'];
type PageBreakBy = PrintCutSettings['pageBreakBy'];

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

/** ホールチェックボックス (元リソース 164 の 1190-1202)。元の並びと同じ 2 列。 */
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
];

/** チェック色チェックボックス (元リソース 164 の 1230-1238)。元の並びと同じ 2 列。 */
const COLOR_COLUMNS: readonly (readonly ColorOption[])[] = [
  [
    { color: 1, controlId: 1230 },
    { color: 2, controlId: 1231 },
    { color: 3, controlId: 1232 },
    { color: 4, controlId: 1233 },
    { color: 5, controlId: 1234 },
  ],
  [
    { color: 6, controlId: 1235 },
    { color: 7, controlId: 1236 },
    { color: 8, controlId: 1237 },
    { color: 9, controlId: 1238 },
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

/** 印刷順コンボ (元リソース 164 の 1239)。 */
const ORDER_OPTIONS: readonly { value: PageBreakOrder; label: string }[] = [
  { value: 'space', label: 'スペース順' },
  { value: 'color', label: 'チェック色順' },
  { value: 'name', label: 'サークル名順' },
];

/** 改ページ条件 (元リソース 164 の 1240-1243)。 */
const PAGE_BREAK_OPTIONS: readonly { by: PageBreakBy; label: string; controlId: number }[] = [
  { by: 'day', label: '日付', controlId: 1240 },
  { by: 'hall', label: 'ホール', controlId: 1241 },
  { by: 'block', label: 'ブロック', controlId: 1243 },
  { by: 'color', label: 'チェック色', controlId: 1242 },
];

export const DEFAULT_PRINT_CUT_SETTINGS: PrintCutSettings = {
  ...DEFAULT_PRINT_LIST_SETTINGS,
  cutsPerRow: 3,
  cutScale: 1,
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

const ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', gap: 4 };

const INPUT_STYLE: CSSProperties = {
  width: 56,
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

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

type NumberFieldProps = {
  id: string;
  label: string;
  testId: string;
  value: number;
  /** これ未満の入力では onChange を呼ばない。 */
  min: number;
  /** 段数のように整数だけを受け付ける項目は true。 */
  integer?: boolean;
  onChange: (value: number) => void;
};

/** 数値入力 (元リソースのアップダウン付きエディット相当)。空欄や範囲外では onChange を呼ばない。 */
function NumberField({
  id,
  label,
  testId,
  value,
  min,
  integer = false,
  onChange,
}: NumberFieldProps) {
  // 入力中は props の値ではなく編集中の文字列を出す (空欄にできるようにするため)。
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setDraft(text);
    const parsed = Number(text.trim());
    if (text.trim() === '' || !Number.isFinite(parsed)) return;
    if (parsed < min || (integer && !Number.isInteger(parsed))) return;
    onChange(parsed);
  };

  return (
    <div style={ROW_STYLE}>
      <label style={LABEL_STYLE} htmlFor={id}>
        {label} :
      </label>
      <input
        id={id}
        className="text-box"
        type="text"
        inputMode="numeric"
        data-testid={testId}
        style={INPUT_STYLE}
        value={draft ?? String(value)}
        onChange={handleChange}
        onBlur={() => setDraft(null)}
      />
    </div>
  );
}

/** サークルカット印刷ダイアログ (元ダイアログ 164)。 */
export function PrintCutDialog({
  settings,
  onChange,
  onPreview,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: PrintCutDialogProps) {
  const { target } = settings;

  const handleOrderChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = ORDER_OPTIONS.find((option) => option.value === event.target.value);
    if (next === undefined) return;
    onChange({ pageBreakOrder: next.value });
  };

  return (
    <Window
      data-testid="print-cut-dialog"
      title="サークルカット印刷"
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
                      id={`print-cut-day-${option.day}`}
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
                          id={`print-cut-hall-${option.hall}`}
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
                          id={`print-cut-color-${option.color}`}
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

          <GroupBox legend="印刷項目" style={{ flex: '0 0 auto' }}>
            <div data-ctrl-id={1244} style={ITEM_LIST_STYLE}>
              {PRINT_ITEMS.map((item, index) => (
                <Checkbox
                  key={item}
                  id={`print-cut-item-${index}`}
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
          </GroupBox>
        </div>

        <div style={TOP_ROW_STYLE}>
          <GroupBox legend="改ページ" style={{ flex: '0 0 auto' }}>
            <span style={LABEL_STYLE}>印刷順 :</span>
            <Dropdown
              id="print-cut-order"
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
          </GroupBox>

          <GroupBox legend="レイアウト" style={{ flex: '1 1 auto' }}>
            <Checkbox
              id="print-cut-sequence-number"
              label="サークル通し番号の印刷"
              checked={settings.printSequenceNumber}
              onChange={(event) => onChange({ printSequenceNumber: event.target.checked })}
              data-ctrl-id={1248}
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
            <NumberField
              id="print-cut-cuts-per-row"
              label="1ページの段数"
              testId="print-cut-cuts-per-row"
              value={settings.cutsPerRow}
              min={1}
              integer
              onChange={(cutsPerRow) => onChange({ cutsPerRow })}
            />
            <NumberField
              id="print-cut-cut-scale"
              label="カットサイズ倍率"
              testId="print-cut-cut-scale"
              value={settings.cutScale}
              min={0.1}
              onChange={(cutScale) => onChange({ cutScale })}
            />
          </GroupBox>
        </div>

        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-testid="print-cut-preview"
            data-ctrl-id={1247}
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
