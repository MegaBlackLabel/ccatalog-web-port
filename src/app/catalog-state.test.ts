import { describe, expect, it } from 'vitest';
import { catalogReducer, initialCatalogState, type CatalogState } from './catalog-state';
import type { CatalogData, Circle, Genre } from '../domain/types';
import { DEFAULT_SEARCH_CONDITION } from '../domain/search';
import { DEFAULT_APP_SETTINGS, DEFAULT_GOOGLE_SEARCH_SETTINGS, DEFAULT_PAGE_SETUP } from '../domain/app-settings';

const genres: Genre[] = [
  { id: 14, name: '創作(少女)', code: 112 },
  { id: 21, name: '評論', code: 201 },
];

function circle(id: number, patch: Partial<Circle> = {}): Circle {
  return {
    id,
    comiketNo: 96,
    pageNo: id,
    cutIndex: 1,
    day: 1,
    blockId: 1,
    spaceNo: id,
    spaceNoSub: 0,
    genreId: 14,
    circleName: `サークル${id}`,
    circleKana: `ｻｰｸﾙ${id}`,
    penName: `作者${id}`,
    bookName: `本${id}`,
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

const catalog: CatalogData = {
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
  genres,
  dates: [],
  areas: [],
  blocks: [],
  layouts: [],
  maps: [],
  circles: [
    circle(1, { circleName: 'SMYSLE', circleKana: 'ｽﾐｽﾚ', description: 'サロメ中心' }),
    circle(2, { circleName: 'カバン無双', circleKana: 'ｶﾊﾞﾝﾑｿｳ', day: 2 }),
    circle(3, { circleName: '天晴館', circleKana: 'ﾃﾝｾｲｶﾝ', genreId: 21, day: 0, spaceNo: 0 }),
  ],
};

const loaded = catalogReducer(initialCatalogState, { type: 'catalog/loaded', catalog });

describe('catalogReducer — 検索 / 絞込み / やり直し の状態遷移', () => {
  it('初期状態は未検索で、条件は元実装の既定値', () => {
    expect(initialCatalogState.results).toBeNull();
    expect(initialCatalogState.condition).toEqual(DEFAULT_SEARCH_CONDITION);
    expect(initialCatalogState.condition.fields).toBe(0xffff);
    expect(initialCatalogState.condition.andMode).toBe(true);
    expect(initialCatalogState.condition.fuzzy).toBe(true);
  });

  it('条件変更では検索を実行しない（検索ボタンを押すまで結果は変わらない）', () => {
    const next = catalogReducer(loaded, {
      type: 'search/conditionChanged',
      patch: { keywords: 'アニメ' },
    });
    expect(next.condition.keywords).toBe('アニメ');
    expect(next.results).toBeNull();
  });

  it('検索を実行すると件数と結果が入る', () => {
    const next = catalogReducer(
      catalogReducer(loaded, { type: 'search/conditionChanged', patch: { keywords: 'サロメ' } }),
      { type: 'search/run' },
    );
    expect(next.results?.map((c) => c.id)).toEqual([1]);
    expect(next.lastHitCount).toBe(1);
    expect(next.narrowedFrom).toBeNull();
  });

  it('絞込み検索は直前の結果の中だけを対象にする', () => {
    const first = catalogReducer(
      catalogReducer(loaded, { type: 'search/conditionChanged', patch: { keywords: '作者' } }),
      { type: 'search/run' },
    );
    expect(first.results?.map((c) => c.id)).toEqual([1, 2, 3]);

    const narrowed = catalogReducer(
      catalogReducer(first, { type: 'search/conditionChanged', patch: { keywords: 'ｶﾊﾞﾝ' } }),
      { type: 'search/narrow' },
    );
    expect(narrowed.results?.map((c) => c.id)).toEqual([2]);
    expect(narrowed.narrowedFrom?.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it('検索前は絞込みできない（元実装では絞込みボタンが無効）', () => {
    const next = catalogReducer(loaded, { type: 'search/narrow' });
    expect(next.results).toBeNull();
    expect(next.narrowedFrom).toBeNull();
  });

  it('やり直しは絞込み前の結果に戻す', () => {
    const afterSearch = catalogReducer(
      catalogReducer(loaded, { type: 'search/conditionChanged', patch: { keywords: '作者' } }),
      { type: 'search/run' },
    );
    const narrowed = catalogReducer(
      catalogReducer(afterSearch, { type: 'search/conditionChanged', patch: { keywords: 'ｶﾊﾞﾝ' } }),
      { type: 'search/narrow' },
    );
    const undone = catalogReducer(narrowed, { type: 'search/undoNarrow' });
    expect(undone.results?.map((c) => c.id)).toEqual([1, 2, 3]);
    expect(undone.narrowedFrom).toBeNull();
  });

  it('やり直しは絞込みを行った後だけ効く', () => {
    const next = catalogReducer(loaded, { type: 'search/undoNarrow' });
    expect(next.results).toBeNull();
  });

  it('条件の初期化は既定値に戻し、結果は保持する', () => {
    const searched = catalogReducer(
      catalogReducer(loaded, { type: 'search/conditionChanged', patch: { keywords: 'ｶﾊﾞﾝ', days: [2] } }),
      { type: 'search/run' },
    );
    const reset = catalogReducer(searched, { type: 'search/reset' });
    expect(reset.condition).toEqual(DEFAULT_SEARCH_CONDITION);
    expect(reset.results?.map((c) => c.id)).toEqual([2]);
  });

  it('選択中のサークルは id で保持する', () => {
    const next = catalogReducer(loaded, { type: 'circle/select', id: 2 });
    expect(next.selectedId).toBe(2);
    expect(catalogReducer(next, { type: 'circle/select', id: null }).selectedId).toBeNull();
  });

  it('ステータス文言は元実装と同じ「該当 N 件」を出す', () => {
    const searched = catalogReducer(loaded, { type: 'search/run' });
    expect(searched.status).toBe('該当 3 件');
    const none = catalogReducer(
      catalogReducer(loaded, { type: 'search/conditionChanged', patch: { keywords: '存在しない' } }),
      { type: 'search/run' },
    );
    expect(none.status).toBe('該当 0 件');
  });

  it('データ未読込でも検索は落ちず 0 件になる', () => {
    const next = catalogReducer(initialCatalogState, { type: 'search/run' });
    expect(next.results).toEqual([]);
    expect(next.status).toBe('該当 0 件');
  });
});

describe('catalogReducer — チェックリスト (お気に入り)', () => {
  it('標準色でチェックすると登録順に並ぶ', () => {
    const a = catalogReducer(loaded, { type: 'checklist/toggle', id: 2, color: 0 });
    const b = catalogReducer(a, { type: 'checklist/toggle', id: 1, color: 0 });
    expect(b.checklist).toEqual([
      { circleId: 2, color: 0 },
      { circleId: 1, color: 0 },
    ]);
  });

  it('同じサークルをもう一度チェックすると外れる', () => {
    const on = catalogReducer(loaded, { type: 'checklist/toggle', id: 1, color: 0 });
    const off = catalogReducer(on, { type: 'checklist/toggle', id: 1, color: 0 });
    expect(off.checklist).toEqual([]);
  });

  it('色を指定して登録でき、あとから色を変更できる', () => {
    const on = catalogReducer(loaded, { type: 'checklist/toggle', id: 1, color: 3 });
    expect(on.checklist[0].color).toBe(3);
    const recolored = catalogReducer(on, { type: 'checklist/setColor', ids: [1], color: 7 });
    expect(recolored.checklist[0].color).toBe(7);
  });

  it('未登録のサークルは指定した色で追加する (サークル詳細の色ボタン)', () => {
    const one = catalogReducer(loaded, { type: 'checklist/setColor', ids: [3], color: 5 });
    expect(one.checklist).toEqual([{ circleId: 3, color: 5 }]);
    // 登録済みの並びは変えず、色だけ変える。
    const two = catalogReducer(one, { type: 'checklist/setColor', ids: [3], color: 9 });
    expect(two.checklist).toEqual([{ circleId: 3, color: 9 }]);
  });

  it('指定したサークルだけ外せる', () => {
    const two = catalogReducer(
      catalogReducer(loaded, { type: 'checklist/toggle', id: 1, color: 0 }),
      { type: 'checklist/toggle', id: 2, color: 0 },
    );
    const one = catalogReducer(two, { type: 'checklist/remove', ids: [1] });
    expect(one.checklist.map((entry) => entry.circleId)).toEqual([2]);
  });

  it('列で並べ替えられる (印刷順の確定)', () => {
    const three = catalogReducer(
      catalogReducer(
        catalogReducer(loaded, { type: 'checklist/toggle', id: 3, color: 0 }),
        { type: 'checklist/toggle', id: 1, color: 0 },
      ),
      { type: 'checklist/toggle', id: 2, color: 0 },
    );
    expect(three.checklist.map((entry) => entry.circleId)).toEqual([3, 1, 2]);
    const bySpace = catalogReducer(three, { type: 'checklist/orderBy', column: 'space' });
    // フィクスチャの spaceNo は 1, 2, 0 (抽選漏れ) なので 0 が先頭に来る
    expect(bySpace.checklist.map((entry) => entry.circleId)).toEqual([3, 1, 2]);
    const byName = catalogReducer(three, { type: 'checklist/orderBy', column: 'name' });
    // 名前は 'SMYSLE' < 'カバン無双' < '天晴館' の順 (コードユニット比較)
    expect(byName.checklist.map((entry) => entry.circleId)).toEqual([1, 2, 3]);
  });
});

describe('catalogReducer — サークルメモ (元実装の getMemo)', () => {
  it('メモはサークル ID ごとに保持される', () => {
    const next = catalogReducer(loaded, { type: 'memo/set', id: 2, memo: '西館 要チェック' });
    expect(next.memos[2]).toBe('西館 要チェック');
  });

  it('付けたメモはメモ欄のキーワード検索に反映される', () => {
    const withMemo = catalogReducer(loaded, { type: 'memo/set', id: 2, memo: '西館 要チェック' });
    const memoOnly = {
      ...withMemo,
      condition: { ...withMemo.condition, keywords: '西館', fuzzy: true, fields: 0x0080 },
    };
    const searched = catalogReducer(memoOnly, { type: 'search/run' });
    expect(searched.results?.map((circle) => circle.id)).toEqual([2]);
  });
});

describe('catalogReducer — 動作設定 (ダイアログ 150 / 212 / 203)', () => {
  it('設定は既定値から始まり、項目ごとに変更できる', () => {
    expect(initialCatalogState.settings).toEqual(DEFAULT_APP_SETTINGS);
    const next = catalogReducer(loaded, {
      type: 'settings/set',
      patch: { singleClickChecks: true, scrollMode: 'ie' },
    });
    expect(next.settings.singleClickChecks).toBe(true);
    expect(next.settings.scrollMode).toBe('ie');
    expect(next.settings.enterMovesCursor).toBe(DEFAULT_APP_SETTINGS.enterMovesCursor);
  });

  it('設定を初期化できる', () => {
    const changed = catalogReducer(loaded, {
      type: 'settings/set',
      patch: { overwriteMemoOnLoad: true },
    });
    expect(catalogReducer(changed, { type: 'settings/reset' }).settings).toEqual(DEFAULT_APP_SETTINGS);
  });

  it('Google 検索設定を変更できる', () => {
    const next = catalogReducer(loaded, {
      type: 'googleSearch/set',
      patch: { mode: 'custom', andMode: false },
    });
    expect(next.googleSearch.mode).toBe('custom');
    expect(next.googleSearch.andMode).toBe(false);
    expect(next.googleSearch.fields).toEqual(DEFAULT_GOOGLE_SEARCH_SETTINGS.fields);
  });

  it('用紙サイズ・余白を変更できる', () => {
    const next = catalogReducer(loaded, { type: 'pageSetup/set', patch: { marginLeft: 20 } });
    expect(next.pageSetup.marginLeft).toBe(20);
    expect(next.pageSetup.paper).toBe(DEFAULT_PAGE_SETUP.paper);
  });
});

describe('catalogReducer — ブックマーク', () => {
  it('ページを追加すると名前とページ番号が入り、ID は連番になる', () => {
    const one = catalogReducer(loaded, { type: 'bookmarks/add', name: '最初のページ', pageNo: 104 });
    const two = catalogReducer(one, { type: 'bookmarks/add', name: '気になるブロック', pageNo: 108 });
    expect(two.bookmarks).toEqual([
      { id: 1, name: '最初のページ', pageNo: 104, group: '' },
      { id: 2, name: '気になるブロック', pageNo: 108, group: '' },
    ]);
  });

  it('名前を変更でき、グループにまとめられる', () => {
    const added = catalogReducer(loaded, { type: 'bookmarks/add', name: 'A', pageNo: 104 });
    const renamed = catalogReducer(added, { type: 'bookmarks/rename', id: 1, name: '東ホール' });
    expect(renamed.bookmarks[0].name).toBe('東ホール');
    const grouped = catalogReducer(renamed, {
      type: 'bookmarks/setGroup',
      ids: [1],
      group: 'お気に入り',
    });
    expect(grouped.bookmarks[0].group).toBe('お気に入り');
  });

  it('複数まとめて削除できる', () => {
    const two = catalogReducer(
      catalogReducer(loaded, { type: 'bookmarks/add', name: 'A', pageNo: 104 }),
      { type: 'bookmarks/add', name: 'B', pageNo: 105 },
    );
    const one = catalogReducer(two, { type: 'bookmarks/remove', ids: [1] });
    expect(one.bookmarks.map((bookmark) => bookmark.id)).toEqual([2]);
  });
});

describe('catalogReducer — 読み込み / 保存で使うアクション', () => {
  it('checklist/replace はチェックリストを丸ごと入れ替える', () => {
    const next = catalogReducer(loaded, {
      type: 'checklist/replace',
      entries: [
        { circleId: 1, color: 2 },
        { circleId: 2, color: 5 },
      ],
    });

    expect(next.checklist).toEqual([
      { circleId: 1, color: 2 },
      { circleId: 2, color: 5 },
    ]);
  });

  it('memo/clear はすべてのメモを消す', () => {
    const withMemos = catalogReducer(
      catalogReducer(loaded, { type: 'memo/set', id: 1, memo: 'A' }),
      { type: 'memo/set', id: 2, memo: 'B' },
    );

    expect(catalogReducer(withMemos, { type: 'memo/clear' }).memos).toEqual({});
  });

  it('memo/clearUnchecked は keepIds のメモだけ残す', () => {
    const withMemos = catalogReducer(
      catalogReducer(
        catalogReducer(loaded, { type: 'memo/set', id: 1, memo: 'A' }),
        { type: 'memo/set', id: 2, memo: 'B' },
      ),
      { type: 'memo/set', id: 3, memo: 'C' },
    );

    const next = catalogReducer(withMemos, { type: 'memo/clearUnchecked', keepIds: [1, 3] });

    // 残す ID 以外 (2) は消える。キーは文字列になるので数値で引き直す。
    expect(next.memos).toEqual({ 1: 'A', 3: 'C' });
    expect(Object.keys(next.memos).map(Number).sort()).toEqual([1, 3]);
  });

  it('imagePath/set / listDisplay/set / checkColors/set は渡した項目だけ差し替える', () => {
    const imagePath = catalogReducer(loaded, {
      type: 'imagePath/set',
      patch: { basePath: 'D:/imgs', useDefaultBrowser: false },
    });
    expect(imagePath.imagePath.basePath).toBe('D:/imgs');
    expect(imagePath.imagePath.useDefaultBrowser).toBe(false);
    expect(imagePath.imagePath).not.toBe(loaded.imagePath);

    const listDisplay = catalogReducer(loaded, {
      type: 'listDisplay/set',
      patch: { list: ['name', 'day'] },
    });
    expect(listDisplay.listDisplay.list).toEqual(['name', 'day']);
    // 渡していない項目は元のまま。
    expect(listDisplay.listDisplay.checklist).toEqual(loaded.listDisplay.checklist);

    const checkColors = catalogReducer(loaded, {
      type: 'checkColors/set',
      patch: { display: ['#000000'] },
    });
    expect(checkColors.checkColors.display).toEqual(['#000000']);
    expect(checkColors.checkColors.print).toEqual(loaded.checkColors.print);
  });

  it('state/restore は保存しておいた項目を戻す', () => {
    const next = catalogReducer(loaded, {
      type: 'state/restore',
      patch: {
        checklist: [{ circleId: 7, color: 3 }],
        memos: { 7: '復元したメモ' },
      },
    });

    expect(next.checklist).toEqual([{ circleId: 7, color: 3 }]);
    expect(next.memos).toEqual({ 7: '復元したメモ' });
    // patch に無いもの (カタログ・検索条件) は触らない。
    expect(next.catalog).toBe(loaded.catalog);
    expect(next.condition).toBe(loaded.condition);
  });
});

describe('catalogReducer — 未知のアクション', () => {
  it('状態をそのまま返す', () => {
    const state: CatalogState = loaded;
    // @ts-expect-error 実行時に来ないアクションは無視する
    expect(catalogReducer(state, { type: 'nothing/here' })).toBe(state);
  });
});
