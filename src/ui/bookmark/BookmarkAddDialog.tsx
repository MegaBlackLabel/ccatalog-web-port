import { useState, type CSSProperties } from 'react';
import { Button, TextBox, Window } from '@megablacklabel/react98retro';

export type BookmarkAddDialogProps = {
  /** 入力欄の初期値 (例 '104 ページ')。 */
  defaultName: string;
  /** 追加先のページ番号。注記に使う。 */
  pageNo: number;
  /** OK。trim して空でない名前だけを渡す (閉じるのはアプリ側の判断)。 */
  onAdd: (name: string) => void;
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
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

const NOTE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  color: '#404040',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  marginTop: 'auto',
  paddingTop: 6,
  flex: '0 0 auto',
};

export function BookmarkAddDialog({
  defaultName,
  pageNo,
  onAdd,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: BookmarkAddDialogProps) {
  // ダイアログを開いた時点の既定名を初期値にし、以降は編集内容をローカルに持つ。
  const [name, setName] = useState(defaultName);

  // 空文字 (空白だけ含む) は登録できないので onAdd を呼ばない。
  const submit = () => {
    const trimmed = name.trim();
    if (trimmed === '') return;
    onAdd(trimmed);
  };

  return (
    <Window
      data-testid="bookmark-add-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="ブックマークの追加"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div style={NOTE_STYLE}>
          <div>{pageNo} ページに追加します.</div>
          <div>ブックマーク名を半角127文字以内で入力してください.</div>
        </div>
        <TextBox
          id="bookmark-name-input"
          label="ブックマーク名(N):"
          data-ctrl-id={129}
          data-testid="bookmark-name-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
        <div style={BUTTON_ROW_STYLE}>
          <Button variant="default" data-ctrl-id={1} data-testid="bookmark-add-submit" onClick={submit}>
            OK
          </Button>
          <Button data-ctrl-id={2} data-testid="bookmark-add-cancel" onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </Window>
  );
}
