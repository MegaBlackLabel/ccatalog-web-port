import type { CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type CoverDialogProps = {
  /** 表紙に出すカタログ名 (例: コミックマーケット96)。 */
  catalogName: string;
  /** 表紙のダミー画像 (省略時は枠とタイトルだけ)。 */
  imageUrl?: string;
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

/**
 * 表紙 (動作設定 1711「起動時に表紙画像を表示する」)。
 * 元実装は DVD-ROM カタログの表紙画像を出すが、Web 版はダミーの表紙を出す
 * (画像が渡されないときは枠とカタログ名だけ)。
 */
const COVER_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  border: '2px solid',
  borderColor: '#808080 #ffffff #ffffff #808080',
  background: '#c0c0c0',
  padding: 8,
  overflow: 'hidden',
};

const COVER_TITLE_STYLE: CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
  textAlign: 'center',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  flex: '0 0 auto',
};

export function CoverDialog({
  catalogName,
  imageUrl,
  onClose,
  initialX = 420,
  initialY = 120,
  width = 360,
  height = 300,
  zIndex,
}: CoverDialogProps) {
  return (
    <Window
      data-testid="cover-dialog"
      title="表紙"
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div style={COVER_STYLE}>
          {imageUrl === undefined ? null : (
            <img
              data-testid="cover-image"
              src={imageUrl}
              alt={`${catalogName} の表紙`}
              draggable={false}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          )}
          <div style={COVER_TITLE_STYLE}>{catalogName}</div>
        </div>
        <div style={BUTTON_ROW_STYLE}>
          <Button variant="default" data-testid="cover-close" onClick={onClose}>
            閉じる(&C)
          </Button>
        </div>
      </div>
    </Window>
  );
}
