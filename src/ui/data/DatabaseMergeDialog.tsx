import { useState, type CSSProperties } from 'react';
import { Button, GroupBox, Window } from '@megablacklabel/react98retro';

export type DatabaseMergeDialogProps = {
  /** 統合できる古いデータベース (元実装の「古いデータベース」)。 */
  candidates: readonly { comiketNo: number; name: string; circleCount: number }[];
  /** 統合。選択中の候補の回が渡る。 */
  onMerge: (comiketNo: number) => void;
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

/** 古いデータベースの一覧 (元実装のリストボックス相当)。 */
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

/** サークル数は行の右端に寄せる。 */
const ROW_COUNT_STYLE: CSSProperties = { marginLeft: 'auto' };

const FOOTER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 209 古いデータベースの統合。 */
export function DatabaseMergeDialog({
  candidates,
  onMerge,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: DatabaseMergeDialogProps) {
  const [selectedNo, setSelectedNo] = useState<number | null>(null);

  return (
    <Window
      data-testid="database-merge-dialog"
      title="古いデータベースの統合"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox legend="古いデータベース" style={GROUP_STYLE}>
          <div role="listbox" aria-label="古いデータベース" style={LIST_STYLE}>
            {candidates.map((candidate) => {
              const selected = candidate.comiketNo === selectedNo;
              return (
                <div
                  key={candidate.comiketNo}
                  role="option"
                  aria-selected={selected}
                  tabIndex={0}
                  data-testid="dialog-row"
                  data-row-id={String(candidate.comiketNo)}
                  data-selected={selected ? 'true' : 'false'}
                  style={selected ? SELECTED_ROW_STYLE : ROW_STYLE}
                  onClick={() => setSelectedNo(candidate.comiketNo)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setSelectedNo(candidate.comiketNo);
                  }}
                >
                  <span>{`${candidate.name} (${candidate.comiketNo})`}</span>{' '}
                  <span style={ROW_COUNT_STYLE}>{`${candidate.circleCount} 件`}</span>
                </div>
              );
            })}
          </div>
        </GroupBox>
        <div style={FOOTER_STYLE}>
          <Button
            data-ctrl-id="1"
            data-testid="database-merge-submit"
            disabled={selectedNo === null}
            onClick={() => {
              if (selectedNo !== null) onMerge(selectedNo);
            }}
          >
            統合
          </Button>
          <Button data-ctrl-id="2" data-testid="database-merge-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
