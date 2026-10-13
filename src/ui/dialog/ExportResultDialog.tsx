import type { CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type ExportResultDialogProps = {
  /** 失敗したサークル名。空ならすべて成功。 */
  failures: readonly string[];
  /** OK。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

const MESSAGE_STYLE: CSSProperties = { flex: '0 0 auto' };

const LIST_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  background: '#ffffff',
  padding: 2,
};

const ROW_STYLE: CSSProperties = { padding: '1px 2px' };

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 'auto',
  paddingTop: 6,
  flex: '0 0 auto',
};

export function ExportResultDialog({
  failures,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: ExportResultDialogProps) {
  const failed = failures.length > 0;

  return (
    <Window
      data-testid="export-result-dialog"
      title="エクスポート結果表示"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div data-ctrl-id={7077989} style={MESSAGE_STYLE}>
          {failed ? '以下のサークルのエクスポートは失敗しました' : 'すべて成功しました'}
        </div>
        {failed ? (
          <div data-ctrl-id={1635} className="sunken-panel" style={LIST_STYLE}>
            {failures.map((name, index) => (
              <div key={`${index}-${name}`} data-testid="export-failure" style={ROW_STYLE}>
                {name}
              </div>
            ))}
          </div>
        ) : null}
        <div style={BUTTON_ROW_STYLE}>
          <Button variant="default" data-ctrl-id={1} data-testid="export-result-ok" onClick={onClose}>
            OK
          </Button>
        </div>
      </div>
    </Window>
  );
}
