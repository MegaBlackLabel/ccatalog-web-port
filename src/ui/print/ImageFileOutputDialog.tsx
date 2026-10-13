import { useState, type CSSProperties } from 'react';
import { Button, GroupBox, OptionButton, TextBox, Window } from '@megablacklabel/react98retro';

/** ダイアログ 197 の 出力ファイル形式 (元実装はコンボボックス 1751)。 */
export type ImageFormat = 'bmp' | 'png' | 'jpg';

export type ImageFileOutputDialogProps = {
  format: ImageFormat;
  /** 出力先フォルダ。 */
  directory: string;
  /** 開始ページ (1 始まり)。 */
  pageFrom: number;
  /** 終了ページ (1 始まり)。 */
  pageTo: number;
  /** 有効なページ番号の上限。 */
  maxPage: number;
  onChange: (patch: {
    format?: ImageFormat;
    directory?: string;
    pageFrom?: number;
    pageTo?: number;
  }) => void;
  /** 出力。 */
  onOutput: () => void;
  /** 閉じる(&X)。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** 出力ファイル形式のラジオボタン (元は 1751 のコンボボックス)。 */
const FORMAT_CONTROLS: readonly { format: ImageFormat; label: string }[] = [
  { format: 'bmp', label: 'BMP' },
  { format: 'png', label: 'PNG' },
  { format: 'jpg', label: 'JPG' },
];

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 4,
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

const GROUP_BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 6,
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const LABEL_STYLE: CSSProperties = { flex: '0 0 auto' };

/** TextBox (FieldRow) を横いっぱいに広げるためのラッパー。 */
const PATH_FIELD_STYLE: CSSProperties = { flex: '1 1 auto', minWidth: 0 };

const FORMAT_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flex: '1 1 auto',
};

const NOTE_STYLE: CSSProperties = { color: '#404040' };

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  marginTop: 'auto',
  flex: '0 0 auto',
};

/** 1〜maxPage の整数なら返す。範囲外と数値でない入力は undefined (呼び出し側で無視する)。 */
function parsePage(raw: string, maxPage: number): number | undefined {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > maxPage) return undefined;
  return parsed;
}

export function ImageFileOutputDialog({
  format,
  directory,
  pageFrom,
  pageTo,
  maxPage,
  onChange,
  onOutput,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: ImageFileOutputDialogProps) {
  // ページ番号は編集中の文字列をそのまま持つ (範囲外・数値でない入力は onChange に出さない)。
  const [fromDraft, setFromDraft] = useState(String(pageFrom));
  const [toDraft, setToDraft] = useState(String(pageTo));

  const changeFrom = (raw: string) => {
    setFromDraft(raw);
    const parsed = parsePage(raw, maxPage);
    if (parsed !== undefined) onChange({ pageFrom: parsed });
  };

  const changeTo = (raw: string) => {
    setToDraft(raw);
    const parsed = parsePage(raw, maxPage);
    if (parsed !== undefined) onChange({ pageTo: parsed });
  };

  // 開始 > 終了で出力されたときは、入れ替えた範囲を onChange で知らせてから出力する。
  const submit = () => {
    const from = parsePage(fromDraft, maxPage) ?? pageFrom;
    const to = parsePage(toDraft, maxPage) ?? pageTo;
    if (from > to) {
      setFromDraft(String(to));
      setToDraft(String(from));
      onChange({ pageFrom: to, pageTo: from });
    }
    onOutput();
  };

  return (
    <Window
      data-testid="image-output-dialog"
      title="印刷データの画像ファイル出力"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox data-ctrl-id={1075} legend="画像出力" style={{ flex: '0 0 auto' }}>
          <div style={GROUP_BODY_STYLE}>
            <div style={ROW_STYLE}>
              <div style={PATH_FIELD_STYLE}>
                <TextBox
                  id="image-output-directory"
                  label="出力パス :"
                  style={{ flex: '1 1 auto' }}
                  value={directory}
                  onChange={(event) => onChange({ directory: event.target.value })}
                  data-ctrl-id={1630}
                  data-testid="image-output-directory"
                />
              </div>
              <Button disabled title="Web 版では未実装" data-ctrl-id={1631}>
                参照...
              </Button>
            </div>
            <div style={ROW_STYLE}>
              <span style={LABEL_STYLE}>出力ファイル形式 :</span>
              <div data-ctrl-id={1751} style={FORMAT_ROW_STYLE}>
                {FORMAT_CONTROLS.map(({ format: value, label }) => (
                  <OptionButton
                    key={value}
                    id={`image-output-format-${value}`}
                    name="image-output-format"
                    label={label}
                    checked={format === value}
                    onChange={() => onChange({ format: value })}
                  />
                ))}
              </div>
            </div>
            <div data-ctrl-id={1752} data-testid="image-output-note" style={NOTE_STYLE}>
              {`※ ページ番号と拡張子".${format}"が付加されます。`}
            </div>
          </div>
        </GroupBox>
        <GroupBox data-ctrl-id={1072} legend="出力範囲" style={{ flex: '0 0 auto' }}>
          <div style={GROUP_BODY_STYLE}>
            <div style={ROW_STYLE}>
              <span style={LABEL_STYLE}>ページ :</span>
              <input
                type="number"
                min={1}
                max={maxPage}
                aria-label="開始ページ"
                data-ctrl-id={1637}
                data-testid="image-output-page-from"
                style={{ width: 64, textAlign: 'right' }}
                value={fromDraft}
                onChange={(event) => changeFrom(event.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                min={1}
                max={maxPage}
                aria-label="終了ページ"
                data-testid="image-output-page-to"
                style={{ width: 64, textAlign: 'right' }}
                value={toDraft}
                onChange={(event) => changeTo(event.target.value)}
              />
              <span data-ctrl-id={1639}>{`(有効範囲 : 1-${maxPage})`}</span>
            </div>
          </div>
        </GroupBox>
        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-ctrl-id={1}
            data-testid="image-output-submit"
            onClick={submit}
          >
            出力
          </Button>
          <Button data-ctrl-id={2} data-testid="image-output-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
