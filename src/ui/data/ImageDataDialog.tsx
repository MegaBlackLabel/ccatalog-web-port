import { useState, type CSSProperties } from 'react';
import { Button, GroupBox, Window } from '@megablacklabel/react98retro';
import type { CircleDataDialogProps, RoundInfo } from './CircleDataDialog';

export type ImageDataDialogProps = CircleDataDialogProps & {
  /** 画像データをインストール済みの回。 */
  installedImages: readonly number[];
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

/** 元実装の SysListView32 (1609 / 1608) に相当する選択リスト。 */
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

/** 190 画像データの追加インストールと削除。 */
export function ImageDataDialog({
  installed,
  available,
  installedImages,
  progress,
  onInstall,
  onRemove,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: ImageDataDialogProps) {
  const [selectedAvailableNo, setSelectedAvailableNo] = useState<number | null>(null);
  const [selectedImageNo, setSelectedImageNo] = useState<number | null>(null);

  // 画像データだけが入っている回も名前を出したいので、回数の一覧から引く。
  const knownRounds: readonly RoundInfo[] = [...installed, ...available];
  const imageRounds: readonly RoundInfo[] = installedImages.map(
    (comiketNo) =>
      knownRounds.find((round) => round.comiketNo === comiketNo) ?? {
        comiketNo,
        name: `コミックマーケット${comiketNo}`,
        installed: true,
      },
  );

  return (
    <Window
      data-testid="image-data-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="画像データの追加インストールと削除"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox legend="インストールする画像データ" style={GROUP_STYLE}>
          <div data-ctrl-id="1609" role="listbox" aria-label="インストールする画像データ" style={LIST_STYLE}>
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
              data-ctrl-id="1610"
              data-testid="image-data-install"
              disabled={selectedAvailableNo === null}
              onClick={() => {
                if (selectedAvailableNo !== null) onInstall(selectedAvailableNo);
              }}
            >
              インストール
            </Button>
          </div>
        </GroupBox>

        <GroupBox legend="インストール済み画像" style={GROUP_STYLE}>
          <div data-ctrl-id="1608" role="listbox" aria-label="インストール済み画像" style={LIST_STYLE}>
            {imageRounds.map((round) => {
              const selected = round.comiketNo === selectedImageNo;
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
                  onClick={() => setSelectedImageNo(round.comiketNo)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    setSelectedImageNo(round.comiketNo);
                  }}
                >
                  {`${round.name} (${round.comiketNo})`}
                </div>
              );
            })}
          </div>
          <div style={BUTTON_ROW_STYLE}>
            <Button
              data-ctrl-id="1611"
              data-testid="image-data-remove"
              disabled={selectedImageNo === null}
              onClick={() => {
                if (selectedImageNo !== null) onRemove(selectedImageNo);
              }}
            >
              画像データ削除
            </Button>
          </div>
        </GroupBox>

        {progress !== null && (
          <div style={PROGRESS_ROW_STYLE} data-testid="image-data-progress">
            <progress max={100} value={progress} />
            <span>{progress}%</span>
          </div>
        )}

        <div style={FOOTER_STYLE}>
          <Button variant="default" data-ctrl-id="1" data-testid="image-data-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
