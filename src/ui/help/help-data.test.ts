import { describe, expect, it } from 'vitest';
import {
  findTopics,
  parseIndex,
  parseToc,
  topicSnippet,
  topicUrl,
  type HelpTopicText,
} from './help-data';

/** ccatalog.hhc と同じ Sitemap 形式 (入れ子の UL は LI の中に入る)。 */
const HHC = `<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML//EN">
<HTML><HEAD><meta name="GENERATOR" content="Microsoft&reg; HTML Help Workshop 4.1"></HEAD><BODY>
<OBJECT type="text/site properties">
	<param name="ImageType" value="Folder">
</OBJECT>
<UL>
	<LI> <OBJECT type="text/sitemap">
		<param name="Name" value="はじめに">
		<param name="Local" value="0BASE/1OVERVIE.HTM">
		</OBJECT>
	<LI> <OBJECT type="text/sitemap">
		<param name="Name" value="ウィンドウ">
		<param name="Local" value="1WINDOW/1WINDOW.HTM">
		</OBJECT>
	<UL>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="サークルカット">
			<param name="Local" value="1WINDOW/2CIRCLE.HTM">
			</OBJECT>
		<LI> <OBJECT type="text/sitemap">
			<param name="Name" value="メニュー">
			<param name="Local" value="1WINDOW/7MENU.HTM">
			</OBJECT>
	</UL>
	<LI> <OBJECT type="text/sitemap">
		<param name="Name" value="印刷">
		<param name="Local" value="4PRINT/1PRINT.HTM">
		</OBJECT>
</UL>
</BODY></HTML>`;

/** ccatalog.hhk と同じ。Name が 2 つある項目は 2 つ目が親キーワード。 */
const HHK = `<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML//EN">
<HTML><HEAD></HEAD><BODY>
<UL>
	<LI> <OBJECT type="text/sitemap">
		<param name="Name" value="BMPファイル出力">
		<param name="Name" value="印刷">
		<param name="Local" value="4PRINT/1PRINT.HTM#part2">
		</OBJECT>
	<LI> <OBJECT type="text/sitemap">
		<param name="Name" value="アンインストール">
		<param name="Name" value="アンインストール">
		<param name="Local" value="0BASE/3UNINSTA.HTM">
		</OBJECT>
	<LI> <OBJECT type="text/sitemap">
		<param name="Name" value="印刷">
		<param name="Name" value="印刷">
		<param name="Local" value="4PRINT/1PRINT.HTM">
		</OBJECT>
</UL>
</BODY></HTML>`;

const TOPICS: HelpTopicText[] = [
  {
    path: '0BASE/1OVERVIE.HTM',
    title: 'はじめに',
    headings: ['はじめに', '動作環境'],
    text: 'このアプリケーションは Windows 環境で動作するコミックマーケット DVD-ROM のカタログブラウザです。',
  },
  {
    path: '4PRINT/1PRINT.HTM',
    title: '印刷',
    headings: ['印刷', '印刷ダイアログ'],
    text:
      'チェックリストに登録したサークルの情報を印刷します。印刷の実行は、メインメニューの' +
      '「ファイル」→「印刷」から行います。実行できる印刷形式は、大きく分けてサークルリスト印刷 / ' +
      'サークルカット印刷 / マップ印刷 / 白地図印刷の 4 つです。プリンタと印刷形式を選びます。',
  },
];

describe('parseToc (ccatalog.hhc の目次)', () => {
  it('入れ子の UL を木にして、名前とリンク先を順に返す', () => {
    const toc = parseToc(HHC);

    expect(toc.map((entry) => entry.name)).toEqual(['はじめに', 'ウィンドウ', '印刷']);
    expect(toc[1].local).toBe('1WINDOW/1WINDOW.HTM');
    // 入れ子 (UL は直前の LI の中に入る)。
    expect(toc[1].children.map((entry) => [entry.name, entry.local])).toEqual([
      ['サークルカット', '1WINDOW/2CIRCLE.HTM'],
      ['メニュー', '1WINDOW/7MENU.HTM'],
    ]);
    // 入れ子を持たない項目の children は空。
    expect(toc[0].children).toEqual([]);
  });
});

describe('parseIndex (ccatalog.hhk のキーワード)', () => {
  it('名前・親キーワード・リンク先 (アンカー付き) を順に返す', () => {
    expect(parseIndex(HHK)).toEqual([
      { name: 'BMPファイル出力', group: '印刷', local: '4PRINT/1PRINT.HTM#part2' },
      { name: 'アンインストール', group: 'アンインストール', local: '0BASE/3UNINSTA.HTM' },
      { name: '印刷', group: '印刷', local: '4PRINT/1PRINT.HTM' },
    ]);
  });
});

describe('findTopics (検索)', () => {
  it('語を含むトピックを索引の順に返す', () => {
    expect(findTopics(TOPICS, '印刷').map((topic) => topic.path)).toEqual(['4PRINT/1PRINT.HTM']);
  });

  it('見出しも本文も見る (大文字小文字は区別しない)', () => {
    expect(findTopics(TOPICS, 'windows').map((topic) => topic.path)).toEqual(['0BASE/1OVERVIE.HTM']);
    expect(findTopics(TOPICS, '動作環境').map((topic) => topic.path)).toEqual(['0BASE/1OVERVIE.HTM']);
  });

  it('空白で区切った語はすべて含むものを返す (AND 検索)', () => {
    expect(findTopics(TOPICS, '印刷 プリンタ').map((topic) => topic.path)).toEqual([
      '4PRINT/1PRINT.HTM',
    ]);
    expect(findTopics(TOPICS, '印刷 存在しない語')).toEqual([]);
  });

  it('空のクエリでは何も返さない', () => {
    expect(findTopics(TOPICS, '   ')).toEqual([]);
  });
});

describe('topicSnippet', () => {
  it('一致した語の前後を切り出して、省略記号を付ける', () => {
    const snippet = topicSnippet(TOPICS[1], 'プリンタ');

    expect(snippet).toContain('プリンタ');
    expect(snippet).toContain('…');
    expect(snippet.length).toBeLessThan(TOPICS[1].text.length);
  });
});

describe('topicUrl', () => {
  it('公開資産の下の URL にする (アンカーはそのまま残す)', () => {
    expect(topicUrl('4PRINT/1PRINT.HTM#part2')).toBe('/help/4PRINT/1PRINT.HTM#part2');
    expect(topicUrl('0BASE/1OVERVIE.HTM')).toBe('/help/0BASE/1OVERVIE.HTM');
  });
});
