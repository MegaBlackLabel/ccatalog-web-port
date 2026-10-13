import { useState, type CSSProperties } from 'react';
import { Button, GroupBox, Window } from '@megablacklabel/react98retro';

/** データベースに追加されている (または追加できる) コミックマーケット 1 回分のデータ。 */
export type RoundInfo = {
  comiketNo: number;
  name: string;
  /** データベースにインストール済みか。 */
  installed: boolean;
};

export type RoundSwitchDialogProps = {
  /** データベースに追加されている回 (元実装の「インストールされているデータ」)。 */
  rounds: readonly RoundInfo[];
  /** 現在参照中の回。一覧では「(参照中)」を付けて表示する。 */
  currentComiketNo: number;
  /** 切り替え。参照中以外の回が選ばれているときだけ呼ばれる。 */
  onSwitch: (comiketNo: number) => void;
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

/** 元実装の SysListView32 (1627) に相当する選択リスト。 */
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

const ROW_STYLE: CSSProperties = { padding: '1px 4px', cursor: 'pointer' };

const SELECTED_ROW_STYLE: CSSProperties = {
  ...ROW_STYLE,
  background: '#000080',
  color: '#ffffff',
};

const FOOTER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 行のラベル。参照中の回には「(参照中)」を付ける (元実装のリスト表示と同じ)。 */
function roundLabel(round: RoundInfo, currentComiketNo: number): string {
  const current = round.comiketNo === currentComiketNo ? ' (参照中)' : '';
  return `${round.name} (${round.comiketNo})${current}`;
}

/** 196 コミックマーケット回数切り替え。参照するデータベースを選び直す。 */
export function RoundSwitchDialog({
  rounds,
  currentComiketNo,
  onSwitch,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: RoundSwitchDialogProps) {
  // 元実装と同じく、開いた時点で参照中の回を選んでおく。
  const [selectedNo, setSelectedNo] = useState<number | null>(
    rounds.find((round) => round.comiketNo === currentComiketNo)?.comiketNo ?? rounds[0]?.comiketNo ?? null,
  );

  const canSwitch = selectedNo !== null && selectedNo !== currentComiketNo;

  return (
    <Window
      data-testid="round-switch-dialog"
      title="コミックマーケット回数切り替え"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox legend="データベースに追加されているデータ" style={GROUP_STYLE}>
          <div
            data-ctrl-id="1627"
            role="listbox"
            aria-label="データベースに追加されているデータ"
            style={LIST_STYLE}
          >
            {rounds.map((round) => {
              const selected = round.comiketNo === selectedNo;
              return (
                <div
                  key={round.comiketNo}
                  role="option"
                  aria-selected={selected}
                  tabIndex={0}
                  data-testid="dialog-row"
                  data-row-id={String(round.comiketNo)}
                  data-selected={selected ? 'true' : 'false'}
                  style={selected ? SELECTED_ROW_STYLE : ROW_STYLE}
                  onClick={() => setSelectedNo(round.comiketNo)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setSelectedNo(round.comiketNo);
                  }}
                >
                  {roundLabel(round, currentComiketNo)}
                </div>
              );
            })}
          </div>
        </GroupBox>
        <div style={FOOTER_STYLE}>
          <Button
            variant="default"
            data-ctrl-id="1"
            data-testid="round-switch-submit"
            disabled={!canSwitch}
            onClick={() => {
              if (canSwitch && selectedNo !== null) onSwitch(selectedNo);
            }}
          >
            切り替え
          </Button>
          <Button data-ctrl-id="2" data-testid="round-switch-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
