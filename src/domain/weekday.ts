import type { DateInfo } from './types';

/**
 * `ComiketDate.weekday` の表記 (実物 DB は 1=日 … 7=土)。
 * 元実装のコンボとチェックリストのタブは「金曜日」のような曜日を出す。
 */
export const WEEKDAY_NAMES = [
  '',
  '日曜日',
  '月曜日',
  '火曜日',
  '水曜日',
  '木曜日',
  '金曜日',
  '土曜日',
] as const;

/** 同じ曜日の略称 (印刷プレビューの見出し「1日目 （金）」に使う)。 */
export const WEEKDAY_SHORT = ['', '日', '月', '火', '水', '木', '金', '土'] as const;

/**
 * 日程の曜日名。日程が見つからないときは「n日目」に落とす
 * (実物のコンボも日程が引けない日付は番号で出す)。
 */
export function dayLabelOf(dates: readonly DateInfo[], day: number): string {
  const date = dates.find((entry) => entry.id === day);
  return WEEKDAY_NAMES[date?.weekday ?? 0] || `${day}日目`;
}
