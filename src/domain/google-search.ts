import type { GoogleSearchSettings } from './app-settings';
import type { Circle } from './types';

/** 検索対象の項目 (ダイアログ 212 のチェックボックスと同じ並び)。 */
const FIELD_VALUES: Record<keyof GoogleSearchSettings['fields'], (circle: Circle) => string> = {
  circleName: (circle) => circle.circleName,
  penName: (circle) => circle.penName,
  bookName: (circle) => circle.bookName,
  circleKana: (circle) => circle.circleKana,
};

/**
 * Google 検索のクエリ (ダイアログ 212 の条件設定)。
 * - both … 「サークル名」と「執筆者名」の両方を含む (空白区切り = すべて含む)
 * - either … どちらかを含む (OR)
 * - custom … 選んだ項目を「両方を含む (AND) / いずれかを含む (OR)」でつなぐ
 *
 * 元実装は条件設定に従って検索語を組み立ててブラウザに渡す。空の項目は落とす。
 */
export function buildGoogleQuery(circle: Circle, settings: GoogleSearchSettings): string {
  if (settings.mode === 'custom') {
    const keys = Object.keys(FIELD_VALUES) as (keyof typeof FIELD_VALUES)[];
    const terms = keys
      .filter((key) => settings.fields[key])
      .map((key) => FIELD_VALUES[key](circle).trim())
      .filter((value) => value.length > 0);
    return terms.join(settings.andMode ? ' ' : ' OR ');
  }
  const terms = [circle.circleName.trim(), circle.penName.trim()].filter(
    (value) => value.length > 0,
  );
  return terms.join(settings.mode === 'either' ? ' OR ' : ' ');
}
