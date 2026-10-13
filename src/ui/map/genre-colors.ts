/**
 * ジャンル表示 (会場マップに半透明で重ねるジャンル情報) の色。
 *
 * 実物のジャンルには色が無く (DB の ComiketGenre は ID / 名前 / コードだけ)、
 * 元実装のヘルプ (1WINDOW/5MAP.HTM) にも濃さの指定しか書かれていないため、
 * アプリ側で決める: VGA の原色 12 色をジャンル ID の順に割り当てる。
 * 半透明で地図の上に重ねるので、白地の上でも濃い色でも見分けられる原色を使う。
 */
const GENRE_PALETTE: readonly string[] = [
  '#000080', // 紺
  '#008080', // 青緑
  '#008000', // 緑
  '#808000', // 黄土
  '#800080', // 紫
  '#800000', // 臙脂
  '#0000ff', // 青
  '#00ffff', // 水色
  '#00ff00', // 黄緑
  '#ffff00', // 黄
  '#ff00ff', // マゼンタ
  '#ff0000', // 赤
];

/** ジャンル ID に対応する色 (12 色を繰り返す)。 */
export function genreColor(genreId: number): string {
  const index = Math.abs(genreId - 1) % GENRE_PALETTE.length;
  return GENRE_PALETTE[index];
}
