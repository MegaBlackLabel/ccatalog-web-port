import { useState, type ChangeEvent, type CSSProperties } from 'react';
import { Button, Checkbox, GroupBox, Window } from '@megablacklabel/react98retro';
import { DEFAULT_PRINT_TARGET, type PrintTarget } from './PrintListDialog';

export type PrintMapSettings = {
  target: PrintTarget;
  /** 表示倍率 (1 で原寸)。 */
  zoom: number;
  /** true なら白地図印刷 (元ダイアログ 166)。 */
  blank: boolean;
  /** サークル位置を印刷。 */
  printCircleMarkers: boolean;
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

type DayOption = { day: number; label: string; controlId: number };
type HallOption = { hall: string; controlId: number };
type ColorOption = { color: number; controlId: number };

/** 日付チェックボックス (元リソース 165 の 1280-1284 / 166 の 1380-1384)。抽選漏れは 0。 */
const DAY_OPTIONS: readonly DayOption[] = [
  { day: 1, label: '1日目', controlId: 1280 },
  { day: 2, label: '2日目', controlId: 1281 },
  { day: 3, label: '3日目', controlId: 1282 },
  { day: 4, label: '4日目', controlId: 1283 },
  { day: 0, label: '抽選漏れ', controlId: 1284 },
];

/** ホールチェックボックス (元リソース 165 の 1290-1302 / 166 の 1390-1402)。元の並びと同じ 2 列。 */
const HALL_COLUMNS: readonly (readonly HallOption[])[] = [
  [
    { hall: '東1', controlId: 1290 },
    { hall: '東2', controlId: 1291 },
    { hall: '東3', controlId: 1292 },
    { hall: '東4', controlId: 1295 },
    { hall: '東5', controlId: 1294 },
    { hall: '東6', controlId: 1293 },
    { hall: '東7･8', controlId: 1299 },
  ],
  [
    { hall: '西1', controlId: 1297 },
    { hall: '西2', controlId: 1296 },
    { hall: '西3･4', controlId: 1298 },
    { hall: '南1', controlId: 1301 },
    { hall: '南2', controlId: 1300 },
    { hall: '南3', controlId: 1303 },
    { hall: '南4', controlId: 1302 },
  ],
];

/** チェック色チェックボックス (元リソース 165 の 1330-1338)。元の並びと同じ 2 列。 */
const COLOR_COLUMNS: readonly (readonly ColorOption[])[] = [
  [
    { color: 1, controlId: 1330 },
    { color: 2, controlId: 1331 },
    { color: 3, controlId: 1332 },
    { color: 4, controlId: 1333 },
    { color: 5, controlId: 1334 },
  ],
  [
    { color: 6, controlId: 1335 },
    { color: 7, controlId: 1336 },
    { color: 8, controlId: 1337 },
    { color: 9, controlId: 1338 },
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

/** 表示倍率は会場マップ (MapWindow) と同じ 25%〜300%。 */
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;

export const DEFAULT_PRINT_MAP_SETTINGS: PrintMapSettings = {
  target: DEFAULT_PRINT_TARGET,
  zoom: 1,
  blank: false,
  printCircleMarkers: true,
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

const NOTE_STYLE: CSSProperties = { fontSize: 12, color: '#404040' };

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
  /** この範囲外の入力では onChange を呼ばない。 */
  min: number;
  max: number;
  onChange: (value: number) => void;
};

/** 数値入力 (元リソースのアップダウン付きエディット相当)。空欄や範囲外では onChange を呼ばない。 */
function NumberField({ id, label, testId, value, min, max, onChange }: NumberFieldProps) {
  // 入力中は props の値ではなく編集中の文字列を出す (空欄にできるようにするため)。
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setDraft(text);
    const parsed = Number(text.trim());
    if (text.trim() === '' || !Number.isFinite(parsed)) return;
    if (parsed < min || parsed > max) return;
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
        title={`${min}〜${max} の範囲で指定してください`}
        value={draft ?? String(value)}
        onChange={handleChange}
        onBlur={() => setDraft(null)}
      />
    </div>
  );
}

/** マップ印刷 / 白地図印刷ダイアログ (元ダイアログ 165 / 166)。 */
export function PrintMapDialog({
  settings,
  onChange,
  onPreview,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: PrintMapDialogProps) {
  const { target } = settings;

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
      <div style={BODY_STYLE}>
        <GroupBox legend="印刷範囲" style={{ flex: '0 0 auto' }}>
          <div style={RANGE_ROW_STYLE}>
            <GroupBox legend="日付" style={{ flex: '0 0 auto' }}>
              <div style={CHECK_COLUMN_STYLE}>
                {DAY_OPTIONS.map((option) => (
                  <Checkbox
                    key={option.day}
                    id={`print-map-day-${option.day}`}
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
                        id={`print-map-hall-${option.hall}`}
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
                        id={`print-map-color-${option.color}`}
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
                data-ctrl-id={1350}
                style={{ marginTop: 4 }}
                disabled
                title="チェック色の編集はチェック色ダイアログで行います"
              >
                色の編集...
              </Button>
            </GroupBox>
          </div>
        </GroupBox>

        {settings.blank && (
          <div data-testid="print-map-blank-note" style={NOTE_STYLE}>
            <div>※ 総印刷ページ数は、</div>
            <div>[チェックした日付数×チェックしたホール数]</div>
            <div>ページになりますので、注意してください.</div>
          </div>
        )}

        <GroupBox legend="レイアウト" style={{ flex: '0 0 auto' }}>
          <NumberField
            id="print-map-zoom"
            label="表示倍率"
            testId="print-map-zoom"
            value={settings.zoom}
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            onChange={(zoom) => onChange({ zoom })}
          />
          <span style={LABEL_STYLE}>{Math.round(settings.zoom * 100)}%</span>
          <Checkbox
            id="print-map-circle-markers"
            label="サークル位置を印刷"
            checked={settings.printCircleMarkers}
            onChange={(event) => onChange({ printCircleMarkers: event.target.checked })}
          />
        </GroupBox>

        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-testid="print-map-preview"
            data-ctrl-id={1347}
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
