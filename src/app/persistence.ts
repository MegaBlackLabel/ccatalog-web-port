import type {
  AppSettings,
  Bookmark,
  CheckColorSettings,
  GoogleSearchField,
  GoogleSearchSettings,
  ImagePathSettings,
  ListColumnKey,
  ListDisplaySettings,
  PageSetup,
} from '../domain/app-settings';
import { DEFAULT_GOOGLE_SEARCH_SETTINGS, DEFAULT_LIST_DISPLAY_SETTINGS, DEFAULT_PAGE_SETUP, LIST_COLUMN_LABELS } from '../domain/app-settings';
import type { ChecklistEntry } from './catalog-state';

/**
 * アプリ側に持つ状態の保存 (元実装の cpr.ini / チェックリストファイル相当)。
 *
 * 元実装は INI (設定・ブックマーク) とチェックリストファイルに分けて保存するが、
 * Web 版は localStorage 1 キーにまとめて持つ。実データ (カタログ) は対象外。
 */
export type PersistedState = {
  checklist: ChecklistEntry[];
  memos: Record<number, string>;
  settings: AppSettings;
  imagePath: ImagePathSettings;
  listDisplay: ListDisplaySettings;
  checkColors: CheckColorSettings;
  googleSearch: GoogleSearchSettings;
  pageSetup: PageSetup;
  bookmarks: Bookmark[];
};

/** localStorage のキー。 */
const STORAGE_KEY = 'ccatalog-web-port.state';

/** localStorage が使えるか (プライベートモード等で例外になる環境がある)。 */
function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** 保存された状態を読む。壊れていれば null。 */
export function loadPersistedState(): Partial<PersistedState> | null {
  const store = storage();
  if (store === null) return null;
  const text = store.getItem(STORAGE_KEY);
  if (text === null) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const saved = parsed as Partial<PersistedState>;
    return {
      ...saved,
      pageSetup: normalizePageSetup(saved.pageSetup),
      listDisplay: normalizeListDisplay(saved.listDisplay),
      googleSearch: normalizeGoogleSearch(saved.googleSearch),
    };
  } catch {
    return null;
  }
}

/**
 * 保存されている用紙設定を今の形に寄せる。
 * 古い形 (ダイアログ 203 を Web 版独自の項目で持っていた頃の DPI / オフセット /
 * 左右・上下余白) は、左右・上下の 4 つの余白に振り分けて引き継ぐ。
 */
function normalizePageSetup(saved: Partial<PageSetup> | undefined): PageSetup {
  if (saved === undefined) return { ...DEFAULT_PAGE_SETUP };
  const legacy = saved as Partial<PageSetup> & { marginX?: number; marginY?: number };
  return {
    paper: typeof saved.paper === 'string' ? saved.paper : DEFAULT_PAGE_SETUP.paper,
    paperWidth: saved.paperWidth ?? DEFAULT_PAGE_SETUP.paperWidth,
    paperHeight: saved.paperHeight ?? DEFAULT_PAGE_SETUP.paperHeight,
    marginLeft: saved.marginLeft ?? legacy.marginX ?? DEFAULT_PAGE_SETUP.marginLeft,
    marginRight: saved.marginRight ?? legacy.marginX ?? DEFAULT_PAGE_SETUP.marginRight,
    marginTop: saved.marginTop ?? legacy.marginY ?? DEFAULT_PAGE_SETUP.marginTop,
    marginBottom: saved.marginBottom ?? legacy.marginY ?? DEFAULT_PAGE_SETUP.marginBottom,
    keepAspect:
      typeof saved.keepAspect === 'boolean' ? saved.keepAspect : DEFAULT_PAGE_SETUP.keepAspect,
  };
}

/**
 * 保存されている「リスト表示」の設定を今の形に寄せる。
 * - 実物のダイアログ 210 に無い列が保存されていても落とす。
 * - チェックリストの既定が実物の見出しに変わったので、**旧既定そのまま**が保存されて
 *   いたら新しい既定に置き換える (利用者が自分で並べ替えた設定は触らない)。
 */
