import type { GoogleSearchField, GoogleSearchSettings } from './app-settings';
import type { Circle } from './types';

/** 検索対象の項目 (ダイアログ 212 のコンボ 1693 / 1694 の並び)。 */
export const GOOGLE_SEARCH_FIELDS: readonly { value: GoogleSearchField; label: string }[] = [
  { value: 'circleName', label: 'サークル名' },
  { value: 'circleKana', label: '読みがな' },
  { value: 'penName', label: '執筆者名' },
  { value: 'bookName', label: '発行誌名' },
];

const FIELD_VALUES: Record<GoogleSearchField, (circle: Circle) => string> = {
  circleName: (circle) => circle.circleName,
  circleKana: (circle) => circle.circleKana,
  penName: (circle) => circle.penName,
  bookName: (circle) => circle.bookName,
};

/**
 * Google 検索のクエリ (ダイアログ 212 の条件設定)。
 * - both … 「サークル名」と「執筆者名」の両方を含む (空白区切り = すべて含む)
 * - either … どちらかを含む (OR)
 * - custom … 項目 1 / 項目 2 を「両方を含む (AND) / いずれかを含む (OR)」でつなぐ
 *
 * 元実装は条件設定に従って検索語を組み立ててブラウザに渡す。空の項目は落とす。
 */
export function buildGoogleQuery(circle: Circle, settings: GoogleSearchSettings): string {
  if (settings.mode === 'custom') {
    const terms = [settings.field1, settings.field2]
      .map((field) => FIELD_VALUES[field](circle).trim())
      .filter((value) => value.length > 0);
    return terms.join(settings.andMode ? ' ' : ' OR ');
  }
  const terms = [circle.circleName.trim(), circle.penName.trim()].filter(
    (value) => value.length > 0,
  );
  return terms.join(settings.mode === 'either' ? ' OR ' : ' ');
}
