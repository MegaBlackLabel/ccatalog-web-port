/**
 * あいうえお行 (サークル名の読みの並び)。一覧ウィンドウの「日付／インデックス」表示と、
 * メインウィンドウのインデックスジャンプで同じ分類を使うために共有する。
 *
 * 読みの 1 文字目を normalize した結果がどの行に入るかで分類し、小書きのかな (ぁ ゃ っ など) も
 * 同じ行に入れる — 元実装はこれを漏らしていた
 * (CHM `0BASE/4CHANGE.HTM`「サークル名フリガナが 小文字のサークルが表示されない問題の修正」)。
 */
import { normalize } from './normalize';

export const KANA_ROWS: readonly { label: string; chars: string }[] = [
  { label: 'あ', chars: 'あいうえおぁぃぅぇぉ' },
  { label: 'か', chars: 'かきくけこがぎぐげご' },
  { label: 'さ', chars: 'さしすせそざじずぜぞ' },
  { label: 'た', chars: 'たちつてとだぢづでどっ' },
  { label: 'な', chars: 'なにぬねの' },
  { label: 'は', chars: 'はひふへほばびぶべぼぱぴぷぺぽ' },
  { label: 'ま', chars: 'まみむめも' },
  { label: 'や', chars: 'やゆよゃゅょ' },
  { label: 'ら', chars: 'らりるれろ' },
  { label: 'わ', chars: 'わゐゑを' },
  { label: 'ん', chars: 'ん' },
];

/** かな行に属さない読み (英数・記号・未登録)。 */
export const OTHER_KANA_ROW = 'その他';

const KANA_ROW_CHARS = KANA_ROWS.map((row) => ({ label: row.label, chars: normalize(row.chars) }));

/** 読みの 1 文字目が属するかな行 (search.ts と同じく先頭 1 文字を normalize して比べる)。 */
export function kanaRowOf(circleKana: string): string {
  const head = normalize([...circleKana][0] ?? '');
  for (const row of KANA_ROW_CHARS) {
    if (row.chars.includes(head)) return row.label;
  }
  return OTHER_KANA_ROW;
}
