import type { CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type CircleMsAuthDialogProps = {
  /** 認証の進行状況。 */
  status: 'idle' | 'running' | 'done' | 'error';
  /** 補足メッセージ (エラー内容や誘導文など)。 */
  message?: string;
  /** 「認証を開始」。status が idle / error のときだけ押せる。 */
  onStart: () => void;
  /** 「キャンセル」。 */
  onCancel: () => void;
  /** 「閉じる」。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** status ごとの表示文言。 */
const STATUS_LABELS: Record<CircleMsAuthDialogProps['status'], string> = {
  idle: '待機中',
  running: '認証中...',
  done: '完了',
  error: 'エラー',
};

/** 埋め込みブラウザ (元コントロール 1741) に表示する説明文。 */
const DESCRIPTION = [
  'Web ブラウザで認証を行います。',
  '別のタブで Circle.ms の認証ページを開き、アカウントでログインしてください。',
  '認証が完了すると、この画面に結果が表示されます。',
].join('\n\n');

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
};

const DESCRIPTION_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  width: '100%',
  resize: 'none',
  fontFamily: 'inherit',
  fontSize: 12,
};

const STATUS_STYLE: CSSProperties = { fontSize: 12, flex: '0 0 auto' };

const MESSAGE_STYLE: CSSProperties = {
  fontSize: 12,
  color: '#000080',
  flex: '0 0 auto',
  overflow: 'auto',
  maxHeight: 60,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** Circle.ms 認証ダイアログ (元ダイアログ 248)。 */
export function CircleMsAuthDialog({
  status,
  message,
  onStart,
  onCancel,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: CircleMsAuthDialogProps) {
  const canStart = status === 'idle' || status === 'error';

  return (
    <Window
      data-testid="circlems-auth-dialog"
      title="Circle.ms 認証ダイアログ"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <textarea
          className="text-area"
          data-ctrl-id={1741}
          data-testid="circlems-description"
          aria-label="認証の説明"
          readOnly
          style={DESCRIPTION_STYLE}
          value={DESCRIPTION}
        />
        <div data-testid="circlems-status" style={STATUS_STYLE}>
          状態: {STATUS_LABELS[status]}
        </div>
        {message ? (
          <div data-testid="circlems-message" style={MESSAGE_STYLE}>
            {message}
          </div>
        ) : null}
        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            type="button"
            data-testid="circlems-start"
            disabled={!canStart}
            onClick={onStart}
          >
            認証を開始
          </Button>
          <Button type="button" data-ctrl-id={2} data-testid="circlems-cancel" onClick={onCancel}>
            キャンセル
          </Button>
          <Button type="button" data-testid="circlems-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
