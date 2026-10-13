import { useEffect, useReducer } from 'react';
import { DUMMY_CATALOG, type CatalogSource } from '../data/catalog-source';
import { catalogReducer, initialCatalogState } from './catalog-state';

/**
 * カタログを読み込んで検索状態 (catalogReducer) を返す。
 * 読み込み中の状態は state.catalog === null / status === '読み込み中...' で判定できる。
 */
export function useCatalog(source: CatalogSource = DUMMY_CATALOG) {
  const [state, dispatch] = useReducer(catalogReducer, initialCatalogState);

  useEffect(() => {
    let cancelled = false;
    source
      .load()
      .then((catalog) => {
        if (!cancelled) dispatch({ type: 'catalog/loaded', catalog });
      })
      .catch((error: unknown) => {
        if (!cancelled) console.error(error);
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return { state, dispatch } as const;
}
