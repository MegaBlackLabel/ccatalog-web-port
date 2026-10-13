import { useState, type CSSProperties } from 'react';
import { Button, OptionButton, Window } from '@megablacklabel/react98retro';
import type { CheckColor } from '../../app/catalog-state';

export type CheckColorDialogProps = {
  /** 色1〜色9 の名称 (index 0 が「色1」)。空文字なら「色N」。 */
  colorNames: readonly string[];
  /** 現在のチェック色。0 は標準色。 */
  current: CheckColor;
  onSelect: (color: CheckColor) => void;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** 標準色 + 色1〜色9 (元実装のチェック色ダイアログと同じ並び)。 */
const COLOR_CHOICES: readonly CheckColor[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** チェック色の見本色。0 は標準色 (色分けなし)。ChecklistWindow と同じ値を並べてある。 */
const SWATCHES: Record<CheckColor, string> = {
  0: '#ffffff',
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

const LIST_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
};

const ROW_LABEL_STYLE: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6 };

const SWATCH_STYLE: CSSProperties = {
  display: 'inline-block',
  width: 12,
  height: 12,
  border: '1px solid #808080',
  verticalAlign: 'middle',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
  paddingTop: 6,
};

function colorLabel(color: CheckColor, colorNames: readonly string[]): string {
  if (color === 0) return '標準色';
  return colorNames[color - 1] || `色${color}`;
}

/** チェック色ダイアログ。選択中のサークルに付ける色を 標準色 + 色1〜色9 から選ぶ。 */
export function CheckColorDialog({
  colorNames,
  current,
  onSelect,
  onClose,
  initialX = 340,
  initialY = 180,
  width = 240,
  height = 330,
  zIndex,
}: CheckColorDialogProps) {
  const [selected, setSelected] = useState<CheckColor>(current);

  return (
    <Window
      data-testid="check-color-dialog"
      title="チェック色"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={LIST_STYLE} role="radiogroup" aria-label="チェック色">
        {COLOR_CHOICES.map((color) => (
          <OptionButton
            key={color}
            id={`check-color-${color}`}
            name="check-color"
            data-color={color}
            data-selected={color === selected ? 'true' : undefined}
            aria-checked={color === selected}
            checked={color === selected}
            onChange={() => setSelected(color)}
            label={
              <span style={ROW_LABEL_STYLE}>
                <span aria-hidden="true" style={{ ...SWATCH_STYLE, background: SWATCHES[color] }} />
                {colorLabel(color, colorNames)}
              </span>
            }
          />
        ))}
      </div>
      <div style={BUTTON_ROW_STYLE}>
        <Button type="button" onClick={() => onSelect(selected)}>
          OK
        </Button>
        <Button type="button" onClick={onClose}>
          キャンセル
        </Button>
      </div>
    </Window>
  );
}
