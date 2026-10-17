/**
 * 用紙 (元ダイアログ 203 のコンボ 1643、1538 の用紙サイズ 1641)。
 *
 * 実物はプリンタ ドライバが返す用紙の一覧を出すため、PE のリソースには紙名が無い
 * (cpr.ini の [DOCUMENT] には選んだ紙の幅・高さだけが残る)。Web 版は代表的な
 * JIS/ISO のサイズを持ち、選ぶと幅・高さがその値になる。
 */
export type PaperSize = {
  /** コンボに出す名前。 */
  name: string;
  /** 幅 (mm)。 */
  width: number;
  /** 高さ (mm)。 */
  height: number;
};

export const PAPER_SIZES: readonly PaperSize[] = [
  { name: 'A4', width: 210, height: 297 },
  { name: 'A3', width: 297, height: 420 },
  { name: 'B4', width: 257, height: 364 },
  { name: 'B5', width: 182, height: 257 },
  { name: 'A5', width: 148, height: 210 },
  { name: 'はがき', width: 100, height: 148 },
];

/**
 * mm の表示 (実物のエディットは 297.0 のように小数 1 桁で出す)。
 */
export function formatMm(value: number): string {
  return value.toFixed(1);
}
