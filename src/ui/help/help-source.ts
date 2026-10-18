import { parseIndex, parseToc, type HelpData, type HelpTopicText } from './help-data';

/**
 * ヘルプ (元実装の CHM) のデータを公開資産から読む。
 *
 * 目次 (ccatalog.hhc) とキーワード (ccatalog.hhk) は HTML Help の Sitemap 形式のまま配信し、
 * 検索の索引は tools/gen-help-assets.py が作った search-index.json を使う。
 * トピックの HTML と画像は iframe が直接読むので、ここでは読まない。
 */
export async function loadHelpData(base = '/help/'): Promise<HelpData> {
  const [toc, index, topics] = await Promise.all([
    readText(`${base}ccatalog.hhc`),
    readText(`${base}ccatalog.hhk`),
    readJson<HelpTopicText[]>(`${base}search-index.json`),
  ]);
  return { toc: parseToc(toc), index: parseIndex(index), topics };
}

async function readText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ヘルプのデータを取得できません: ${response.status} ${url}`);
  return response.text();
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`ヘルプのデータを取得できません: ${response.status} ${url}`);
  return (await response.json()) as T;
}
