import type {
  AppSettings,
  Bookmark,
  CheckColorSettings,
  GoogleSearchSettings,
  ImagePathSettings,
  ListDisplaySettings,
  PageSetup,
} from '../domain/app-settings';
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
    return typeof parsed === 'object' && parsed !== null ? (parsed as Partial<PersistedState>) : null;
  } catch {
    return null;
  }
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
