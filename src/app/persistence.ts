import type {
  AppSettings,
  Bookmark,
  CheckColorSettings,
  GoogleSearchSettings,
  ImagePathSettings,
  ListColumnKey,
  ListDisplaySettings,
  PageSetup,
} from '../domain/app-settings';
import { DEFAULT_LIST_DISPLAY_SETTINGS, DEFAULT_PAGE_SETUP, LIST_COLUMN_LABELS } from '../domain/app-settings';
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
 * 保存されている「リスト表示」の設定を今の形に寄せる (実物のダイアログ 210 に無い
 * 列が保存されていても落とす)。
 */
function normalizeListDisplay(saved: ListDisplaySettings | undefined): ListDisplaySettings {
  if (saved === undefined) return { ...DEFAULT_LIST_DISPLAY_SETTINGS };
  const known = (keys: readonly ListColumnKey[] | undefined) =>
    (keys ?? []).filter((key) => key in LIST_COLUMN_LABELS);
  return {
    checklist: known(saved.checklist),
    list: known(saved.list),
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
