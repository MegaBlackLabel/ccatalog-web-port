import { describe, expect, it } from 'vitest';
import { parsePageSpec } from './page-spec';

describe('parsePageSpec (ダイアログ 197 のページ指定)', () => {
  it('コンマ区切りの番号をそのまま読む (順番は昇順に直す)', () => {
    expect(parsePageSpec('3,1,2', 10)).toEqual([1, 2, 3]);
  });

  it('「2-5」は範囲として読む', () => {
    expect(parsePageSpec('2-5', 10)).toEqual([2, 3, 4, 5]);
  });

  it('「3-」は最後まで、「-5」は最初から読む', () => {
    expect(parsePageSpec('3-', 5)).toEqual([3, 4, 5]);
    expect(parsePageSpec('-3', 5)).toEqual([1, 2, 3]);
  });

  it('範囲と番号を混ぜられる (重複はまとめる)', () => {
    expect(parsePageSpec('1, 3-5, 5, 7-', 8)).toEqual([1, 3, 4, 5, 7, 8]);
  });

  it('範囲外・数値でない部分は無視する', () => {
    expect(parsePageSpec('0, 11, abc, 2', 10)).toEqual([2]);
    expect(parsePageSpec('', 10)).toEqual([]);
    expect(parsePageSpec('   ', 10)).toEqual([]);
  });

  it('逆順の範囲 (5-2) は空になる', () => {
    expect(parsePageSpec('5-2', 10)).toEqual([]);
  });
});
