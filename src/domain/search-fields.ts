import type { Circle } from './types';

/**
 * 検索対象項目。`bit` は元実装 FUN_00475cb0 が条件オブジェクト (+0xb4) に対して
 * `TEST [EBP+0xb4], imm` で判定していたビット、`controlId` は検索ダイアログ
 * (リソース #135) のチェックボックス ID。`label` はそのラベルから "&" を除いたもの。
 */
export type SearchField = {
  bit: number;
  key: SearchFieldKey;
  label: string;
  controlId: number;
};

export type SearchFieldKey =
  | 'circleName'
  | 'circleKana'
  | 'penName'
  | 'bookName'
  | 'url'
  | 'mailAddr'
  | 'description'
  | 'memo'
  | 'genreName'
  | 'updateData'
  | 'circlems'
  | 'rss'
  | 'twitter'
  | 'pixiv';

/** 選択された項目の列は元実装と同じ順序で `||` 連結してから部分一致する。 */
export const SEARCH_FIELDS: readonly SearchField[] = [
  { bit: 0x0001, key: 'circleName', label: 'サークル名', controlId: 1008 },
  { bit: 0x0002, key: 'circleKana', label: '読みがな', controlId: 1009 },
  { bit: 0x0004, key: 'penName', label: '執筆者', controlId: 1010 },
  { bit: 0x0008, key: 'bookName', label: '発行誌', controlId: 1011 },
  { bit: 0x0010, key: 'url', label: 'URL', controlId: 1012 },
  { bit: 0x0020, key: 'mailAddr', label: 'メール', controlId: 1013 },
  { bit: 0x0040, key: 'description', label: '補足', controlId: 1014 },
  { bit: 0x0080, key: 'memo', label: 'メモ', controlId: 1042 },
  { bit: 0x0100, key: 'genreName', label: 'ジャンル', controlId: 1044 },
  { bit: 0x0200, key: 'updateData', label: '更新', controlId: 1043 },
  { bit: 0x0400, key: 'circlems', label: 'Circle.ms', controlId: 1045 },
  { bit: 0x0800, key: 'rss', label: 'RSS', controlId: 1046 },
  { bit: 0x1000, key: 'twitter', label: 'Twitter', controlId: 1048 },
  { bit: 0x2000, key: 'pixiv', label: 'Pixiv', controlId: 1049 },
] as const;

/** ダイアログ初期状態は全項目チェック (FUN_00475aa0 が 0xFFFF を設定)。 */
export const ALL_FIELDS_MASK = 0xffff;

export const fieldBit = (key: SearchFieldKey): number =>
  SEARCH_FIELDS.find((field) => field.key === key)?.bit ?? 0;

/** その列がキーワード検索の対象に含まれているか。 */
export const isFieldSelected = (mask: number, key: SearchFieldKey): boolean =>
  (mask & fieldBit(key)) !== 0;

/** 未使用の型引数を避けるための参照 (Circle は列参照の型付けに使う)。 */
export type CircleFieldKey = Extract<keyof Circle, SearchFieldKey>;
