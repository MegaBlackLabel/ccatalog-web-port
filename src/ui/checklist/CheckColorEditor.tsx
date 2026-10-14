import { useState, type CSSProperties } from 'react';
import { Button, Dropdown, GroupBox, TextBox } from '@megablacklabel/react98retro';
import type { CheckColorSettings } from '../../domain/app-settings';
import { CHECK_COLOR_IDS, checkColorPalette } from '../check-colors';
import { ColorPaletteDialog } from '../dialog/ColorPaletteDialog';

export type CheckColorEditorProps = {
  /** 色の設定 (表示色 / 印刷色 / 名称 / 編集するチェック色)。 */
  checkColors: CheckColorSettings;
  onChange: (patch: Partial<CheckColorSettings>) => void;
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

const TEXT_BUTTON_STYLE: CSSProperties = {
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
};

/** 色のスウォッチ (元実装の ownerdraw ボタン 30x21)。 */
const SWATCH_STYLE: CSSProperties = {
  width: 30,
  height: 21,
  minWidth: 0,
  minHeight: 0,
};

/**
 * チェック色の編集 (元実装のダイアログ 149 「チェック色」の中身)。
 * 動作設定の「色の設定」ページと、チェック色の編集ダイアログの両方から使う。
 *
 * - 編集するチェック色 (1702): 標準の設定値 / 現在のチェックリスト
 * - 色の編集 (1020〜1037): 表示色 9 個 + 印刷色 9 個 (押すと色パレット)
 * - チェック色名の編集 (1665 / 1636): 色ごとの名称 (半角 32 文字まで)
 * - デフォルト色に戻す (1038) / Macデフォルト色に戻す (1711)
 */
export function CheckColorEditor({ checkColors, onChange }: CheckColorEditorProps) {
  const [paletteTarget, setPaletteTarget] = useState<{ kind: 'display' | 'print'; color: number } | null>(
    null,
  );
  const [nameColor, setNameColor] = useState(1);

  const displayColors = checkColorPalette(checkColors.display);
  // 印刷色は未設定なら表示色を使う。
  const printColors =
    checkColors.print.length > 0 ? checkColorPalette(checkColors.print) : displayColors;
  const names = Array.from({ length: 9 }, (_, index) => checkColors.names[index] ?? '');

  const applyColor = (kind: 'display' | 'print', color: number, hex: string) => {
    const next = [...(kind === 'display' ? displayColors : printColors)];
    next[color - 1] = hex;
    onChange(kind === 'display' ? { display: next } : { print: next });
  };

  return (
    <>
      <div style={ROW_STYLE}>
        <span>編集するチェック色 :</span>
        <Dropdown
          aria-label="編集するチェック色"
          data-ctrl-id={1702}
          data-testid="preferences-color-target"
          options={[
            { value: 'standard', label: '標準の設定値' },
            { value: 'current', label: '現在のチェックリスト' },
          ]}
          value={checkColors.editTarget}
          onChange={(event) =>
            onChange({ editTarget: event.target.value as CheckColorSettings['editTarget'] })
          }
        />
      </div>
      <GroupBox legend="色の編集">
        <div style={{ ...ROW_STYLE, paddingLeft: 40 }}>
          {CHECK_COLOR_IDS.map((color) => (
            <span key={color} style={{ width: 30, textAlign: 'center' }}>
              {`色${color}`}
            </span>
          ))}
        </div>
        <div style={ROW_STYLE}>
          <span style={{ width: 56 }}>表示色 :</span>
          {CHECK_COLOR_IDS.map((color) => (
            <Button
              key={color}
              type="button"
              data-ctrl-id={1019 + color}
              data-testid={`display-color-${color}`}
              aria-label={`表示色${color}`}
              title={`色${color}`}
              style={{ ...SWATCH_STYLE, background: displayColors[color - 1] }}
              onClick={() => setPaletteTarget({ kind: 'display', color })}
            />
          ))}
        </div>
        <div style={ROW_STYLE}>
          <span style={{ width: 56 }}>印刷色 :</span>
          {CHECK_COLOR_IDS.map((color) => (
            <Button
              key={color}
              type="button"
              data-ctrl-id={1028 + color}
              data-testid={`print-color-${color}`}
              aria-label={`印刷色${color}`}
              title={`色${color}`}
              style={{ ...SWATCH_STYLE, background: printColors[color - 1] }}
              onClick={() => setPaletteTarget({ kind: 'print', color })}
            />
          ))}
        </div>
      </GroupBox>
      <GroupBox legend="チェック色名の編集">
        <div style={ROW_STYLE}>
          <Dropdown
            aria-label="名称を編集する色"
            data-ctrl-id={1665}
            data-testid="preferences-color-name-target"
            options={CHECK_COLOR_IDS.map((color) => ({ value: String(color), label: `色${color}` }))}
            value={String(nameColor)}
            onChange={(event) => setNameColor(Number(event.target.value))}
          />
          <span>名称 :</span>
          <TextBox
            aria-label="色の名称"
            data-ctrl-id={1636}
            data-testid="preferences-color-name"
            style={{ flex: '1 1 auto' }}
            maxLength={32}
            value={names[nameColor - 1]}
            onChange={(event) => {
              const next = [...names];
              next[nameColor - 1] = event.target.value;
              onChange({ names: next });
            }}
          />
        </div>
      </GroupBox>
      <div style={BUTTON_ROW_STYLE}>
        <Button
          data-ctrl-id={1038}
          data-testid="preferences-color-reset"
          style={TEXT_BUTTON_STYLE}
          onClick={() => onChange({ display: [], print: [], names: [] })}
        >
          デフォルト色に戻す
        </Button>
        <Button
          data-ctrl-id={1711}
          data-testid="preferences-color-mac-reset"
          style={TEXT_BUTTON_STYLE}
          // Web 版には Mac 版の既定色が無いので、標準の設定値を編集中は使えない
          // (現在のチェックリスト編集中は CHM どおり標準の設定値に戻すので使える)。
          disabled={checkColors.editTarget === 'standard'}
          title={
            checkColors.editTarget === 'standard'
              ? 'Web 版に Mac 版の既定色が無いため使えません'
              : '標準の設定値に戻します'
          }
          onClick={() => onChange({ display: [], print: [], names: [] })}
        >
          Macデフォルト色に戻す
        </Button>
      </div>
      {paletteTarget === null ? null : (
        <ColorPaletteDialog
          colorNo={paletteTarget.color}
          value={(paletteTarget.kind === 'display' ? displayColors : printColors)[paletteTarget.color - 1]}
          onSelect={(hex) => applyColor(paletteTarget.kind, paletteTarget.color, hex)}
          onClose={() => setPaletteTarget(null)}
        />
      )}
    </>
  );
}
