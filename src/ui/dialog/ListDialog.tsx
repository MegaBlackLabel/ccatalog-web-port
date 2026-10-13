import { useState, type CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type ListDialogItem = {
  id: string;
  label: string;
  /** 行の右側に出す補足 (ページ番号や配置など)。 */
  detail?: string;
};

export type ListDialogProps = {
  /** 例: 'リスト表示' */
  title: string;
  items: readonly ListDialogItem[];
  /** 初期選択。未指定なら何も選択されていない状態で開く。 */
  selectedId?: string;
  /** 「選択」または行のダブルクリック。選択中の項目の id を渡す。 */
  onSelect: (id: string) => void;
  /** 「閉じる」。 */
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

const ITEM_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
  padding: '1px 3px',
  fontSize: 12,
  cursor: 'default',
};

const ITEM_SELECTED_STYLE: CSSProperties = {
  ...ITEM_STYLE,
  background: '#000080',
  color: '#ffffff',
};

const ITEM_LABEL_STYLE: CSSProperties = { flex: '0 0 auto' };

const ITEM_DETAIL_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  color: '#404040',
};

const ITEM_DETAIL_SELECTED_STYLE: CSSProperties = {
  ...ITEM_DETAIL_STYLE,
  color: '#c0c0c0',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** リスト表示 (ダイアログ 210)。項目を 1 行ずつ並べ、選択して「選択」で id を返す。 */
export function ListDialog({
  title,
  items,
  selectedId,
  onSelect,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: ListDialogProps) {
  // ダイアログを開いた時点の選択を初期値にし、以降のクリックはローカルに持つ。
  const [selected, setSelected] = useState<string | undefined>(selectedId);

  return (
    <Window
      data-testid="list-dialog"
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
        <div role="listbox" aria-label={title} style={LIST_STYLE}>
          {items.map((item) => {
            const isSelected = item.id === selected;
            return (
              <div
                key={item.id}
                role="option"
                aria-selected={isSelected}
                data-testid="list-dialog-item"
                data-item-id={item.id}
                data-selected={isSelected ? 'true' : undefined}
                style={isSelected ? ITEM_SELECTED_STYLE : ITEM_STYLE}
                onClick={() => setSelected(item.id)}
                onDoubleClick={() => {
                  setSelected(item.id);
                  onSelect(item.id);
                }}
              >
                <span style={ITEM_LABEL_STYLE}>{item.label}</span>
                {item.detail !== undefined ? (
                  <span style={isSelected ? ITEM_DETAIL_SELECTED_STYLE : ITEM_DETAIL_STYLE}>
                    {item.detail}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-testid="list-dialog-ok"
            disabled={selected === undefined}
            onClick={() => {
              if (selected !== undefined) onSelect(selected);
            }}
          >
            選択
          </Button>
          <Button data-testid="list-dialog-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
