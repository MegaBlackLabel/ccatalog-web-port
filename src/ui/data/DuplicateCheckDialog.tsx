import { type CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type DuplicateCheckDialogProps = {
  /** 既にチェックリストに登録されているサークル。 */
  duplicates: readonly { name: string; penName: string; count: number }[];
  /** はい。重複して登録する。 */
  onConfirm: () => void;
  /** いいえ。 */
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
  fontSize: 12,
};

const MESSAGE_STYLE: CSSProperties = { flex: '0 0 auto', overflowWrap: 'anywhere' };

/** 重複サークルの一覧 (元実装のリストボックス相当)。 */
const LIST_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
  background: '#ffffff',
  border: '1px solid #808080',
  padding: 2,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

const ROW_STYLE: CSSProperties = { display: 'flex', gap: 6, padding: '1px 4px' };

/** 件数は行の右端に寄せる。 */
const FOOTER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 215 チェックリストへの重複登録の確認。 */
export function DuplicateCheckDialog({
  duplicates,
  onConfirm,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: DuplicateCheckDialogProps) {
  return (
    <Window
      data-testid="duplicate-check-dialog"
      title="チェックリストへの重複登録の確認"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div style={MESSAGE_STYLE}>既に登録されているサークルがあります。重複して登録しますか？</div>
        <div role="list" aria-label="重複しているサークル" style={LIST_STYLE}>
          {duplicates.map((duplicate) => (
            <div
              key={`${duplicate.name} / ${duplicate.penName}`}
              role="listitem"
              data-testid="dialog-row"
              data-row-id={`${duplicate.name} / ${duplicate.penName}`}
              data-selected="false"
              style={ROW_STYLE}
            >
              <span>{`${duplicate.name} / ${duplicate.penName} (${duplicate.count} 件)`}</span>
            </div>
          ))}
        </div>
        <div style={FOOTER_STYLE}>
          <Button variant="default" data-ctrl-id="6" data-testid="duplicate-confirm" onClick={onConfirm}>
            はい
          </Button>
          <Button data-ctrl-id="7" data-testid="duplicate-cancel" onClick={onClose}>
            いいえ
          </Button>
        </div>
      </div>
    </Window>
  );
}
