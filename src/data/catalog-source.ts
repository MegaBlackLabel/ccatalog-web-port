import dummy from './fixtures/dummy-catalog.json';
import type { CatalogData } from '../domain/types';

/**
 * カタログデータの取得口。今は同梱サンプルと JSON 取得だけだが、
 * 将来 DuckDB-WASM や公式 Web カタログ API に差し替えるのはこの型の実装を足すだけで済む。
 */
export type CatalogSource = {
  readonly label: string;
  load(): Promise<CatalogData>;
};

/**
 * 同梱のダミーカタログ。構造 (info / dates / areas / blocks / genres / maps と机の座標) は
 * 実物の ccatalog96.db を復号した値をそのまま使い、サークル名などの個人データだけがダミー。
 * 生成: mise exec -- python tools/gen-dummy-data.py (カット/マップのダミー画像も同時に生成)
 */
const DUMMY = dummy as CatalogData;

export const DUMMY_CATALOG: CatalogSource = {
  label: `ダミーデータ (${DUMMY.info.comiketName} 相当 / ${DUMMY.circles.length} 件)`,
  load: () => Promise.resolve(DUMMY),
};

/** 事前生成した JSON を取得する。 */
export function createJsonCatalogSource(url: string, label = url): CatalogSource {
  return {
    label,
    load: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`カタログデータを取得できません: ${response.status} ${url}`);
      }
      return (await response.json()) as CatalogData;
    },
  };
}
