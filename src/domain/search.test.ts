import { describe, expect, it } from 'vitest';
import type { CatalogData, Circle, Genre } from './types';
import {
  DEFAULT_SEARCH_CONDITION,
  searchCircles,
  splitKeywords,
  type SearchCondition,
} from './search';
import { SEARCH_FIELDS, fieldBit } from './search-fields';

const genre: Genre[] = [
  { id: 14, name: '創作(少女)', code: 112 },
  { id: 21, name: '評論', code: 201 },
];

function circle(patch: Partial<Circle> & Pick<Circle, 'id'>): Circle {
  return {
    comiketNo: 96,
    pageNo: 100 + patch.id,
    cutIndex: 1,
    day: 1,
    blockId: 1,
    spaceNo: patch.id,
    spaceNoSub: 0,
    genreId: 14,
    circleName: '',
    circleKana: '',
    penName: '',
    bookName: '',
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
    ...patch,
  };
}

const data: CatalogData = {
  info: {
    comiketNo: 96,
    comiketName: 'コミックマーケット96',
    cutSizeW: 178,
    cutSizeH: 253,
    cutOriginX: 8,
    cutOriginY: 64,
    cutOffsetX: 0,
    cutOffsetY: 0,
    mapSizeW: 10,
    mapSizeH: 10,
    mapOriginX: 0,
    mapOriginY: 0,
  },
  genres: genre,
  dates: [],
  areas: [],
  blocks: [],
  layouts: [],
  maps: [],
  circles: [
    // 元 DB と同じく circleKana は半角カナで格納されている
    circle({ id: 1, circleName: 'SMYSLE', circleKana: 'ｽﾐｽﾚ', penName: 'さんしょう', bookName: 'ダークブレイカーの夏', description: 'ツインエンジェルシリーズのサロメ様中心', genreId: 14 }),
    circle({ id: 2, circleName: 'カバン無双', circleKana: 'ｶﾊﾞﾝﾑｿｳ', penName: 'kazuyu', bookName: '遥さんのらくがきちょう２', url: 'http://blog.livedoor.jp/kazuyu06/', genreId: 14, memo: '要チェック', day: 2 }),
    circle({ id: 3, circleName: '天晴館', circleKana: 'ﾃﾝｾｲｶﾝ', penName: '綾園まゆみ', bookName: 'なっちゃんBLAKE4', genreId: 21, day: 0, blockId: 0, spaceNo: 0, updateFlag: 1 }),
    circle({ id: 4, circleName: 'ANIME CLUB', circleKana: 'ｱﾆﾒｸﾗﾌﾞ', penName: 'アニメ好き', bookName: '今季アニメ総括', twitter: 'animeclub', genreId: 21 }),
  ],
};

const cond = (patch: Partial<SearchCondition> = {}): SearchCondition => ({ ...DEFAULT_SEARCH_CONDITION, ...patch });

describe('splitKeywords — FUN_00475fc0 の単語分割', () => {
  it('半角スペース・タブ・全角スペースで区切り、空要素を捨てる', () => {
    expect(splitKeywords('  アニメ   CG  ')).toEqual(['アニメ', 'CG']);
    expect(splitKeywords('アニメ\tCG')).toEqual(['アニメ', 'CG']);
    expect(splitKeywords('アニメ　CG')).toEqual(['アニメ', 'CG']);
    expect(splitKeywords('   ')).toEqual([]);
  });
});

describe('SEARCH_FIELDS — FUN_00475cb0 のビットマスク表', () => {
  it('14 項目で、既定は全項目 (0xFFFF)', () => {
    expect(SEARCH_FIELDS).toHaveLength(14);
    expect(DEFAULT_SEARCH_CONDITION.fields).toBe(0xffff);
  });

  it('ダイアログのコントロール ID とビットが元実装と一致する', () => {
    expect(SEARCH_FIELDS.map((f) => [f.controlId, f.bit])).toEqual([
      [1008, 0x0001], [1009, 0x0002], [1010, 0x0004], [1011, 0x0008],
      [1012, 0x0010], [1013, 0x0020], [1014, 0x0040], [1042, 0x0080],
      [1044, 0x0100], [1043, 0x0200], [1045, 0x0400], [1046, 0x0800],
      [1048, 0x1000], [1049, 0x2000],
    ]);
  });

  it('fieldBit は未知キーで 0 を返す', () => {
    expect(fieldBit('circleName')).toBe(0x0001);
    expect(fieldBit('genreName')).toBe(0x0100);
  });
});

