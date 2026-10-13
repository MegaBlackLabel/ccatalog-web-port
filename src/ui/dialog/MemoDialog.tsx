import { useState, type CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type MemoDialogProps = {
  /** 例: 'メモの編集' */
  title: string;
  /** 現在のメモ。テキストエリアの初期値になる。 */
  value: string;
  /** OK。入力中のメモを渡す。 */
  onSave: (memo: string) => void;
  /** キャンセル / 閉じる。 */
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
  padding: 4,
  flex: '1 1 auto',
  minHeight: 0,
};

const INPUT_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  width: '100%',
  resize: 'none',
  fontFamily: 'inherit',
  fontSize: 12,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

export function MemoDialog({
  title,
  value,
  onSave,
  onClose,
  initialX = 240,
  initialY = 200,
  width = 470,
  height = 220,
  zIndex,
}: MemoDialogProps) {
  // ダイアログを開いた時点のメモを初期値にし、以降は編集内容をローカルに持つ。
  const [text, setText] = useState(value);

  return (
    <Window
      data-testid="memo-dialog"
      title={title}
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
          data-testid="memo-input"
          aria-label="メモ"
          style={INPUT_STYLE}
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <div style={BUTTON_ROW_STYLE}>
          <Button variant="default" data-testid="memo-save" onClick={() => onSave(text)}>
            OK
          </Button>
          <Button data-testid="memo-cancel" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </Window>
  );
}
