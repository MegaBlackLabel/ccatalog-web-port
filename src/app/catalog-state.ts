import { DEFAULT_SEARCH_CONDITION, searchCircles, type SearchCondition } from '../domain/search';
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_CHECK_COLOR_SETTINGS,
  DEFAULT_GOOGLE_SEARCH_SETTINGS,
  DEFAULT_IMAGE_PATH_SETTINGS,
  DEFAULT_LIST_DISPLAY_SETTINGS,
  DEFAULT_PAGE_SETUP,
  type AppSettings,
  type Bookmark,
  type CheckColorSettings,
  type GoogleSearchSettings,
  type ImagePathSettings,
  type ListDisplaySettings,
  type PageSetup,
} from '../domain/app-settings';
import type { CatalogData, Circle } from '../domain/types';
import type { PersistedState } from './persistence';

/** チェック色。1〜9 が元実装の「色1〜色9」、0 は標準色。 */
export type CheckColor = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** チェックリストの 1 行。登録順がそのまま印刷順になる。 */
export type ChecklistEntry = { circleId: number; color: CheckColor };

/** チェックリストウィンドウの並べ替えに使う列。 */
export type ChecklistSortColumn = 'space' | 'name' | 'kana' | 'pen' | 'day';

/**
 * アプリ全体の状態。元実装の「検索 / 絞込み検索 / 絞込み検索のやり直し / 検索条件の初期化」
 * (CHM 3SEARCH/1SEARCH.HTM, 2CONTSRC.HTM) と同じ遷移を持つ。
 */
export type CatalogState = {
  catalog: CatalogData | null;
  /** 現在の検索条件。 */
  condition: SearchCondition;
  /** 直前の検索結果。null は未検索。 */
  results: Circle[] | null;
  /** 絞込み前の結果（やり直し用）。 */
  narrowedFrom: Circle[] | null;
  selectedId: number | null;
  lastHitCount: number;
  /** ステータスバーに出す文言。 */
  status: string;
  /** チェックリスト (お気に入り) の登録内容。登録順が印刷順。 */
  checklist: ChecklistEntry[];
  /** サークルメモ。元実装では DB ではなくアプリ側に保存される (getMemo)。 */
  memos: Record<number, string>;
  /** 動作オプション (ダイアログ 150)。 */
  settings: AppSettings;
  /** 画像データパス (動作設定の「画像データパス」ページ)。 */
  imagePath: ImagePathSettings;
  /** リスト表示 (動作設定の「リスト表示」ページ)。 */
  listDisplay: ListDisplaySettings;
  /** 色の設定 (動作設定の「色の設定」ページ)。 */
  checkColors: CheckColorSettings;
  /** Google 検索の条件設定 (ダイアログ 212)。 */
  googleSearch: GoogleSearchSettings;
  /** 用紙サイズ・余白 (ダイアログ 203)。 */
  pageSetup: PageSetup;
  /** ブックマーク (しおり)。 */
  bookmarks: Bookmark[];
};

export type CatalogAction =
  | { type: 'catalog/loaded'; catalog: CatalogData }
  | { type: 'search/conditionChanged'; patch: Partial<SearchCondition> }
  | { type: 'search/reset' }
  | { type: 'search/run' }
  | { type: 'search/narrow' }
  | { type: 'search/undoNarrow' }
  | { type: 'circle/select'; id: number | null }
  | { type: 'checklist/toggle'; id: number; color: CheckColor }
  | { type: 'checklist/remove'; ids: number[] }
  /** チェックリストを丸ごと入れ替える (新規作成 / 読み込み)。 */
  | { type: 'checklist/replace'; entries: ChecklistEntry[] }
  /** 指定したサークルのチェック色を変える (未登録ならその色で追加する)。 */
  | { type: 'checklist/setColor'; ids: number[]; color: CheckColor }
  | { type: 'checklist/orderBy'; column: ChecklistSortColumn }
  | { type: 'memo/set'; id: number; memo: string }
  /** すべてのメモを消す (チェックリスト > 全てのメモを消去する)。 */
  | { type: 'memo/clear' }
  /** チェックしていないサークルのメモを消す (残す ID を渡す)。 */
  | { type: 'memo/clearUnchecked'; keepIds: number[] }
  | { type: 'settings/set'; patch: Partial<AppSettings> }
  | { type: 'settings/reset' }
  | { type: 'imagePath/set'; patch: Partial<ImagePathSettings> }
  | { type: 'listDisplay/set'; patch: Partial<ListDisplaySettings> }
  | { type: 'checkColors/set'; patch: Partial<CheckColorSettings> }
  | { type: 'googleSearch/set'; patch: Partial<GoogleSearchSettings> }
  | { type: 'pageSetup/set'; patch: Partial<PageSetup> }
  | { type: 'bookmarks/add'; name: string; pageNo: number; group?: string }
  | { type: 'bookmarks/remove'; ids: number[] }
  | { type: 'bookmarks/rename'; id: number; name: string }
  | { type: 'bookmarks/setGroup'; ids: number[]; group: string }
  /** 保存しておいた状態 (localStorage) を起動時に取り込む。 */
  | { type: 'state/restore'; patch: Partial<PersistedState> };

