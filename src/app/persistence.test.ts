import { beforeEach, describe, expect, it } from 'vitest';
import { loadPersistedState, savePersistedState } from './persistence';

/** 保存キー (実装側の STORAGE_KEY と同じ)。 */
const KEY = 'ccatalog-web-port.state';

describe('loadPersistedState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('古い形の Google 検索設定 (項目をチェックボックスで持っていた fields) を項目1 / 項目2 に寄せる', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        googleSearch: {
          mode: 'custom',
          andMode: false,
          fields: { circleName: true, penName: true, bookName: false, circleKana: false },
        },
      }),
    );

    expect(loadPersistedState()?.googleSearch).toEqual({
      mode: 'custom',
      field1: 'circleName',
      field2: 'penName',
      andMode: false,
    });
  });

  it('新しい形の Google 検索設定はそのまま読む', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        googleSearch: { mode: 'either', field1: 'bookName', field2: 'circleKana', andMode: true },
      }),
    );

    expect(loadPersistedState()?.googleSearch).toEqual({
      mode: 'either',
      field1: 'bookName',
      field2: 'circleKana',
      andMode: true,
    });
  });

  it('Google 検索設定が無ければ既定にする', () => {
    localStorage.setItem(KEY, JSON.stringify({}));

    expect(loadPersistedState()?.googleSearch).toEqual({
      mode: 'both',
      field1: 'circleName',
      field2: 'penName',
      andMode: true,
    });
  });

  it('チェックリストの列が旧既定のままなら新しい既定に置き換える', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        listDisplay: {
          checklist: ['day', 'space', 'genre', 'cut', 'name', 'kana', 'pen', 'book'],
          list: ['day', 'space'],
        },
      }),
    );

    const saved = loadPersistedState()?.listDisplay;
    // 旧既定は実物の見出し (スペース / カット / サークル名 / …) に置き換わる。
    expect(saved?.checklist).toEqual([
      'space',
      'cut',
      'name',
      'book',
      'description',
      'memo',
      'updateInfo',
      'updateStatus',
    ]);
    // サークル一覧の設定は触らない。
    expect(saved?.list).toEqual(['day', 'space']);
  });

  it('自分で並べ替えたチェックリストの列はそのまま残す', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        listDisplay: { checklist: ['name', 'space', 'cut'], list: ['day'] },
      }),
    );

    expect(loadPersistedState()?.listDisplay?.checklist).toEqual(['name', 'space', 'cut']);
  });
});

describe('savePersistedState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('保存した内容をそのまま読み戻せる', () => {
    savePersistedState({
      checklist: [],
      memos: {},
      settings: undefined as never,
      imagePath: undefined as never,
      listDisplay: undefined as never,
      checkColors: undefined as never,
      googleSearch: { mode: 'custom', field1: 'bookName', field2: 'penName', andMode: false },
      pageSetup: undefined as never,
      bookmarks: [],
    });

    expect(loadPersistedState()?.googleSearch).toEqual({
      mode: 'custom',
      field1: 'bookName',
      field2: 'penName',
      andMode: false,
    });
  });
});
