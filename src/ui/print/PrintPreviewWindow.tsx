import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, StatusBar, StatusBarField, TextBox, Window } from '@megablacklabel/react98retro';
import { TOOLBAR_ICONS } from '../main/toolbar-icons';
import type { PageSetup } from '../../domain/app-settings';
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
  /**
   * プレビュー面に出す中身。渡すと画像の代わりにこれを描く
   * (印刷形式ごとのページを渡す。`print-preview-content.tsx`)。
   */
  content?: ReactNode;
  /** 倍率。1 で幅いっぱい、2 で 2 倍。 */
  zoom: number;
  /** 用紙サイズ・余白 (ダイアログ 203)。渡すとプレビューに用紙の条件を出す。 */
  pageSetup?: PageSetup;
  /** 印刷色 (色1〜9。「色の設定」の印刷色)。渡すとチェック色の見本を出す。 */
  checkColors?: readonly string[];
  onZoomChange: (zoom: number) => void;
  onPageChange: (pageNo: number) => void;
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

/**
 * ダイアログ 300 の表示倍率ボタン (3014〜3018: ZOOM 1〜ZOOM 5)。
 * CHM 4PRINT/5PREVIEW.HTM: 「表示倍率を 1/4 倍〜4 倍の間で指定します」。
 * アイコンは実物ツールバー (表示バー: ズームアウト / 拡大率 / ズームイン / 幅 / 高さ /
 * 元のサイズ) と同じ SVG を使う。
 */
/** 実物の表示倍率は 1/4 倍〜4 倍の 5 段 (CHM 5PREVIEW.HTM)。 */
const ZOOM_LEVELS: readonly number[] = [0.25, 0.5, 1, 2, 4];

const ZOOM_CONTROLS: readonly {
  controlId: number;
  label: string;
  icon: string;
  /** 通知する倍率 ('step' は 1 段ずらす)。 */
  zoom: number | 'stepOut' | 'stepIn';
}[] = [
  { controlId: 3014, label: 'ズームアウト', icon: TOOLBAR_ICONS.zoomOut, zoom: 'stepOut' },
  { controlId: 3015, label: 'ズームイン', icon: TOOLBAR_ICONS.zoomIn, zoom: 'stepIn' },
  { controlId: 3016, label: '幅に合わせる', icon: TOOLBAR_ICONS.fitWidth, zoom: 1 },
  { controlId: 3017, label: '高さに合わせる', icon: TOOLBAR_ICONS.fitHeight, zoom: 1 },
  { controlId: 3018, label: '元のサイズ', icon: TOOLBAR_ICONS.actualSize, zoom: 1 },
];

/** 倍率の 1 段送り。 */
function stepZoom(zoom: number, direction: -1 | 1): number {
  const index = ZOOM_LEVELS.findIndex((level) => level >= zoom - 1e-6);
  const current = index < 0 ? ZOOM_LEVELS.length - 1 : index;
  return ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, Math.max(0, current + direction))];
}

/** アイコン ボタン (実物ツールバーのボタンと同じ 22x22)。 */
const ICON_BUTTON_STYLE: CSSProperties = {
  width: 22,
  height: 22,
  padding: 0,
  minWidth: 0,
  minHeight: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
};

/** ページ指定ボックス (3020 / 3023)。 */
const PAGE_INPUT_STYLE: CSSProperties = {
  width: 40,
  height: 21,
  padding: 0,
  minHeight: 0,
  boxSizing: 'border-box',
  textAlign: 'right',
  flex: '0 0 auto',
};

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

