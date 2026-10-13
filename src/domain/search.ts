import { normalize } from './normalize';
import { ALL_FIELDS_MASK, SEARCH_FIELDS, type SearchFieldKey } from './search-fields';
import type { CatalogData, Circle } from './types';

/**
 * 検索条件。元実装の条件オブジェクト (FUN_001ee90 / FUN_0041dac0 が
 * `Search` セクションに保存する項目) に対応する。
 */
export type SearchCondition = {
  /** 参加日。抽選漏れは 0。空配列は「すべての日付」。 */
  days: number[];
  /** ジャンル ID。空配列は「すべてのジャンル」。 */
  genres: number[];
  /** ブロック ID。 */
  blocks: number[];
  /** あいうえおインデックス。`normalize(circleKana[0])` と比較する。 */
  kanaIndex: string[];
  /** 検索対象項目のビットマスク。 */
  fields: number;
  /** スペース区切りのキーワード。 */
  keywords: string;
  /** true =「全ての語を含む」/ false =「いずれかの語を含む」。 */
  andMode: boolean;
  /** あいまい検索。検索語と被検索値の両方を normalize する。 */
  fuzzy: boolean;
  /** メモが記入されているサークルのみ。 */
  memoOnly: boolean;
  /** ネット更新されたサークルのみ。 */
  updatedOnly: boolean;
};

/** ダイアログ初期状態 (FUN_0041ee90: andMode=1, normalize=1, column=0xFFFF)。 */
export const DEFAULT_SEARCH_CONDITION: SearchCondition = {
  days: [],
  genres: [],
  blocks: [],
  kanaIndex: [],
  fields: ALL_FIELDS_MASK,
  keywords: '',
  andMode: true,
  fuzzy: true,
  memoOnly: false,
  updatedOnly: false,
};

/** FUN_00475fc0 と同じ区切り: 半角スペース / タブ / 全角スペース。 */
const KEYWORD_SEPARATOR = /[\s\u3000]+/;

export function splitKeywords(input: string): string[] {
  return input.split(KEYWORD_SEPARATOR).filter((token) => token.length > 0);
}

function fieldValue(circle: Circle, key: SearchFieldKey, genreName: string): string {
  return key === 'genreName' ? genreName : circle[key];
}

/**
 * 1 語の判定。元実装は選択列を `||` で連結した文字列に対して
 * `cnt(連結列, '語')` / `ncnt(連結列, '語')` を呼ぶだけなので、
 * 列をまたいだ部分一致も成立する。
 */
function matchesKeyword(
  circle: Circle,
  genreName: string,
  condition: SearchCondition,
  keyword: string,
): boolean {
  if (keyword.length === 0) return false;
  let joined = '';
  for (const field of SEARCH_FIELDS) {
    if ((condition.fields & field.bit) !== 0) joined += fieldValue(circle, field.key, genreName);
  }
  return condition.fuzzy ? normalize(joined).includes(normalize(keyword)) : joined.includes(keyword);
}

export function matchesCircle(
  circle: Circle,
  genreName: string,
  condition: SearchCondition,
): boolean {
  if (condition.days.length > 0 && !condition.days.includes(circle.day)) return false;
  if (condition.genres.length > 0 && !condition.genres.includes(circle.genreId)) return false;
  if (condition.blocks.length > 0 && !condition.blocks.includes(circle.blockId)) return false;
  if (condition.memoOnly && circle.memo.length === 0) return false;
  if (condition.updatedOnly && circle.updateFlag === 0) return false;
  if (condition.kanaIndex.length > 0) {
    const head = normalize([...circle.circleKana][0] ?? '');
    if (!condition.kanaIndex.includes(head)) return false;
  }

  const keywords = splitKeywords(condition.keywords);
  if (keywords.length === 0) return true;
  const results = keywords.map((keyword) => matchesKeyword(circle, genreName, condition, keyword));
  return condition.andMode ? results.every(Boolean) : results.some(Boolean);
}

/** 検索を実行し、元の並び順のまま結果を返す。 */
export function searchCircles(data: CatalogData, condition: SearchCondition): Circle[] {
  const genreNames = new Map(data.genres.map((genre) => [genre.id, genre.name]));
  return data.circles.filter((circle) =>
    matchesCircle(circle, genreNames.get(circle.genreId) ?? '', condition),
  );
}
