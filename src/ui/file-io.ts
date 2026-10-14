/**
 * ブラウザでのファイル出力 / 入力 (元実装の「保存」「開く」)。
 *
 * 元実装は Windows のファイルダイアログを出すが、Web 版はブラウザのダウンロードと
 * ファイル選択で代用する。ダミーデータでも、書き出したものをそのまま読み戻せる。
 */

/** テキストをファイルとしてダウンロードする。 */
export function downloadText(filename: string, text: string, type = 'text/csv'): void {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
