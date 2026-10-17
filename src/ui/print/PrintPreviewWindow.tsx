import type { CSSProperties, ReactNode } from 'react';
import { Button, Window } from '@megablacklabel/react98retro';
import type { PageSetup } from '../../domain/app-settings';
import { assetUrl } from '../asset-url';
import { formatMm } from './paper-sizes';
import { PREVIEW_ICONS } from './preview-icons';

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
  /** 色1〜9 の名称 (「色の設定」)。空文字の色は「(名称未登録)」で出す。 */
  checkColorNames?: readonly string[];
  /**
   * 中身 (content) をウインドウいっぱいに広げる。サークルリスト印刷のプレビューは
   * 用紙の見本ではなく全幅の表なので、余白と中央寄せを外す。
   */
  fillContent?: boolean;
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
 * 実物のツールバーは ×1/4 / ×1/2 / ×1 / ×2 / ×4 のアイコン ボタンで、今の倍率が凹む。
 */
const ZOOM_CONTROLS: readonly {
  controlId: number;
  label: string;
  icon: string;
  zoom: number;
}[] = [
  { controlId: 3014, label: '×1/4', icon: PREVIEW_ICONS.zoom1_4, zoom: 0.25 },
  { controlId: 3015, label: '×1/2', icon: PREVIEW_ICONS.zoom1_2, zoom: 0.5 },
  { controlId: 3016, label: '×1', icon: PREVIEW_ICONS.zoom1, zoom: 1 },
  { controlId: 3017, label: '×2', icon: PREVIEW_ICONS.zoom2, zoom: 2 },
  { controlId: 3018, label: '×4', icon: PREVIEW_ICONS.zoom4, zoom: 4 },
];

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

/** アイコン + 文字のボタン (実物の「− 前頁(P)」など)。 */
const TEXT_BUTTON_STYLE: CSSProperties = {
  height: 21,
  padding: '0 4px',
  minWidth: 0,
  minHeight: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
  whiteSpace: 'nowrap',
  flex: '0 0 auto',
};

/** 総ページ数の「/ n」(3020)。 */
const PAGE_TEXT_STYLE: CSSProperties = {
  whiteSpace: 'nowrap',
  flex: '0 0 auto',
};

