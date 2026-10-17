import { useState, type CSSProperties } from 'react';
import { Button, GroupBox, Window } from '@megablacklabel/react98retro';
import type { RoundInfo } from './RoundSwitchDialog';

export type { RoundInfo };

export type CircleDataDialogProps = {
  /** 追加済み (インストール済み) の回。アプリは参照中の回を先頭で渡す。 */
  installed: readonly RoundInfo[];
  /** 追加インストールできる回。 */
  available: readonly RoundInfo[];
  /** インストール / 削除の進捗 (0-100)。null は実行中でない。 */
  progress: number | null;
  /** インストール。選択中の回が渡る。 */
  onInstall: (comiketNo: number) => void;
  /** 削除。選択中の回が渡る (参照中の回では呼ばれない)。 */
  onRemove: (comiketNo: number) => void;
  /** 閉じる。 */
  onClose: () => void;
  /**
   * 参照中の回。省略時は追加済みの先頭を参照中とみなす
   * (アプリは参照中の回を先頭に並べて渡す)。
   */
  currentComiketNo?: number;
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

/** 元実装の SysListView32 (1617 など) に相当する選択リスト。 */
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

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

const NOTE_STYLE: CSSProperties = { color: '#404040' };

const PROGRESS_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  flex: '0 0 auto',
};

const FOOTER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 192 サークルデータの追加インストールと削除。 */
export function CircleDataDialog({
  installed,
  available,
  progress,
  onInstall,
  onRemove,
  onClose,
  currentComiketNo,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: CircleDataDialogProps) {
  const [selectedAvailableNo, setSelectedAvailableNo] = useState<number | null>(null);
  const [selectedInstalledNo, setSelectedInstalledNo] = useState<number | null>(null);

  const currentNo = currentComiketNo ?? installed[0]?.comiketNo ?? null;
  // 参照中のデータは削除できない (元実装のリソースと同じ制限)。
  const canRemove = selectedInstalledNo !== null && selectedInstalledNo !== currentNo;

  return (
    <Window
      data-testid="circle-data-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="サークルデータの追加インストールと削除"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox legend="インストールするデータ" style={GROUP_STYLE}>
          <div role="listbox" aria-label="インストールするデータ" style={LIST_STYLE}>
            {available.map((round) => {
              const selected = round.comiketNo === selectedAvailableNo;
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
                  onClick={() => setSelectedAvailableNo(round.comiketNo)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setSelectedAvailableNo(round.comiketNo);
                  }}
                >
                  {`${round.name} (${round.comiketNo})`}
                </div>
              );
            })}
          </div>
          <div style={BUTTON_ROW_STYLE}>
            <Button
              data-ctrl-id="1621"
              data-testid="circle-data-install"
              disabled={selectedAvailableNo === null}
              onClick={() => {
                if (selectedAvailableNo !== null) onInstall(selectedAvailableNo);
              }}
            >
              インストール
            </Button>
          </div>
        </GroupBox>

        <GroupBox legend="追加済みのデータ" style={GROUP_STYLE}>
          <div data-ctrl-id="1617" role="listbox" aria-label="追加済みのデータ" style={LIST_STYLE}>
            {installed.map((round) => {
              const selected = round.comiketNo === selectedInstalledNo;
              const current = round.comiketNo === currentNo ? ' (参照中)' : '';
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
                  onClick={() => setSelectedInstalledNo(round.comiketNo)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setSelectedInstalledNo(round.comiketNo);
                  }}
                >
                  {`${round.name} (${round.comiketNo})${current}`}
                </div>
              );
            })}
          </div>
          <div style={NOTE_STYLE}>現在参照中のデータは削除できません。</div>
          <div style={BUTTON_ROW_STYLE}>
            <Button
              data-ctrl-id="1622"
              data-testid="circle-data-remove"
              disabled={!canRemove}
              onClick={() => {
                if (canRemove && selectedInstalledNo !== null) onRemove(selectedInstalledNo);
              }}
            >
              削除
            </Button>
          </div>
        </GroupBox>

        {progress !== null && (
          <div style={PROGRESS_ROW_STYLE} data-testid="circle-data-progress">
            <progress max={100} value={progress} />
            <span>{progress}%</span>
          </div>
        )}

        <div style={FOOTER_STYLE}>
          <Button variant="default" data-ctrl-id="1" data-testid="circle-data-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
