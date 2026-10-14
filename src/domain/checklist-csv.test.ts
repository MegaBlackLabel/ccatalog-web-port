import { describe, expect, it } from 'vitest';
import type { ChecklistEntry } from '../app/catalog-state';
import { parseChecklistCsv, toChecklistCsv, type ChecklistCsvRow } from './checklist-csv';
import type { Circle } from './types';

function makeCircle(over: Partial<Circle> = {}): Circle {
  return {
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
    description: '説明',
    memo: '',
    updateId: 0,
    updateData: '',
    circlems: '',
    rss: '',
    updateFlag: 0,
    twitter: '',
    pixiv: '',
    ...over,
  };
}

const ENTRY: ChecklistEntry = { circleId: 1, color: 3 };

function makeRow(): ChecklistCsvRow {
  return {
    entry: ENTRY,
    circle: makeCircle(),
    genreName: '創作',
    space: '2a',
    dayLabel: '1日目',
    colorLabel: '色3',
    memo: '東館 先に寄る',
  };
}

describe('チェックリスト CSV (元実装の保存 / 読み込み)', () => {
  it('Ver2 は表と同じ並びの列で出す', () => {
    const csv = toChecklistCsv([makeRow()], 2);
    const [header, line] = csv.split('\r\n');
    expect(header).toBe('No,色,サークル名,読み,執筆者,発行誌,補足,メモ,位置,日付,ジャンル');
    expect(line).toBe('1,色3,きんやま書房,ｷﾝﾔﾏｼｮﾎﾞｳ,アオイ そら,同人誌の作り方,説明,東館 先に寄る,2a,1日目,創作');
  });

  it('Ver1 は色と位置を落とす', () => {
    const [header, line] = toChecklistCsv([makeRow()], 1).split('\r\n');
    expect(header).toBe('No,サークル名,読み,執筆者,発行誌,補足,メモ,日付,ジャンル');
    expect(line).toBe('1,きんやま書房,ｷﾝﾔﾏｼｮﾎﾞｳ,アオイ そら,同人誌の作り方,説明,東館 先に寄る,1日目,創作');
  });

  it('カンマ・引用符・改行を含む値は引用符で囲み、読み込みで元に戻る', () => {
    const row = makeRow();
    const csv = toChecklistCsv(
      [{ ...row, memo: '「A,B」\n2 行目' }],
      2,
    );
    const parsed = parseChecklistCsv(csv);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].memo).toBe('「A,B」\n2 行目');
  });

  it('読み込みはヘッダーから列を決めるので Ver1 / Ver2 のどちらでも読める', () => {
    const v2 = parseChecklistCsv(toChecklistCsv([makeRow()], 2));
    expect(v2).toEqual([
      { circleName: 'きんやま書房', circleKana: 'ｷﾝﾔﾏｼｮﾎﾞｳ', penName: 'アオイ そら', memo: '東館 先に寄る', color: 3 },
    ]);

    const v1 = parseChecklistCsv(toChecklistCsv([makeRow()], 1));
    expect(v1).toEqual([
      { circleName: 'きんやま書房', circleKana: 'ｷﾝﾔﾏｼｮﾎﾞｳ', penName: 'アオイ そら', memo: '東館 先に寄る', color: 0 },
    ]);
  });

  it('サークル名が空の行と空ファイルは落とす', () => {
    expect(parseChecklistCsv('')).toEqual([]);
    expect(parseChecklistCsv('No,色,サークル名\r\n1,色1,\r\n2,色2,名前\r\n')).toEqual([
      { circleName: '名前', circleKana: '', penName: '', memo: '', color: 2 },
    ]);
  });
});