/** 用紙サイズ・余白 (ダイアログ 203) の表示。 */
const PAGE_SETUP_STYLE: CSSProperties = {
  flex: '0 0 auto',
  color: '#000080',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

/** 印刷色の見本 (「色の設定」の印刷色 9 個)。 */
const CHECK_SWATCH_STYLE: CSSProperties = {
  display: 'inline-block',
  width: 12,
  height: 12,
  border: '1px solid #808080',
};

export function PrintPreviewWindow({
  title = 'プレビュー',
  pageCount,
  pageNo,
  imageUrl = DEFAULT_IMAGE_URL,
  content,
  zoom,
  pageSetup,
  checkColors,
  onZoomChange,
  onPageChange,
  onClose,
  initialX = 120,
  initialY = 40,
  // 元実装のプレビューは用紙 1 枚ぶんが見える大きさ (ユーザー提供のスクリーンショット 965 x 745)。
  width = 965,
  height = 745,
  zIndex,
}: PrintPreviewWindowProps) {
  // ページ指定ボックス (3020 / 3023) は編集中の文字列を持つ。
  const [pageDraft, setPageDraft] = useState(String(pageNo));

  // 前頁 / 次頁でページが変わったら、ページ指定ボックスの表示も追随させる。
  useEffect(() => {
    setPageDraft(String(pageNo));
  }, [pageNo]);
  useEffect(() => {
    setPageDraft(String(pageNo));
  }, [pageNo]);

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
        {pageSetup === undefined ? null : (
          <div data-testid="preview-page-setup" style={PAGE_SETUP_STYLE}>
            {`用紙 ${pageSetup.paperWidth}×${pageSetup.paperHeight}mm (${pageSetup.dpi}dpi) / 余白 左右 ${pageSetup.marginX}mm 上下 ${pageSetup.marginY}mm`}
          </div>
        )}
        {checkColors === undefined ? null : (
          <div data-testid="preview-check-colors" style={PAGE_SETUP_STYLE}>
            <span>チェック色 :</span>
            {checkColors.map((hex, index) => (
              <span
                key={hex}
                title={`色${index + 1}`}
                style={{ ...CHECK_SWATCH_STYLE, background: hex }}
              />
            ))}
          </div>
        )}
        <div data-testid="preview-button-row" style={BUTTON_ROW_STYLE}>
          {ZOOM_CONTROLS.map(({ controlId, label, zoom: level, icon }) => (
            <Button
              key={controlId}
              data-ctrl-id={controlId}
              aria-label={label}
              title={label}
              style={ICON_BUTTON_STYLE}
              onClick={() =>
                onZoomChange(level === 'stepOut' ? stepZoom(zoom, -1) : level === 'stepIn' ? stepZoom(zoom, 1) : level)
              }
            >
              <img src={icon} width={16} height={16} alt="" />
            </Button>
          ))}
          <Button
            data-ctrl-id={3012}
            aria-label="前頁"
            title="前頁"
            disabled={pageNo <= 1}
            style={ICON_BUTTON_STYLE}
            onClick={() => onPageChange(pageNo - 1)}
          >
            <img src={TOOLBAR_ICONS.pagePrev} width={16} height={16} alt="" />
          </Button>
          <TextBox
            aria-label="ページ指定"
            data-ctrl-id={3023}
            data-testid="preview-page-input"
            style={PAGE_INPUT_STYLE}
            inputMode="numeric"
            value={pageDraft}
            onChange={(event) => setPageDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              const parsed = Number.parseInt(pageDraft, 10);
              if (!Number.isNaN(parsed)) onPageChange(Math.min(pageCount, Math.max(1, parsed)));
            }}
          />
          <Button
            data-ctrl-id={3013}
            aria-label="次頁"
            title="次頁"
            disabled={pageNo >= pageCount}
            style={ICON_BUTTON_STYLE}
            onClick={() => onPageChange(pageNo + 1)}
          >
            <img src={TOOLBAR_ICONS.pageNext} width={16} height={16} alt="" />
          </Button>
          <Button
            variant="default"
            data-ctrl-id={3019}
            data-testid="preview-close"
            aria-label="閉じる"
            title="閉じる"
            style={ICON_BUTTON_STYLE}
            onClick={onClose}
          >
            閉じる
          </Button>
        </div>
        <div data-ctrl-id={3011} data-testid="preview-area" style={PREVIEW_AREA_STYLE}>
          {content !== undefined ? (
            // 印刷形式ごとのページ。倍率は `zoom` プロパティで中身ごと拡大縮小する
            // (レイアウトにも効くので、大きな会場図は ZOOM 1/2 で縮めて見る)。
            <div style={{ zoom }}>{content}</div>
          ) : imageUrl === '' ? null : (
            <img
              data-testid="preview-image"
              src={imageUrl}
              alt={`${pageNo} ページ目のプレビュー`}
              draggable={false}
              style={{ width: `${zoom * 100}%`, height: 'auto' }}
            />
          )}
        </div>
        {/*
          CHM 4PRINT/5PREVIEW.HTM の並び。①表示倍率ボタン ②前頁ボタン ③ページ指定ボックス
          ④次頁ボタン ⑤閉じるボタン (元実装のプレビューに印刷ボタンは無い)。
        */}
      </div>
    </Window>
  );
}
