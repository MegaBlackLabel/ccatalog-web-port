import { type CSSProperties } from 'react';
import { Button, OptionButton, Window } from '@megablacklabel/react98retro';

/** 読み込むチェックリスト 1 件と、その追加方法。 */
export type LoadCircleConfirmItem = {
  /** 行キー。 */
  id: string;
  /** 読み込むチェックリスト側のサークル名。 */
  importedName: string;
  importedPenName: string;
  /** 色名 (例 '色3' / '標準色')。 */
  importedColor: string;
  importedMemo: string;
  /** 現在のサークルデータ側の該当候補 (無ければ空)。 */
  currentCandidates: readonly { id: number; name: string; penName: string }[];
  /** 追加方法。 */
  action: 'do' | 'unregistered' | 'skip';
};

export type LoadCircleConfirmDialogProps = {
  items: readonly LoadCircleConfirmItem[];
  /** 追加方法を変えたとき。 */
  onChange: (id: string, action: LoadCircleConfirmItem['action']) => void;
  /** 適用。 */
  onApply: () => void;
  /** キャンセル / 閉じる。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** 追加方法の選択肢 (元実装の「する / 未登録 / しない」)。 */
const ACTIONS: readonly { value: LoadCircleConfirmItem['action']; label: string }[] = [
  { value: 'do', label: 'する' },
  { value: 'unregistered', label: '未登録' },
  { value: 'skip', label: 'しない' },
];

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 4,
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

/** 1 行 (読み込むチェックリスト / 現在のサークルデータ / 追加方法) の列割り。 */
const ROW_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr auto',
  gap: 8,
  padding: '1px 4px',
  alignItems: 'flex-start',
};

const HEADER_STYLE: CSSProperties = { ...ROW_GRID_STYLE, fontSize: 11, fontWeight: 700 };

const LIST_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
  background: '#ffffff',
  border: '1px solid #808080',
  padding: 2,
};

const ITEM_ROW_STYLE: CSSProperties = { ...ROW_GRID_STYLE, borderTop: '1px solid #dfdfdf' };

const CELL_STYLE: CSSProperties = { minWidth: 0, overflowWrap: 'anywhere' };

const RADIO_GROUP_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  flex: '0 0 auto',
};

const EMPTY_STYLE: CSSProperties = { flex: '1 1 auto' };

const FOOTER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 194 読み込みサークル確認。読み込むサークルごとに追加方法を選ぶ。 */
export function LoadCircleConfirmDialog({
  items,
  onChange,
  onApply,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: LoadCircleConfirmDialogProps) {
  return (
    <Window
      data-testid="load-circle-confirm-dialog"
      title="読み込みサークル確認"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        {items.length === 0 ? (
          <div style={EMPTY_STYLE}>一致しないサークルはありません</div>
        ) : (
          <>
            <div style={HEADER_STYLE}>
              <div>読み込むチェックリスト</div>
              <div>現在のサークルデータ</div>
              <div>追加方法</div>
            </div>
            <div style={LIST_STYLE}>
              {items.map((item) => (
                <div
                  key={item.id}
                  data-testid="dialog-row"
                  data-row-id={item.id}
                  // 「しない」以外は登録対象なので、選択状態として扱う。
                  data-selected={item.action === 'skip' ? 'false' : 'true'}
                  style={ITEM_ROW_STYLE}
                >
                  <div style={CELL_STYLE}>
                    <div>{item.importedName}</div>
                    <div>{item.importedPenName}</div>
                    <div>{item.importedColor}</div>
                    <div>{item.importedMemo}</div>
                  </div>
                  <div style={CELL_STYLE}>
                    {item.currentCandidates.length === 0 ? (
                      <div>(該当なし)</div>
                    ) : (
                      item.currentCandidates.map((candidate) => (
                        <div key={candidate.id}>{candidate.name}</div>
                      ))
                    )}
                  </div>
                  <div role="radiogroup" aria-label={`追加方法: ${item.importedName}`} style={RADIO_GROUP_STYLE}>
                    {ACTIONS.map((action) => (
                      <OptionButton
                        key={action.value}
                        id={`load-circle-${item.id}-${action.value}`}
                        name={`load-circle-action-${item.id}`}
                        label={action.label}
                        data-selected={item.action === action.value ? 'true' : 'false'}
                        checked={item.action === action.value}
                        onChange={() => onChange(item.id, action.value)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={FOOTER_STYLE}>
          <Button variant="default" data-testid="load-circle-apply" onClick={onApply}>
            適用
          </Button>
          <Button data-testid="load-circle-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
