/**
 * ヘルプ (元実装の CHM = ccatalog.chm) のデータ。
 *
 * 公開資産 `public/help/**` の目次 (ccatalog.hhc) / キーワード (ccatalog.hhk) は
 * HTML Help Workshop の Sitemap 形式で、`<OBJECT type="text/sitemap">` の `<param>` に
 * 名前とリンク先が入る。ここではそれを読み取って、ヘルプ ウィンドウが使う形にする
 * (本文の HTML と画像は元のファイルをそのまま配信する)。
 */

/** 目次 (ccatalog.hhc) の 1 項目。 */
export type HelpTocEntry = {
  name: string;
  /** トピックの相対パス (アンカー付きのこともある)。 */
  local: string;
  children: HelpTocEntry[];
};

/** キーワード (索引, ccatalog.hhk) の 1 項目。 */
export type HelpIndexEntry = {
  name: string;
  /** 実機の「親キーワード」(索引の入れ子。単独項目は名前と同じ)。 */
  group: string;
  local: string;
};

/** 検索の索引 1 件 (トピックの HTML から作った見出しと本文テキスト)。 */
export type HelpTopicText = {
  path: string;
  title: string;
  headings: readonly string[];
  text: string;
};

/** ヘルプ ウィンドウが使うデータ一式。 */
export type HelpData = {
  toc: readonly HelpTocEntry[];
  index: readonly HelpIndexEntry[];
  topics: readonly HelpTopicText[];
};

/** `<param name="X" value="Y">` を読む。 */
function paramReader(element: Element): (key: string) => string[] {
  const params = [...element.querySelectorAll('param')];
  return (key) =>
    params
      .filter((param) => (param.getAttribute('name') ?? '').toLowerCase() === key)
      .map((param) => param.getAttribute('value') ?? '');
}

/** ccatalog.hhc (目次) を木にする。入れ子の `<UL>` は直前の `<LI>` の中に入っている。 */
export function parseToc(source: string): HelpTocEntry[] {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  const list = doc.body.querySelector('ul');
  return list === null ? [] : tocEntries(list);
}

function tocEntries(list: Element): HelpTocEntry[] {
  return [...list.children]
    .filter((child) => child.tagName === 'LI')
    .map((li) => {
      const read = paramReader(li);
      const nested = li.querySelector(':scope > ul');
      return {
        name: read('name')[0] ?? '',
        local: read('local')[0] ?? '',
        children: nested === null ? [] : tocEntries(nested),
      };
    });
}

/** ccatalog.hhk (キーワード) を一覧にする。`Name` が 2 つある項目は 2 つ目が親キーワード。 */
export function parseIndex(source: string): HelpIndexEntry[] {
  const doc = new DOMParser().parseFromString(source, 'text/html');
  return [...doc.querySelectorAll('object')]
    .map((object) => {
      const names = paramReader(object)('name');
      return {
        name: names[0] ?? '',
        group: names[1] ?? names[0] ?? '',
        local: paramReader(object)('local')[0] ?? '',
      };
    })
    .filter((entry) => entry.name !== '');
}

/** 検索。空白で区切った語をすべて含む (AND) トピックを索引の順に返す。 */
export function findTopics(
  topics: readonly HelpTopicText[],
  query: string,
): HelpTopicText[] {
  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 0);
  if (terms.length === 0) return [];
  return topics.filter((topic) => {
    const haystack = `${topic.title} ${topic.headings.join(' ')} ${topic.text}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

/** 検索結果に出す抜粋 (最初に一致した語の前後を切り出し、切った端に … を付ける)。 */
export function topicSnippet(
  topic: HelpTopicText,
  query: string,
  before = 30,
  after = 80,
): string {
  const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 0);
  const text = topic.text;
  const haystack = text.toLowerCase();
  const at = terms
    .map((term) => haystack.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (at === undefined) return text.slice(0, before + after);
  const start = Math.max(0, at - before);
  const end = Math.min(text.length, at + after);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

/** トピックの公開 URL (公開資産の基点 + 相対パス。アンカーはそのまま残す)。 */
export function topicUrl(local: string, base = '/help/'): string {
  return `${base}${local}`;
}