describe('searchCircles — 元実装の検索条件を再現する', () => {
  it('あいまい検索は表記ゆれ（全角/半角/かな）を吸収する', () => {
    for (const keyword of ['アニメ', 'ｱﾆﾒ', 'あにめ']) {
      const hits = searchCircles(data, cond({ keywords: keyword, fuzzy: true }));
      expect(hits.map((c) => c.id)).toEqual([4]);
    }
  });

  it('あいまい検索 OFF は生の部分一致になる', () => {
    // 補足に全角「アニメ」、読みがなに半角「ｱﾆﾒ」が入っているので、生一致でもそれぞれヒットする
    expect(searchCircles(data, cond({ keywords: 'アニメ', fuzzy: false })).map((c) => c.id)).toEqual([4]);
    expect(searchCircles(data, cond({ keywords: 'ｱﾆﾒ', fuzzy: false })).map((c) => c.id)).toEqual([4]);
    // 生一致は大文字小文字を区別する（DB 上は小文字で格納されている）
    expect(searchCircles(data, cond({ keywords: 'KAZUYU', fuzzy: false }))).toHaveLength(0);
    expect(searchCircles(data, cond({ keywords: 'kazuyu', fuzzy: false })).map((c) => c.id)).toEqual([2]);
    expect(searchCircles(data, cond({ keywords: 'smysle', fuzzy: false }))).toHaveLength(0);
    expect(searchCircles(data, cond({ keywords: 'SMYSLE', fuzzy: false })).map((c) => c.id)).toEqual([1]);
    // あいまい検索なら表記ゆれを吸収する
    expect(searchCircles(data, cond({ keywords: 'KAZUYU', fuzzy: true })).map((c) => c.id)).toEqual([2]);
    expect(searchCircles(data, cond({ keywords: 'ＡＮＩＭＥ', fuzzy: true })).map((c) => c.id)).toEqual([4]);
    expect(searchCircles(data, cond({ keywords: 'smysle', fuzzy: true })).map((c) => c.id)).toEqual([1]);
  });

  it('検索対象項目のビットで列を限定できる', () => {
    const onlyName = cond({ keywords: 'サロメ', fuzzy: true, fields: fieldBit('circleName') });
    const onlyDescription = cond({ keywords: 'サロメ', fuzzy: true, fields: fieldBit('description') });
    expect(searchCircles(data, onlyName)).toHaveLength(0);
    expect(searchCircles(data, onlyDescription).map((c) => c.id)).toEqual([1]);
  });

  it('ジャンル名はビット 0x0100 のときだけ検索対象になる', () => {
    expect(searchCircles(data, cond({ keywords: '評論', fuzzy: true })).map((c) => c.id)).toEqual([3, 4]);
    expect(searchCircles(data, cond({ keywords: '評論', fuzzy: true, fields: fieldBit('circleName') }))).toHaveLength(0);
  });

  it('選択列を連結してから部分一致するためフィールド境界をまたぐ語もヒットする（元実装の癖）', () => {
    const cross = searchCircles(data, cond({ keywords: 'LEｽ', fuzzy: true, fields: 0x0003 }));
    expect(cross.map((c) => c.id)).toEqual([1]);
  });

  it('複数語は AND / OR を切り替えられる', () => {
    const and = cond({ keywords: 'anime 総括', fuzzy: true, andMode: true });
    const or = cond({ keywords: 'サロメ 総括', fuzzy: true, andMode: false });
    expect(searchCircles(data, and).map((c) => c.id)).toEqual([4]);
    expect(searchCircles(data, or).map((c) => c.id)).toEqual([1, 4]);
  });

  it('参加日は 0 を「抽選漏れ」として扱う', () => {
    expect(searchCircles(data, cond({ days: [1] })).map((c) => c.id)).toEqual([1, 4]);
    expect(searchCircles(data, cond({ days: [0] })).map((c) => c.id)).toEqual([3]);
    expect(searchCircles(data, cond({ days: [1, 2] })).map((c) => c.id)).toEqual([1, 2, 4]);
    expect(searchCircles(data, cond({ days: [] }))).toHaveLength(4);
  });

  it('ジャンル ID とブロックで絞り込める', () => {
    expect(searchCircles(data, cond({ genres: [21] })).map((c) => c.id)).toEqual([3, 4]);
    expect(searchCircles(data, cond({ blocks: [1] })).map((c) => c.id)).toEqual([1, 2, 4]);
  });

  it('メモ有無・更新有無で絞り込める', () => {
    expect(searchCircles(data, cond({ memoOnly: true })).map((c) => c.id)).toEqual([2]);
    expect(searchCircles(data, cond({ updatedOnly: true })).map((c) => c.id)).toEqual([3]);
  });

  it('あいうえおインデックスは circleKana の 1 文字目を正規化して比較する', () => {
    expect(searchCircles(data, cond({ kanaIndex: ['ｱ'] })).map((c) => c.id)).toEqual([4]);
    expect(searchCircles(data, cond({ kanaIndex: ['ｽ', 'ｶ'] })).map((c) => c.id)).toEqual([1, 2]);
  });

  it('キーワード・条件が空なら全件を元の順序で返す', () => {
    expect(searchCircles(data, cond()).map((c) => c.id)).toEqual([1, 2, 3, 4]);
  });

  it('条件は AND で結合される（キーワード + 参加日 + ジャンル）', () => {
    const c = cond({ keywords: 'アニメ', fuzzy: true, days: [1], genres: [14] });
    expect(searchCircles(data, c)).toHaveLength(0);
  });
});
