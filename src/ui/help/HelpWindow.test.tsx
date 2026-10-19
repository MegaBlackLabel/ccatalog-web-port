import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HelpData } from './help-data';
import { HelpWindow } from './HelpWindow';

afterEach(() => {
  vi.restoreAllMocks();
});

/** 生成した公開資産 (public/help/**) と同じ形のデータ。 */
const DATA: HelpData = {
  toc: [
    { name: 'はじめに', local: '0BASE/1OVERVIE.HTM', children: [] },
    {
      name: 'ウィンドウ',
      local: '1WINDOW/1WINDOW.HTM',
      children: [
        { name: 'サークルカット', local: '1WINDOW/2CIRCLE.HTM', children: [] },
        { name: 'メニュー', local: '1WINDOW/7MENU.HTM', children: [] },
      ],
    },
    { name: '印刷', local: '4PRINT/1PRINT.HTM', children: [] },
  ],
  index: [
    { name: 'BMPファイル出力', group: '印刷', local: '4PRINT/1PRINT.HTM#part2' },
    { name: '印刷', group: '印刷', local: '4PRINT/1PRINT.HTM' },
  ],
  topics: [
    {
      path: '0BASE/1OVERVIE.HTM',
      title: 'はじめに',
      headings: ['はじめに'],
      text: 'このアプリケーションは Windows 環境で動作するコミックマーケット DVD-ROM のカタログブラウザです。',
    },
    {
      path: '1WINDOW/2CIRCLE.HTM',
      title: 'サークルカット ウィンドウ',
      headings: ['サークルカットウィンドウ'],
      text: 'サークルカットウィンドウは、DVD-ROMカタログブラウザのメインウィンドウです。',
    },
    {
      path: '4PRINT/1PRINT.HTM',
      title: '印刷',
      headings: ['印刷', '印刷ダイアログ'],
      text:
        'チェックリストに登録したサークルの情報を印刷します。プリンタと印刷形式を選び、' +
        'GDI+ を使用しないで印刷するかを指定します。',
    },
  ],
};

/** 3 つのタブのラベルを確かめる。 */
async function expectTabs(help: HTMLElement) {
  const tabs = within(help)
    .getAllByRole('tab')
    .map((tab) => tab.textContent);
  expect(tabs).toEqual(['目次(C)', 'キーワード(N)', '検索(S)']);
}

function renderHelp(pane: 'contents' | 'keyword' | 'search' = 'contents') {
  const load = vi.fn(() => Promise.resolve(DATA));
  const user = userEvent.setup({ delay: null });
  const view = render(<HelpWindow pane={pane} load={load} onClose={vi.fn()} />);
  return { user, load, view };
}

/** トピック パネル (元の HTML を出す iframe) の src。 */
function frameSrc(): string {
  return (screen.getByTestId('help-topic-frame') as HTMLIFrameElement).getAttribute('src') ?? '';
}

/** 表示中のタブ。 */
function activeTab(): string {
  return screen.getByRole('tab', { selected: true }).textContent ?? '';
}

