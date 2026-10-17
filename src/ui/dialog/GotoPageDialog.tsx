import { useState, type CSSProperties } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';

export type GotoPageDialogProps = {
  /** 現在のページ番号。入力欄の初期値になる。 */
  pageNo: number;
  minPage: number;
  maxPage: number;
  /** 範囲内の整数が入力されたときだけ呼ばれる。 */
  onGoto: (pageNo: number) => void;
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
  gap: 8,
  padding: 4,
  flex: '1 1 auto',
  minHeight: 0,
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const LABEL_STYLE: CSSProperties = { flex: '0 0 auto', fontSize: 12 };

const INPUT_STYLE: CSSProperties = {
  width: 72,
  textAlign: 'right',
  flex: '0 0 auto',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

export function GotoPageDialog({
  pageNo,
  minPage,
  maxPage,
  onGoto,
  onClose,
  initialX = 420,
  initialY = 300,
  width = 300,
  height = 140,
  zIndex,
}: GotoPageDialogProps) {
  const [draft, setDraft] = useState(String(pageNo));

  // 範囲外や数値でない入力では onGoto を呼ばない。
  const submit = () => {
    const trimmed = draft.trim();
    const parsed = Number(trimmed);
    if (trimmed === '' || !Number.isInteger(parsed)) return;
    if (parsed < minPage || parsed > maxPage) return;
    onGoto(parsed);
  };

  return (
    <Window
      data-testid="goto-page-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="移動先ページの指定"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div style={ROW_STYLE}>
          <label style={LABEL_STYLE} htmlFor="goto-page-input">
            ページ番号 ({minPage}〜{maxPage}) :
          </label>
          <input
            id="goto-page-input"
            className="text-box"
            type="text"
            inputMode="numeric"
            data-testid="goto-page-input"
            style={INPUT_STYLE}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
          />
        </div>
        <div style={BUTTON_ROW_STYLE}>
          <Button variant="default" data-testid="goto-page-submit" onClick={submit}>
            移動
          </Button>
          <Button data-testid="goto-page-cancel" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </Window>
  );
}
