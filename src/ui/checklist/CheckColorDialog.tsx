import type { CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';
import type { CheckColorSettings } from '../../domain/app-settings';
import { CheckColorEditor } from './CheckColorEditor';

export type CheckColorDialogProps = {
  /** 色の設定 (表示色 / 印刷色 / 名称 / 編集するチェック色)。 */
  checkColors: CheckColorSettings;
  onChange: (patch: Partial<CheckColorSettings>) => void;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
  fontSize: 12,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '0 6px 6px',
  flex: '0 0 auto',
};

/**
 * チェック色の編集 (元実装のダイアログ 149 「チェック色」)。
 * メニューの「チェックリスト > チェック色の編集」(61227) と、ツールバーの「色編集」から開く。
 *
 * ウィンドウの寸法はダイアログ 149 の資源寸法 404 x 375 (ダイアログ単位) に、
 * 動作設定 (411 x 452 → 実測 439 x 670) と同じ比率を当てた 431 x 577。
 */
export function CheckColorDialog({
  checkColors,
  onChange,
  onClose,
  initialX = 300,
  initialY = 40,
  width = 431,
  height = 577,
  zIndex,
}: CheckColorDialogProps) {
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
      <div style={BODY_STYLE}>
        <CheckColorEditor checkColors={checkColors} onChange={onChange} />
      </div>
      <div style={BUTTON_ROW_STYLE}>
        <Button variant="default" data-testid="check-color-close" onClick={onClose}>
          閉じる
        </Button>
      </div>
    </Window>
  );
}
