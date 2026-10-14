/**
 * カットビューの表示領域に合わせる拡大率 (元実装の「幅に合わせる / 高さに合わせる / 全体を表示」)。
 * 画面に合わせる計算はここに集め、App (状態) からは純関数として呼ぶ。
 */

/** 合わせ方。free は「元のサイズ / 拡大率指定」で、この関数の対象外。 */
export type FitMode = 'width' | 'height' | 'all';

/** 表示領域 (カットビューの箱)。 */
export type FitBox = { width: number; height: number };

/** カット 1 枚の表示サイズ (カタログ情報の cutSizeW / cutSizeH)。 */
export type CutSize = { width: number; height: number };

/** 拡大率の下限 / 上限。元実装のツールバー Edit と同じ 25%〜300%。 */
export const FIT_ZOOM_MIN = 0.25;
export const FIT_ZOOM_MAX = 3;

/**
 * 表示領域に合わせた拡大率 (1 = 100%)。
 * - width … 6 列が横に収まる
 * - height … 行数ぶんが縦に収まる
 * - all … 両方が収まる方 (小さい方)
 *
 * 表示領域が未計測 (幅か高さが 0) のときは 100% を返す (jsdom など、レイアウトが無い環境)。
 */
export function fitZoom(
  mode: FitMode,
  box: FitBox,
  cut: CutSize,
  columns: number,
  rows: number,
): number {
  if (box.width <= 0 || box.height <= 0) return 1;
  const byWidth = box.width / (columns * cut.width);
  const byHeight = box.height / (Math.max(1, rows) * cut.height);
  const raw = mode === 'width' ? byWidth : mode === 'height' ? byHeight : Math.min(byWidth, byHeight);
  return Math.min(FIT_ZOOM_MAX, Math.max(FIT_ZOOM_MIN, raw));
}