function normalizeListDisplay(saved: ListDisplaySettings | undefined): ListDisplaySettings {
  if (saved === undefined) return { ...DEFAULT_LIST_DISPLAY_SETTINGS };
  const known = (keys: readonly ListColumnKey[] | undefined) =>
    (keys ?? []).filter((key) => key in LIST_COLUMN_LABELS);
  const checklist = known(saved.checklist);
  const isLegacyDefault =
    checklist.length === LEGACY_CHECKLIST_DEFAULT.length &&
    checklist.every((key, index) => key === LEGACY_CHECKLIST_DEFAULT[index]);
  const list = known(saved.list);
  const isLegacyListDefault =
    list.length === LEGACY_LIST_DEFAULT.length &&
    list.every((key, index) => key === LEGACY_LIST_DEFAULT[index]);
  return {
    checklist: isLegacyDefault ? [...DEFAULT_LIST_DISPLAY_SETTINGS.checklist] : checklist,
    list: isLegacyListDefault ? [...DEFAULT_LIST_DISPLAY_SETTINGS.list] : list,
  };
}

/** 以前のサークル一覧の既定 (8 列)。実物の 18 列に増えたので移行する。 */
const LEGACY_LIST_DEFAULT: readonly ListColumnKey[] = [
  'day',
  'space',
  'genre',
  'cut',
  'name',
  'kana',
  'pen',
  'book',
];

/** 以前のチェックリストの既定 (参加日 / スペース / ジャンル / カット / サークル名 / …)。 */
const LEGACY_CHECKLIST_DEFAULT: readonly ListColumnKey[] = [
  'day',
  'space',
  'genre',
  'cut',
  'name',
  'kana',
  'pen',
  'book',
];

/** 実物の並び (ダイアログ 212 のコンボ 1693 / 1694)。 */
const GOOGLE_SEARCH_FIELD_KEYS: readonly GoogleSearchField[] = [
  'circleName',
  'circleKana',
  'penName',
  'bookName',
];

/**
 * 古い形 (項目をチェックボックスで持っていた `fields`) で ON だった項目を、
 * 実物の並びで返す。`Object.entries` で読むので形の断定はしない。
 */
function legacyFieldKeys(saved: Partial<GoogleSearchSettings>): GoogleSearchField[] {
  if (!('fields' in saved)) return [];
  const fields: unknown = saved.fields;
  if (typeof fields !== 'object' || fields === null) return [];
  const enabled: Record<string, true> = {};
  for (const [key, on] of Object.entries(fields)) {
    if (on === true) enabled[key] = true;
  }
  return GOOGLE_SEARCH_FIELD_KEYS.filter((key) => enabled[key] === true);
}

/**
 * 保存されている Google 検索設定を今の形に寄せる。
 * 古い形 (項目をチェックボックス 4 つで持っていた `fields`) は、選ばれていた項目を
 * 項目1 / 項目2 のコンボ (1693 / 1694) に引き継ぐ。
 */
function normalizeGoogleSearch(
  saved: Partial<GoogleSearchSettings> | undefined,
): GoogleSearchSettings {
  if (saved === undefined) return { ...DEFAULT_GOOGLE_SEARCH_SETTINGS };
  const isField = (value: unknown): value is GoogleSearchField =>
    GOOGLE_SEARCH_FIELD_KEYS.includes(value as GoogleSearchField);
  const legacyFields = legacyFieldKeys(saved);
  return {
    mode: saved.mode === 'either' || saved.mode === 'custom' ? saved.mode : 'both',
    field1: isField(saved.field1)
      ? saved.field1
      : (legacyFields[0] ?? DEFAULT_GOOGLE_SEARCH_SETTINGS.field1),
    field2: isField(saved.field2)
      ? saved.field2
      : (legacyFields[1] ?? DEFAULT_GOOGLE_SEARCH_SETTINGS.field2),
    andMode: typeof saved.andMode === 'boolean' ? saved.andMode : DEFAULT_GOOGLE_SEARCH_SETTINGS.andMode,
  };
}

/** 状態を保存する。 */
export function savePersistedState(state: PersistedState): void {
  const store = storage();
  if (store === null) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 容量超過など。保存できなくても操作は続けられる。
  }
}
