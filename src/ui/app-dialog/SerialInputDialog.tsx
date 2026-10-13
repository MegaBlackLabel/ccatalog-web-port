import { useState, type CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type SerialInputDialogProps = {
  /** 'シリアル番号が不正です' など。指定されたときだけ赤いエラー行に表示する。 */
  errorMessage?: string;
  /** OK。trim 済みのシリアル番号を渡す。空文字のときは呼ばない。 */
  onSubmit: (serial: string) => void;
  /** キャンセル / 閉じる。 */
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
  gap: 6,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
};

const PROMPT_STYLE: CSSProperties = { fontSize: 12, flex: '0 0 auto' };

const INPUT_STYLE: CSSProperties = { width: '100%', flex: '0 0 auto' };

const ERROR_STYLE: CSSProperties = {
  minHeight: 14,
  fontSize: 12,
  color: '#c00000',
  flex: '0 0 auto',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  marginTop: 'auto',
  paddingTop: 6,
  flex: '0 0 auto',
};

/** シリアル番号入力ダイアログ (元ダイアログ 242)。 */
export function SerialInputDialog({
  errorMessage,
  onSubmit,
  onCancel,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: SerialInputDialogProps) {
  const [serial, setSerial] = useState('');

  // 空 (空白のみ) の入力では onSubmit を呼ばない。
  const submit = () => {
    const trimmed = serial.trim();
    if (trimmed === '') return;
    onSubmit(trimmed);
  };

  return (
    <Window
      data-testid="serial-input-dialog"
      title="シリアル番号入力"
      onClose={onCancel}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <label style={PROMPT_STYLE} htmlFor="serial-input" data-ctrl-id={4294967295}>
          シリアル番号を入力してください
        </label>
        <input
          id="serial-input"
          className="text-box"
          type="text"
          data-ctrl-id={1635}
          data-testid="serial-input"
          style={INPUT_STYLE}
          value={serial}
          onChange={(event) => setSerial(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
        <div data-ctrl-id={1740} data-testid="serial-error" style={ERROR_STYLE}>
          {errorMessage ?? ''}
        </div>
        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            type="button"
            data-ctrl-id={1}
            data-testid="serial-submit"
            onClick={submit}
          >
            OK
          </Button>
          <Button type="button" data-ctrl-id={2} data-testid="serial-cancel" onClick={onCancel}>
            キャンセル
          </Button>
        </div>
      </div>
    </Window>
  );
}
