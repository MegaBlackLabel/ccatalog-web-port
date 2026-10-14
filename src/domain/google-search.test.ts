import { describe, expect, it } from 'vitest';
import type { GoogleSearchSettings } from './app-settings';
import { DEFAULT_GOOGLE_SEARCH_SETTINGS } from './app-settings';
import { buildGoogleQuery } from './google-search';
import type { Circle } from './types';

const CIRCLE: Circle = {
  id: 1,
  comiketNo: 96,
  pageNo: 104,
  cutIndex: 1,
  day: 1,
  blockId: 5,
  spaceNo: 2,
  spaceNoSub: 0,
  genreId: 1,
  circleName: 'きんやま書房',
  circleKana: 'ｷﾝﾔﾏｼｮﾎﾞｳ',
  penName: 'アオイ そら',
  bookName: '同人誌の作り方',
  url: '',
  mailAddr: '',
  description: '',
  memo: '',
  updateId: 0,
  updateData: '',
  circlems: '',
  rss: '',
  updateFlag: 0,
  twitter: '',
  pixiv: '',
};

describe('buildGoogleQuery (ダイアログ 212 の条件設定)', () => {
  it('既定 (両方を含む) はサークル名と執筆者名を空白でつなぐ', () => {
    expect(buildGoogleQuery(CIRCLE, DEFAULT_GOOGLE_SEARCH_SETTINGS)).toBe('きんやま書房 アオイ そら');
  });

  it('いずれかを含む は OR でつなぐ', () => {
    const settings: GoogleSearchSettings = { ...DEFAULT_GOOGLE_SEARCH_SETTINGS, mode: 'either' };
    expect(buildGoogleQuery(CIRCLE, settings)).toBe('きんやま書房 OR アオイ そら');
  });

  it('カスタム設定 (発行誌名だけ / 両方を含む) は選んだ項目だけを使う', () => {
    const settings: GoogleSearchSettings = {
      mode: 'custom',
      andMode: true,
      fields: { circleName: false, penName: false, bookName: true, circleKana: false },
    };
    expect(buildGoogleQuery(CIRCLE, settings)).toBe('同人誌の作り方');
  });

  it('カスタム設定で「いずれかを含む」を選ぶと選んだ項目を OR でつなぐ', () => {
    const settings: GoogleSearchSettings = {
      mode: 'custom',
      andMode: false,
      fields: { circleName: true, penName: false, bookName: true, circleKana: false },
    };
    expect(buildGoogleQuery(CIRCLE, settings)).toBe('きんやま書房 OR 同人誌の作り方');
  });

  it('空の項目は落とす', () => {
    const settings: GoogleSearchSettings = {
      mode: 'custom',
      andMode: true,
      fields: { circleName: true, penName: true, bookName: false, circleKana: false },
    };
    expect(buildGoogleQuery({ ...CIRCLE, penName: '  ' }, settings)).toBe('きんやま書房');
  });
});