export const initialCatalogState: CatalogState = {
  catalog: null,
  condition: DEFAULT_SEARCH_CONDITION,
  results: null,
  narrowedFrom: null,
  selectedId: null,
  lastHitCount: 0,
  status: '読み込み中...',
  checklist: [],
  memos: {},
  settings: DEFAULT_APP_SETTINGS,
  imagePath: DEFAULT_IMAGE_PATH_SETTINGS,
  listDisplay: DEFAULT_LIST_DISPLAY_SETTINGS,
  checkColors: DEFAULT_CHECK_COLOR_SETTINGS,
  googleSearch: DEFAULT_GOOGLE_SEARCH_SETTINGS,
  pageSetup: DEFAULT_PAGE_SETUP,
  bookmarks: [],
};

function hitStatus(count: number): string {
  return `該当 ${count} 件`;
}

/**
 * メモは元実装と同じくアプリ側に保存される (SQL 関数 getMemo 相当) ので、
 * 検索する直前に DB 由来のサークルへ合成する。
 */
function withMemos(circles: Circle[], memos: Record<number, string>): Circle[] {
  if (Object.keys(memos).length === 0) return circles;
  return circles.map((circle) => {
    const memo = memos[circle.id];
    return memo === undefined ? circle : { ...circle, memo };
  });
}