describe('HelpWindow (元実装の CHM ヘルプ)', () => {
  it('実機と同じ大きさ (1065x956) とタイトルで、目次 / キーワード / 検索のタブを出す', async () => {
    // ライブラリの Window は画面に収まるよう縮めるので、画面を広くして確かめる。
    const widthDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const heightDesc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1600 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1200 });
    try {
      renderHelp();

      const help = await screen.findByTestId('help-window');
      expect(help).toHaveTextContent('コミケットDVD-ROMカタログブラウザ ヘルプ');
      expect(help).toHaveStyle({ width: '1065px', height: '956px' });
      await expectTabs(help);
    } finally {
      if (widthDesc) Object.defineProperty(window, 'innerWidth', widthDesc);
      if (heightDesc) Object.defineProperty(window, 'innerHeight', heightDesc);
    }
  });

  it('開いたタブ (目次 / 検索 / キーワード) を選んだ状態で出す', async () => {
    renderHelp('search');
    await screen.findByTestId('help-window');

    expect(activeTab()).toBe('検索(S)');
  });

  it('目次はライブラリの TreeView で入れ子を出し、選ぶとトピックを表示する', async () => {
    const { user } = renderHelp();
    const nav = await screen.findByTestId('help-nav');

    // ライブラリの TreeView (ul.tree-view) で出す。入れ子は <details> で畳んである。
    expect(nav.querySelector('ul.tree-view')).not.toBeNull();
    expect(within(nav).getByText('はじめに')).toBeInTheDocument();
    const parent = within(nav).getByText('ウィンドウ');
    expect(parent.closest('details')).not.toBeNull();
    expect(parent.closest('details')?.open).toBe(false);

    // 親の名前を押すと、そのトピックを出しつつ入れ子を開く。
    await user.click(parent);
    expect(frameSrc()).toBe('/help/1WINDOW/1WINDOW.HTM');
    await user.click(within(nav).getByText('メニュー'));

    expect(frameSrc()).toBe('/help/1WINDOW/7MENU.HTM');
  });

  it('ツールバーは実機と同じ 4 つ (非表示 / 戻る / 印刷 / オプション(Q)) をアイコン付きで出す', async () => {
    const { user } = renderHelp();
    const help = await screen.findByTestId('help-window');
    const toolbar = within(help).getByTestId('help-toolbar');

    // 実機のアイコン (hhctrl.ocx のビットマップから切り出したもの) を出す。
    const labels = within(toolbar)
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(labels).toEqual(['非表示', '戻る', '印刷', 'オプション(Q)']);
    for (const button of within(toolbar).getAllByRole('button')) {
      expect(button.querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    }
    // 履歴が無い間は 戻る が使えない (実機の起動直後と同じ)。進む は進む履歴ができてから出る。
    expect(within(toolbar).getByRole('button', { name: '戻る' })).toBeDisabled();
    expect(within(toolbar).queryByRole('button', { name: '進む' })).toBeNull();

    // オプション(Q) はメニューを開く。
    await user.click(within(toolbar).getByRole('button', { name: 'オプション(Q)' }));
    const menu = within(help).getByTestId('help-options-menu');
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'ナビゲーション タブ(N)',
      '同期(L)',
      '印刷(P)...',
    ]);
  });

  it('トピックは元の HTML を iframe で出す (画像とスタイルは元の資産)', async () => {
    renderHelp();
    await screen.findByTestId('help-window');

    // 開いた時点では目次の先頭 (はじめに) を出す。
    expect(frameSrc()).toBe('/help/0BASE/1OVERVIE.HTM');
  });

  it('キーワード (索引) を選ぶと、アンカー付きでトピックを開く', async () => {
    const { user } = renderHelp('keyword');
    const nav = await screen.findByTestId('help-nav');

    expect(activeTab()).toBe('キーワード(N)');
    await user.click(within(nav).getByRole('button', { name: 'BMPファイル出力' }));

    expect(frameSrc()).toBe('/help/4PRINT/1PRINT.HTM#part2');
  });

  it('検索は語を含むトピックと抜粋を出し、選ぶとトピックを開く', async () => {
    const { user } = renderHelp('search');
    const nav = await screen.findByTestId('help-nav');

    await user.type(within(nav).getByLabelText('検索'), 'プリンタ');
    await user.click(within(nav).getByRole('button', { name: '検索(S)' }));

    const hits = within(nav).getAllByTestId('help-hit');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toHaveTextContent('印刷');
    expect(hits[0]).toHaveTextContent('プリンタ');

    await user.click(hits[0]);
    expect(frameSrc()).toBe('/help/4PRINT/1PRINT.HTM');
  });

  it('戻る / 進むで表示したトピックを行き来する', async () => {
    const { user } = renderHelp();
    const help = await screen.findByTestId('help-window');
    const nav = within(help).getByTestId('help-nav');

    // 履歴が無い間は 戻る が使えない。
    expect(within(help).getByRole('button', { name: '戻る' })).toBeDisabled();

    await user.click(within(nav).getByText('印刷'));
    expect(frameSrc()).toBe('/help/4PRINT/1PRINT.HTM');

    await user.click(within(help).getByRole('button', { name: '戻る' }));
    expect(frameSrc()).toBe('/help/0BASE/1OVERVIE.HTM');

    await user.click(within(help).getByRole('button', { name: '進む' }));
    expect(frameSrc()).toBe('/help/4PRINT/1PRINT.HTM');
  });

  it('非表示 / 表示でナビゲーション パネルを畳む', async () => {
    const { user } = renderHelp();
    const help = await screen.findByTestId('help-window');

    await user.click(within(help).getByRole('button', { name: '非表示' }));

    expect(within(help).queryByTestId('help-nav')).toBeNull();
    await user.click(within(help).getByRole('button', { name: '表示' }));
    expect(within(help).getByTestId('help-nav')).toBeInTheDocument();
  });

  it('印刷は表示中のトピックの印刷を呼ぶ', async () => {
    const { user } = renderHelp();
    const help = await screen.findByTestId('help-window');
    const toolbar = within(help).getByTestId('help-toolbar');
    const frame = screen.getByTestId('help-topic-frame') as HTMLIFrameElement;
    const print = vi.spyOn(frame.contentWindow as Window, 'print').mockImplementation(() => {});

    await user.click(within(toolbar).getByRole('button', { name: '印刷' }));

    expect(print).toHaveBeenCalledTimes(1);
  });

  it('読み込めなかったときは、その旨を出す', async () => {
    const load = vi.fn(() => Promise.reject(new Error('nope')));
    render(<HelpWindow pane="contents" load={load} onClose={vi.fn()} />);

    expect(await screen.findByTestId('help-error')).toHaveTextContent('ヘルプを読み込めませんでした');
  });
});
