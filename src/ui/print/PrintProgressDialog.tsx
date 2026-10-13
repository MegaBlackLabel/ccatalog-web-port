import type { CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type PrintProgressDialogProps = {
  /** 例: '印刷中...' (181) / 'お気に入りの印刷中' (301)。 */
  title?: string;
  /** 進捗 (0〜100)。 */
  percent: number;
  /** 進捗表示の文言。未指定なら 'N%'。 */
  message?: string;
  /** キャンセル。 */
  onCancel: () => void;
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
  gap: 10,
  padding: 10,
  flex: '1 1 auto',
  minHeight: 0,
};

const MESSAGE_STYLE: CSSProperties = { fontSize: 12 };

const PROGRESS_STYLE: CSSProperties = { width: '100%' };

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 6,
  marginTop: 'auto',
  flex: '0 0 auto',
};

export function PrintProgressDialog({
  title = '印刷中...',
  percent,
  message,
  onCancel,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: PrintProgressDialogProps) {
  return (
    <Window
      data-testid="print-progress-dialog"
      title={title}
      modal
      // 印刷中は Escape とタイトルバーの × もキャンセルとして扱う (モーダルな進捗表示)。
      onClose={onCancel}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div data-ctrl-id={1601} data-testid="print-progress-message" style={MESSAGE_STYLE}>
          {message ?? `${percent}%`}
        </div>
        <progress
          data-ctrl-id={1600}
          data-testid="print-progress"
          style={PROGRESS_STYLE}
          max={100}
          value={percent}
        />
        <div style={BUTTON_ROW_STYLE}>
          <Button data-ctrl-id={2} data-testid="print-cancel" onClick={onCancel}>
            キャンセル
          </Button>
        </div>
      </div>
    </Window>
  );
}
