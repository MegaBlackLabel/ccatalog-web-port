/**
 * 画像ファイル出力の「出力範囲 / ページ指定」の解釈 (ダイアログ 197 のエディット 1637)。
 *
 * CHM 4PRINT/6BMP.HTM:
 * 「「ページ指定」の場合は、エディットボックスに出力したいページ番号をコンマ区切りで入力してください。
 *  「2-5」(2 ページ目から 5 ページ目まで) や「3-」(3 ページ目から最後まで)、「-5」(最初から 5 ページ目まで)
 *  のような形で範囲で指定することや、これらをコンマ区切りで複数指定することもできます。」
 */

/**
 * ページ指定の文字列をページ番号の一覧にする (昇順・重複なし)。
 * 範囲外・数値でない部分は無視する。空文字なら空配列。
 */
export function parsePageSpec(spec: string, maxPage: number): number[] {
  const pages = new Set<number>();
  for (const part of spec.split(',')) {
    const text = part.trim();
    if (text.length === 0) continue;
    const range = /^(\d*)\s*-\s*(\d*)$/.exec(text);
    if (range !== null) {
      const start = range[1] === '' ? 1 : Number(range[1]);
      const end = range[2] === '' ? maxPage : Number(range[2]);
      for (let page = Math.max(1, start); page <= Math.min(maxPage, end); page += 1) pages.add(page);
      continue;
    }
    const page = Number(text);
    if (Number.isInteger(page) && page >= 1 && page <= maxPage) pages.add(page);
  }
  return [...pages].sort((left, right) => left - right);
}
