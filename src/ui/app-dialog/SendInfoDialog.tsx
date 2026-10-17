import type { CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type SendInfoDialogProps = {
  /** 送信される内容のプレビュー文字列 (改行込み)。 */
  payload: string;
  /** 「はい」で true、「いいえ」で false。 */
  onAnswer: (send: boolean) => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** 送信対象のマシン情報 (元ダイアログ 252 の文面)。 */
const INFO_ITEMS: readonly string[] = ['OS名', 'メモリサイズ', 'プロセッサ情報', '画面サイズ'];

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
};

const MESSAGE_STYLE: CSSProperties = { fontSize: 12, margin: 0, flex: '0 0 auto' };

const LIST_STYLE: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  fontSize: 12,
  flex: '0 0 auto',
};

const PAYLOAD_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  width: '100%',
  resize: 'none',
  fontFamily: 'inherit',
  fontSize: 12,
  whiteSpace: 'pre',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 情報送信の確認ダイアログ (元ダイアログ 252)。 */
export function SendInfoDialog({
  payload,
  onAnswer,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: SendInfoDialogProps) {
  // タイトルバーの × は「いいえ」と同じ扱い (送信しない)。
  return (
    <Window
      data-testid="send-info-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="情報送信の確認"
      // Escape とタイトルバーの × は「いいえ」(送信しない) として扱う。
      onClose={() => onAnswer(false)}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <p style={MESSAGE_STYLE}>
          今後の開発の参考のために、アクティベーションの際に以下のマシン情報を合わせて送信してよろしいですか？
        </p>
        <ul style={LIST_STYLE}>
          {INFO_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <textarea
          className="text-area"
          data-ctrl-id={1635}
          data-testid="send-info-payload"
          aria-label="送信内容"
          readOnly
          style={PAYLOAD_STYLE}
          value={payload}
        />
        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            type="button"
            data-ctrl-id={1}
            data-testid="send-info-yes"
            onClick={() => onAnswer(true)}
          >
            はい
          </Button>
          <Button type="button" data-ctrl-id={2} data-testid="send-info-no" onClick={() => onAnswer(false)}>
            いいえ
          </Button>
        </div>
      </div>
    </Window>
  );
}