export function catalogReducer(state: CatalogState, action: CatalogAction): CatalogState {
  switch (action.type) {
    case 'catalog/loaded':
      return { ...state, catalog: action.catalog, status: '準備完了' };

    case 'search/conditionChanged':
      return { ...state, condition: { ...state.condition, ...action.patch } };

    case 'search/reset':
      return { ...state, condition: DEFAULT_SEARCH_CONDITION };

    case 'search/run': {
      const results = state.catalog
        ? searchCircles(
            { ...state.catalog, circles: withMemos(state.catalog.circles, state.memos) },
            state.condition,
          )
        : [];
      return {
        ...state,
        results,
        narrowedFrom: null,
        lastHitCount: results.length,
        status: hitStatus(results.length),
      };
    }

    case 'search/narrow': {
      // 元実装は前回結果に対して `id in (...)` を付けて再検索する。
      // 検索前（結果なし）は絞込みボタンが無効。
      if (!state.results || !state.catalog) return state;
      const allowed = new Set(state.results.map((circle) => circle.id));
      const results = searchCircles(
        { ...state.catalog, circles: withMemos(state.catalog.circles, state.memos) },
        state.condition,
      ).filter((circle) => allowed.has(circle.id));
      return {
        ...state,
        results,
        narrowedFrom: state.results,
        lastHitCount: results.length,
        status: hitStatus(results.length),
      };
    }

    case 'search/undoNarrow': {
      if (!state.narrowedFrom) return state;
      return {
        ...state,
        results: state.narrowedFrom,
        narrowedFrom: null,
        lastHitCount: state.narrowedFrom.length,
        status: hitStatus(state.narrowedFrom.length),
      };
    }

    case 'circle/select':
      return { ...state, selectedId: action.id };

    case 'checklist/toggle': {
      const exists = state.checklist.some((entry) => entry.circleId === action.id);
      const checklist = exists
        ? state.checklist.filter((entry) => entry.circleId !== action.id)
        : [...state.checklist, { circleId: action.id, color: action.color }];
      return { ...state, checklist };
    }

    case 'checklist/remove': {
      const remove = new Set(action.ids);
      return { ...state, checklist: state.checklist.filter((entry) => !remove.has(entry.circleId)) };
    }

    case 'checklist/replace':
      return { ...state, checklist: action.entries };

    // 登録済みは色を変え、未登録はその色で追加する (サークル詳細の色ボタンは
    // 「その色でチェックする」なので、まだチェックしていないサークルにも効く必要がある)。
    case 'checklist/setColor': {
      const target = new Set(action.ids);
      const registered = new Set(state.checklist.map((entry) => entry.circleId));
      const added = action.ids.filter((id) => !registered.has(id));
      return {
        ...state,
        checklist: [
          ...state.checklist.map((entry) =>
            target.has(entry.circleId) ? { ...entry, color: action.color } : entry,
          ),
          ...added.map((id) => ({ circleId: id, color: action.color })),
        ],
      };
    }

    case 'checklist/orderBy': {
      const circles = new Map((state.catalog?.circles ?? []).map((circle) => [circle.id, circle]));
      const key = (entry: ChecklistEntry): string | number => {
        const circle = circles.get(entry.circleId);
        if (!circle) return '';
        if (action.column === 'space') return circle.spaceNo * 2 + circle.spaceNoSub;
        if (action.column === 'day') return circle.day;
        if (action.column === 'name') return circle.circleName;
        if (action.column === 'kana') return circle.circleKana;
        return circle.penName;
      };
      const checklist = [...state.checklist].sort((a, b) => {
        const left = key(a);
        const right = key(b);
        if (left === right) return a.circleId - b.circleId;
        return left < right ? -1 : 1;
      });
      return { ...state, checklist };
    }

    case 'memo/set':
      return { ...state, memos: { ...state.memos, [action.id]: action.memo } };

    case 'memo/clear':
      return { ...state, memos: {} };

    case 'memo/clearUnchecked': {
      const keep = new Set(action.keepIds);
      const memos: Record<number, string> = {};
      for (const [id, memo] of Object.entries(state.memos)) {
        if (keep.has(Number(id))) memos[Number(id)] = memo;
      }
      return { ...state, memos };
    }

    case 'settings/set':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'settings/reset':
      return { ...state, settings: DEFAULT_APP_SETTINGS };

    case 'imagePath/set':
      return { ...state, imagePath: { ...state.imagePath, ...action.patch } };

    case 'listDisplay/set':
      return { ...state, listDisplay: { ...state.listDisplay, ...action.patch } };

    case 'checkColors/set':
      return { ...state, checkColors: { ...state.checkColors, ...action.patch } };

    case 'googleSearch/set':
      return { ...state, googleSearch: { ...state.googleSearch, ...action.patch } };

    case 'pageSetup/set':
      return { ...state, pageSetup: { ...state.pageSetup, ...action.patch } };

    case 'bookmarks/add':
      return {
        ...state,
        bookmarks: [
          ...state.bookmarks,
          {
            id: state.bookmarks.reduce((max, bookmark) => Math.max(max, bookmark.id), 0) + 1,
            name: action.name,
            pageNo: action.pageNo,
            group: action.group ?? '',
          },
        ],
      };

    case 'bookmarks/remove': {
      const remove = new Set(action.ids);
      return { ...state, bookmarks: state.bookmarks.filter((bookmark) => !remove.has(bookmark.id)) };
    }

    case 'bookmarks/rename':
      return {
        ...state,
        bookmarks: state.bookmarks.map((bookmark) =>
          bookmark.id === action.id ? { ...bookmark, name: action.name } : bookmark,
        ),
      };

    case 'bookmarks/setGroup': {
      const target = new Set(action.ids);
      return {
        ...state,
        bookmarks: state.bookmarks.map((bookmark) =>
          target.has(bookmark.id) ? { ...bookmark, group: action.group } : bookmark,
        ),
      };
    }

    // 起動時に localStorage から取り込む (元実装の INI / チェックリストファイル相当)。
    case 'state/restore':
      return { ...state, ...action.patch };

    default:
      return state;
  }
}
