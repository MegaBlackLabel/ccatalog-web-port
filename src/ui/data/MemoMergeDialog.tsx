import { useState, type CSSProperties } from 'react';
import { Button, GroupBox, Window } from '@megablacklabel/react98retro';

export type MemoMergeDialogProps = {
  /** 統合できるメモ (元実装の「古いデータベース」のメモ)。 */
  candidates: readonly { comiketNo: number; memoCount: number; sourceLabel: string }[];
  /** 統合。選択中の候補のラベルが渡る。 */
  onMerge: (sourceLabel: string) => void;
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
  fontSize: 12,
};

/** legend の下に一覧を伸ばすため、GroupBox 自体を縦の flex にする。 */
const GROUP_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
};

/** 統合できるメモの一覧 (元実装のリストボックス相当)。 */
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

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 6,
  padding: '1px 4px',
  cursor: 'pointer',
};

const SELECTED_ROW_STYLE: CSSProperties = {
  ...ROW_STYLE,
  background: '#000080',
  color: '#ffffff',
};

/** メモ数は行の右端に寄せる。 */
const ROW_COUNT_STYLE: CSSProperties = { marginLeft: 'auto' };

const FOOTER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 213 サークルメモの統合。 */
export function MemoMergeDialog({
  candidates,
  onMerge,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: MemoMergeDialogProps) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  return (
    <Window
      data-testid="memo-merge-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="サークルメモの統合"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox legend="統合できるサークルメモ" style={GROUP_STYLE}>
          <div role="listbox" aria-label="統合できるサークルメモ" style={LIST_STYLE}>
            {candidates.map((candidate) => {
              const selected = candidate.sourceLabel === selectedLabel;
              return (
                <div
                  key={candidate.sourceLabel}
                  role="option"
                  aria-selected={selected}
                  tabIndex={0}
                  data-testid="dialog-row"
                  data-row-id={candidate.sourceLabel}
                  data-selected={selected ? 'true' : 'false'}
                  style={selected ? SELECTED_ROW_STYLE : ROW_STYLE}
                  onClick={() => setSelectedLabel(candidate.sourceLabel)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setSelectedLabel(candidate.sourceLabel);
                  }}
                >
                  <span>{candidate.sourceLabel}</span>{' '}
                  <span style={ROW_COUNT_STYLE}>{`${candidate.memoCount} 件`}</span>
                </div>
              );
            })}
          </div>
        </GroupBox>
        <div style={FOOTER_STYLE}>
          <Button
            data-ctrl-id="4"
            data-testid="memo-merge-submit"
            disabled={selectedLabel === null}
            onClick={() => {
              if (selectedLabel !== null) onMerge(selectedLabel);
            }}
          >
            統合
          </Button>
          <Button data-ctrl-id="2" data-testid="memo-merge-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
