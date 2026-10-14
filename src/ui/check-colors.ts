/**
 * チェック色 1〜9 の実物の色。
 *
 * 実測元: サークル詳細ウィンドウのツールバーに並ぶ 9 個の色ボタン
 * (`解析/ui_capture/4-サークル詳細.png` の y 38..48、x 137..341 を 1px 単位で読み取り)。
 * 色ボタンは 12x12px・ピッチ 21px で 9 個。
 *
 * 現在の UI の色ボタンは、どのウィンドウでもサークルカット ウィンドウの色ボタンに
 * 合わせた 22x22 のアイコン ボタン (checkSwatchIcon) に統一してある。
 */
import type { CheckColor } from '../app/catalog-state';

/** 色 1〜9 (0 = 標準色はアプリ側で白として扱うので含めない)。 */
export const CHECK_COLOR_HEX: Record<Exclude<CheckColor, 0>, string> = {
  1: '#ff944a', // 橙 (255,148,74)
  2: '#ff00ff', // マゼンタ (255,0,255)
  3: '#fff700', // 黄 (255,247,0)
  4: '#00b54a', // 緑 (0,181,74)
  5: '#00b5ff', // 水色 (0,181,255)
  6: '#9c529c', // 紫 (156,82,156)
  7: '#0000ff', // 青 (0,0,255)
  8: '#00ff00', // 黄緑 (0,255,0)
  9: '#ff0000', // 赤 (255,0,0)
};

/** 標準色 (0) の見本色。実物の会場マップでチェック済みの机が塗られている緑。 */
export const STANDARD_CHECK_COLOR_HEX = '#00c060';

/**
 * チェック色の見本色。0 は標準色。色 1〜9 は「色の設定」(動作設定) の 9 色があれば
 * それを使い、無ければ実物のツールバーから実測した色を使う。
 */
export function checkColorHex(color: CheckColor, colors?: readonly string[]): string {
  if (color === 0) return STANDARD_CHECK_COLOR_HEX;
  return colors?.[color - 1] ?? CHECK_COLOR_HEX[color];
}

/**
 * 塗りの上に載せる文字色。明るい色 (黄・水色・黄緑・白) の上では黒、
 * 暗い色の上では白にして読めるようにする (実物も色ごとに文字色を変えている)。
 */
export function checkColorText(color: CheckColor, colors?: readonly string[]): string {
  const hex = checkColorHex(color, colors).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  // 相対輝度 (sRGB の係数) で明暗を決める。
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6 ? '#000000' : '#ffffff';
}

/** 色 1〜9 の並び (元実装のツールバーの順)。 */
export const CHECK_COLOR_IDS: readonly Exclude<CheckColor, 0>[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** 色 1〜9 の見本色の並び (「色の設定」の 9 色を反映)。色ボタンのアイコンに使う。 */
export function checkColorPalette(colors?: readonly string[]): string[] {
  return CHECK_COLOR_IDS.map((color) => checkColorHex(color, colors));
}

/**
 * 色ボタンの色矩形のアイコン (サークルカット ウィンドウの色ボタンと同じ見た目)。
 *
 * ツールバー本体は <img> しか持てないため、18x18 の色矩形 (17x17 + #404040 の枠) を
 * SVG にして data URI で渡す。色ボタンは 4 つのウィンドウ (サークルカット /
 * チェックリスト / サークル一覧 / サークル詳細) がこの 1 つのアイコンを共有する。
 */
export function checkSwatchIcon(color: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">' +
    `<rect x="0.5" y="0.5" width="17" height="17" fill="${color}" stroke="#404040"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
