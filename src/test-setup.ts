import '@testing-library/jest-dom/vitest';

/** localStorage として使える形かどうか (中身の無いオブジェクトを弾く)。 */
function hasStorageApi(value: unknown): value is Storage {
  if (typeof value !== 'object' || value === null) return false;
  if (!('getItem' in value) || !('setItem' in value) || !('removeItem' in value)) return false;
  return (
    typeof value.getItem === 'function' &&
    typeof value.setItem === 'function' &&
    typeof value.removeItem === 'function'
  );
}

// この jsdom 環境の localStorage は中身の無いオブジェクトなので、テスト用の簡易 Storage を入れる
// (アプリ側は通常のブラウザの localStorage を使う)。
if (!hasStorageApi(globalThis.localStorage)) {
  const entries = new Map<string, string>();
  const memoryStorage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, String(value));
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    clear: () => {
      entries.clear();
    },
    key: (index: number) => [...entries.keys()][index] ?? null,
    get length() {
      return entries.size;
    },
  };
  for (const target of [globalThis, window]) {
    try {
      Object.defineProperty(target, 'localStorage', {
        value: memoryStorage,
        writable: true,
        configurable: true,
      });
    } catch {
      // 定義できない環境ではそのまま (保存のテストはスキップされる)。
    }
  }
}

// jsdom には無いが react98retro (Window / TableView) が前提にしている API を補う。
if (!('ResizeObserver' in globalThis)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverStub,
    writable: true,
  });
}

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