/** ページ指定のコンボ (3023)。実物は「現在ページ:」を出す。 */
const PAGE_SELECT_STYLE: CSSProperties = {
  height: 21,
  minWidth: 48,
  minHeight: 0,
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

/** 中身がウインドウを埋めるときの本文 (フォームの余白と隙間を外す)。 */
const FILL_BODY_STYLE: CSSProperties = {
  ...BODY_STYLE,
  gap: 0,
  padding: 0,
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

/** 中身がウインドウを埋めるときのプレビュー面 (余白も中央寄せも無し)。 */
const FILL_PREVIEW_AREA_STYLE: CSSProperties = {
  ...PREVIEW_AREA_STYLE,
  justifyContent: 'stretch',
  alignItems: 'stretch',
  padding: 0,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
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

/** チェック色の凡例 (実物はウィンドウ下端のくぼみ枠に 5 列で並べる)。 */
const CHECK_LEGEND_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 2,
  padding: '2px 4px',
  background: '#ffffff',
  border: '1px solid #808080',
  flex: '0 0 auto',
};

/** 凡例の 1 項目 (色の見本 + 名前)。 */
const CHECK_LEGEND_ITEM_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
  whiteSpace: 'nowrap',
};

/** 中身がウインドウを埋めるときのラッパー (中身を縦に伸ばす)。 */
const FILL_CONTENT_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
  minWidth: 0,
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
  checkColorNames,
  fillContent = false,
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
    >
      <div style={fillContent ? FILL_BODY_STYLE : BODY_STYLE}>
        {pageSetup === undefined ? null : (
          <div data-testid="preview-page-setup" style={PAGE_SETUP_STYLE}>
            {`用紙 ${pageSetup.paper} ${formatMm(pageSetup.paperWidth)}×${formatMm(pageSetup.paperHeight)}mm / 余白 左 ${formatMm(pageSetup.marginLeft)} 右 ${formatMm(pageSetup.marginRight)} 上 ${formatMm(pageSetup.marginTop)} 下 ${formatMm(pageSetup.marginBottom)}mm`}
          </div>
        )}
        <div data-testid="preview-button-row" style={BUTTON_ROW_STYLE}>
          {ZOOM_CONTROLS.map(({ controlId, label, icon, zoom: level }) => (
            <Button
              key={controlId}
              data-ctrl-id={controlId}
              aria-label={label}
              aria-pressed={Math.abs(zoom - level) < 1e-6}
              title={label}
              style={ICON_BUTTON_STYLE}
              onClick={() => onZoomChange(level)}
            >
              <img src={icon} width={16} height={16} alt="" />
            </Button>
          ))}
          <Button
            data-ctrl-id={3012}
            aria-label="前頁(P)"
            title="前頁(P)"
            disabled={pageNo <= 1}
            style={TEXT_BUTTON_STYLE}
            onClick={() => onPageChange(pageNo - 1)}
          >
            <img src={PREVIEW_ICONS.pagePrev} width={16} height={16} alt="" />
            前頁(P)
          </Button>
          <select
            aria-label="ページ指定"
            data-ctrl-id={3023}
            data-testid="preview-page-select"
            style={PAGE_SELECT_STYLE}
            value={String(pageNo)}
            onChange={(event) => onPageChange(Number(event.target.value))}
          >
            {Array.from({ length: pageCount }, (_, index) => (
              <option key={index + 1} value={index + 1}>{`${index + 1}:`}</option>
            ))}
          </select>
          <span data-ctrl-id={3020} data-testid="preview-page-count" style={PAGE_TEXT_STYLE}>
            {`/ ${pageCount}`}
          </span>
          <Button
            data-ctrl-id={3013}
            aria-label="次頁(N)"
            title="次頁(N)"
            disabled={pageNo >= pageCount}
            style={TEXT_BUTTON_STYLE}
            onClick={() => onPageChange(pageNo + 1)}
          >
            <img src={PREVIEW_ICONS.pageNext} width={16} height={16} alt="" />
            次頁(N)
          </Button>
          <Button
            variant="default"
            data-ctrl-id={3019}
            data-testid="preview-close"
            aria-label="閉じる(X)"
            title="閉じる(X)"
            style={TEXT_BUTTON_STYLE}
            onClick={onClose}
          >
            <img src={PREVIEW_ICONS.close} width={16} height={16} alt="" />
            閉じる(X)
          </Button>
        </div>
        <div
          data-ctrl-id={3011}
          data-testid="preview-area"
          style={fillContent ? FILL_PREVIEW_AREA_STYLE : PREVIEW_AREA_STYLE}
        >
          {content !== undefined ? (
            // 印刷形式ごとのページ。倍率は `zoom` プロパティで中身ごと拡大縮小する
            // (レイアウトにも効くので、大きな会場図は ZOOM 1/2 で縮めて見る)。
            // ウインドウを埋める形式 (サークルリスト) は中身が縦いっぱいに伸びる。
            <div style={fillContent ? { ...FILL_CONTENT_STYLE, zoom } : { zoom }}>{content}</div>
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
        {checkColors === undefined ? null : (
          // 実物はウィンドウ下端のくぼみ枠に、色 1〜9 を 5 列で並べる。
          <div data-testid="preview-check-colors" style={CHECK_LEGEND_STYLE}>
            {checkColors.map((hex, index) => (
              <span key={index} style={CHECK_LEGEND_ITEM_STYLE}>
                <span title={`色${index + 1}`} style={{ ...CHECK_SWATCH_STYLE, background: hex }} />
                {checkColorNames?.[index] || '(名称未登録)'}
              </span>
            ))}
          </div>
        )}
        {/*
          CHM 4PRINT/5PREVIEW.HTM の並び。①表示倍率ボタン ②前頁ボタン ③ページ指定ボックス
          ④次頁ボタン ⑤閉じるボタン (元実装のプレビューに印刷ボタンは無い)。
        */}
      </div>
    </Window>
  );
}
