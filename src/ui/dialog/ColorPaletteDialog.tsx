import { useState, type CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';
import { DIALOG_LIFT_STYLE } from '../dialog-layer';

export type ColorPaletteDialogProps = {
  /** 編集している色の番号 (1〜9)。 */
  colorNo: number;
  /** 現在の色 (#rrggbb)。 */
  value: string;
  /** OK を押したときに選んだ色を渡す。 */
  onSelect: (hex: string) => void;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** #rrggbb を作る。 */
function hex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * パレットの色。元実装は OS の色選択ダイアログ (色パレット) を開くので、
 * Web 版は RGB を 0 / 128 / 255 の 3 段で組んだ 27 色 + 中間のグレー 6 段の固定パレットにする
 * (CHM「色パレットダイアログが表示されるので、好みの色を選んで OK ボタンを押してください」)。
 */
const PALETTE: readonly string[] = (() => {
  const levels = [0, 128, 255];
  const colors: string[] = [];
  for (const r of levels) {
    for (const g of levels) {
      for (const b of levels) colors.push(hex(r, g, b));
    }
  }
  // グレー階調 (立方体に入っている 0 / 128 / 255 は重複するので入れない)。
  for (const value of [32, 64, 96, 160, 192, 224]) colors.push(hex(value, value, value));
  return colors;
})();

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

const PALETTE_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(9, 1fr)',
  gap: 2,
  flex: '0 0 auto',
};

const SWATCH_STYLE: CSSProperties = {
  minWidth: 0,
  minHeight: 0,
  height: 20,
  padding: 0,
  border: '1px solid #808080',
  boxSizing: 'border-box',
};

const PREVIEW_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flex: '0 0 auto',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 色パレット (元実装の「色パレットダイアログ」)。 */
export function ColorPaletteDialog({
  colorNo,
  value,
  onSelect,
  onClose,
  initialX = 360,
  initialY = 180,
  width = 320,
  height = 260,
  zIndex,
}: ColorPaletteDialogProps) {
  const [selected, setSelected] = useState(value);

  return (
    <div style={DIALOG_LIFT_STYLE}>
      <Window
        data-testid="color-palette-dialog"
        // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
        minimizable={false}
        maximizable={false}
        resizable={false}
        title={`色${colorNo} の色パレット`}
        modal
        onClose={onClose}
        width={width}
        height={height}
        initialX={initialX}
        initialY={initialY}
        zIndex={zIndex}
      >
      <div style={BODY_STYLE}>
        <div style={PALETTE_STYLE}>
          {PALETTE.map((color) => (
            <Button
              key={color}
              type="button"
              data-testid="palette-color"
              aria-label={color}
              aria-pressed={color === selected}
              title={color}
              style={{ ...SWATCH_STYLE, background: color }}
              onClick={() => setSelected(color)}
            />
          ))}
        </div>
        <div style={PREVIEW_ROW_STYLE}>
          <span>選択中の色 :</span>
          <span
            data-testid="palette-preview"
            style={{ ...SWATCH_STYLE, width: 60, border: '1px solid #000000', background: selected }}
          />
          <span data-testid="palette-value">{selected}</span>
        </div>
        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-testid="palette-ok"
            onClick={() => {
              onSelect(selected);
              onClose();
            }}
          >
            OK
          </Button>
          <Button data-testid="palette-cancel" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
      </Window>
    </div>
  );
}
