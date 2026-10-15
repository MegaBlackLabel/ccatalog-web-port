import { useState, type CSSProperties } from 'react';
import { Button, Dropdown, GroupBox, Window } from '@megablacklabel/react98retro';

/** ダミーのプリンタ名 (Web 版は実際のプリンタを列挙できない)。 */
export const PRINTERS: readonly string[] = [
  'EPSON PX-M6010F (ダミー)',
  'Microsoft Print to PDF',
  'HP LaserJet Pro M15w (ダミー)',
];

export type PrintDialogProps = {
  /** 印刷する文書の名前 (ダミー)。 */
  documentName: string;
  /** OK。選んだプリンタ名を渡す。 */
  onPrint: (printer: string) => void;
  /** 用紙・余白の変更 (元リソース 1656)。 */
  onPageSetup: () => void;
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
  overflow: 'auto',
  flex: '1 1 auto',
  minHeight: 0,
};

const ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', gap: 4 };

const LABEL_STYLE: CSSProperties = { flex: '0 0 auto', fontSize: 12 };

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  marginTop: 'auto',
  flex: '0 0 auto',
};

/** プリンタ選択ダイアログ (元ダイアログ 1538)。 */
export function PrintDialog({
  documentName,
  onPrint,
  onPageSetup,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: PrintDialogProps) {
  const [printer, setPrinter] = useState(PRINTERS[0]);

  return (
    <Window
      data-testid="print-dialog"
      title="印刷"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox legend="プリンタ" style={{ flex: '0 0 auto' }}>
          <div style={ROW_STYLE}>
            <label style={LABEL_STYLE} htmlFor="print-printer">
              プリンタ名:
            </label>
            <Dropdown
              id="print-printer"
              data-testid="print-printer"
              data-ctrl-id={1139}
              style={{ flex: '1 1 auto' }}
              value={printer}
              onChange={(event) => setPrinter(event.target.value)}
            >
              {PRINTERS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Dropdown>
            <Button
              data-ctrl-id={1025}
              disabled
              title="プリンタのプロパティは Web 版では開けません"
            >
              プロパティ...
            </Button>
          </div>
          <div style={ROW_STYLE}>
            <span style={LABEL_STYLE}>文書名:</span>
            <span data-testid="print-document-name">{documentName}</span>
          </div>
        </GroupBox>

        {/* 実物のリソース 1538 は「用紙サイズ:」の右にこのボタンを置く (1656)。 */}
        <Button
          data-ctrl-id={1656}
          data-testid="print-page-setup"
          style={{ flex: '0 0 auto', alignSelf: 'flex-start' }}
          onClick={onPageSetup}
        >
          用紙・余白の変更(S)...
        </Button>

        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-testid="print-submit"
            data-ctrl-id={1}
            onClick={() => onPrint(printer)}
          >
            OK
          </Button>
          <Button data-testid="print-cancel" data-ctrl-id={2} onClick={onClose}>
            キャンセル
          </Button>
        </div>
      </div>
    </Window>
  );
}
