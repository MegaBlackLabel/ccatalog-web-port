import type { CSSProperties } from 'react';
import { Button, StatusBar, StatusBarField, Window } from '@megablacklabel/react98retro';
import { assetUrl } from '../asset-url';

export type PrintPreviewWindowProps = {
  /** 例: 'プレビュー' (ダイアログ 300)。 */
  title?: string;
  /** 総ページ数。 */
  pageCount: number;
  /** 表示中のページ番号 (1 始まり)。 */
  pageNo: number;
  /** ダミーのプレビュー画像。空文字なら枠だけを出す。
   *  既定は Web 版のダミーデータ '/maps/W12.png' (西12 ホール)。 */
  imageUrl?: string;
  /** 倍率。1 で幅いっぱい、2 で 2 倍。 */
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onPageChange: (pageNo: number) => void;
  /** 表示中のページを印刷する。 */
  onPrint: () => void;
  /** 閉じる(&X)。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

const DEFAULT_IMAGE_URL = assetUrl('/maps/W12.png');

/** ダイアログ 300 の ZOOM ボタン (3014〜3018: ZOOM 1〜ZOOM 5)。 */
const ZOOM_CONTROLS: readonly { controlId: number; zoom: number }[] = [
  { controlId: 3014, zoom: 1 },
  { controlId: 3015, zoom: 2 },
  { controlId: 3016, zoom: 3 },
  { controlId: 3017, zoom: 4 },
  { controlId: 3018, zoom: 5 },
];

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  padding: 4,
  flex: '1 1 auto',
  minHeight: 0,
};

// プレビュー面 (3011)。98.css には無いので灰色のスクロール領域を自前で作る。
const PREVIEW_AREA_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
  background: '#808080',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  padding: 4,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
  flex: '0 0 auto',
};

export function PrintPreviewWindow({
  title = 'プレビュー',
  pageCount,
  pageNo,
  imageUrl = DEFAULT_IMAGE_URL,
  zoom,
  onZoomChange,
  onPageChange,
  onPrint,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: PrintPreviewWindowProps) {
  return (
    <Window
      data-testid="print-preview-window"
      title={title}
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
      statusBar={
        // 3020 と 3023 は同じ PAGENO(&O)。1 つのフィールドにまとめている。
        <StatusBar>
          <StatusBarField data-ctrl-id={3020}>{`${pageNo} / ${pageCount}`}</StatusBarField>
        </StatusBar>
      }
    >
      <div style={BODY_STYLE}>
        <div data-ctrl-id={3011} style={PREVIEW_AREA_STYLE}>
          {imageUrl === '' ? null : (
            <img
              data-testid="preview-image"
              src={imageUrl}
              alt={`${pageNo} ページ目のプレビュー`}
              draggable={false}
              style={{ width: `${zoom * 100}%`, height: 'auto' }}
            />
          )}
        </div>
        <div style={BUTTON_ROW_STYLE}>
          <Button
            data-ctrl-id={3012}
            disabled={pageNo <= 1}
            onClick={() => onPageChange(pageNo - 1)}
          >
            前頁
          </Button>
          <Button
            data-ctrl-id={3013}
            disabled={pageNo >= pageCount}
            onClick={() => onPageChange(pageNo + 1)}
          >
            次頁
          </Button>
          {ZOOM_CONTROLS.map(({ controlId, zoom: level }) => (
            <Button key={controlId} data-ctrl-id={controlId} onClick={() => onZoomChange(level)}>
              {`ZOOM ${level}`}
            </Button>
          ))}
          <Button variant="default" data-testid="preview-print" onClick={onPrint}>
            印刷
          </Button>
          <Button data-ctrl-id={3019} onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
