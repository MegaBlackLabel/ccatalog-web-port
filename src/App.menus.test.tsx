// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { dummy, checkedCount, renderApp, chooseMenu, chooseSubmenu, screen, waitFor, within } from './test/app-harness';
import { CHECK_COLOR_HEX } from './ui/check-colors';

describe('App — メニューの残り (ファイル / 表示 / ページ移動 / チェックリスト / 検索 / ヘルプ)', () => {
  it('新規作成 (32818) はチェックリストを空にする', async () => {
    const { user } = await renderApp();
    await waitFor(() => expect(checkedCount()).toBe(65));

    await chooseMenu(user, 'ファイル(F)', /^新規作成/);

    await waitFor(() => expect(checkedCount()).toBe(0));
  });

  it('チェックリストの保存 (32794) は CSV をダウンロードする', async () => {
    const createObjectURL = vi.fn(() => 'blob:ccatalog');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(checkedCount()).toBe(65));

    await chooseMenu(user, 'ファイル(F)', /^チェックリストの保存/);

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(main).toHaveTextContent('チェックリスト 65 件を保存しました');
  });

  it('前のブロック / 次のブロック (32865 / 32864) でカーソルが別のブロックへ移る', async () => {
    const { user } = await renderApp();
    const cutView = screen.getByTestId('cut-view');
    const selectedLabel = () =>
      cutView.querySelector('.cut-cell--selected')?.getAttribute('aria-label') ?? '';
    await waitFor(() => expect(selectedLabel()).not.toBe(''));
    const before = selectedLabel();

    await chooseMenu(user, 'ページ移動(J)', /^次のブロック/);
    await waitFor(() => expect(selectedLabel()).not.toBe(before));
    const afterNext = selectedLabel();

    await chooseMenu(user, 'ページ移動(J)', /^前のブロック/);
    await waitFor(() => expect(selectedLabel()).not.toBe(afterNext));
  });

  it('全てのメモを消去する (32874) と、詳細ウィンドウのメモが消える', async () => {
    const { user } = await renderApp();
    const cutView = await screen.findByTestId('cut-view');
    await user.click(cutView.querySelector('.cut-cell') as HTMLElement);

    await chooseMenu(user, 'チェックリスト(A)', /^サークルのメモを編集する/);
    const memoInput = await screen.findByTestId('memo-input');
    await user.clear(memoInput);
    await user.type(memoInput, '東館 先に寄る');
    await user.click(screen.getByTestId('memo-save'));
    const detail = await screen.findByTestId('detail-window');
    await waitFor(() => expect(within(detail).getByText('東館 先に寄る')).toBeInTheDocument());

    await chooseMenu(user, 'チェックリスト(A)', /^全てのメモを消去する/);

    await waitFor(() =>
      expect(within(detail).queryByText('東館 先に寄る')).not.toBeInTheDocument(),
    );
  });

  it('選択サークルをコピー (1707) して、チェックリストにペースト (1708) できる', async () => {
    let clipboard = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          clipboard = text;
          return Promise.resolve();
        },
        readText: () => Promise.resolve(clipboard),
      },
    });
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(checkedCount()).toBe(65));

    await chooseMenu(user, 'チェックリスト(A)', /^選択サークルをクリップボードにコピー/);
    await waitFor(() => expect(main).toHaveTextContent('コピーしました'));

    await chooseMenu(user, 'チェックリスト(A)', /^クリップボードからチェックリストにペースト/);

    await waitFor(() => expect(checkedCount()).toBe(66));
  });

  it('高解像度表示 (32867) を切ると地図が PNG に切り替わる', async () => {
    const { user } = await renderApp();
    expect(await screen.findByTestId('map-image')).toHaveAttribute(
      'src',
      `/maps/${dummy.maps[0].filename}.svg`,
    );

    await chooseMenu(user, '表示(V)', /高解像度表示/);

    await waitFor(() =>
      expect(screen.getByTestId('map-image')).toHaveAttribute(
        'src',
        `/maps/${dummy.maps[0].filename}.png`,
      ),
    );
  });


  it('アンチエイリアス (32792) を切るとカット画像がドット等倍になる', async () => {
    const { user } = await renderApp();
    const image = screen.getByTestId('cut-view').querySelector('img') as HTMLElement;
    expect(image.style.imageRendering).not.toBe('pixelated');

    await chooseMenu(user, '表示(V)', /アンチエイリアス/);

    await waitFor(() =>
      expect((screen.getByTestId('cut-view').querySelector('img') as HTMLElement).style.imageRendering).toBe('pixelated'),
    );
  });

  it('サークルのWEBページを開く (32859) は登録された URL を開く', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { user } = await renderApp();
    const circle = dummy.circles[0];

    await chooseMenu(user, '検索(S)', /^サークルのWEBページを開く/);

    if (circle.url.length === 0) {
      expect(open).not.toHaveBeenCalled();
      expect(screen.getByTestId('main-window')).toHaveTextContent('登録されていません');
    } else {
      expect(open).toHaveBeenCalledWith(circle.url, '_blank', 'noreferrer');
    }
  });

  it('ヘルプ (32815 目次 / 32816 検索 / 32817 キーワード) は CHM の 3 つのタブを開く', async () => {
    // 公開資産 (public/help/**) を読むところを、実際と同じ形の応答に差し替える。
    const hhc =
      '<html><body><ul>' +
      '<li><object type="text/sitemap"><param name="Name" value="はじめに">' +
      '<param name="Local" value="0BASE/1OVERVIE.HTM"></object>' +
      '<li><object type="text/sitemap"><param name="Name" value="印刷">' +
      '<param name="Local" value="4PRINT/1PRINT.HTM"></object></ul></body></html>';
    const hhk =
      '<html><body><ul><li><object type="text/sitemap"><param name="Name" value="印刷">' +
      '<param name="Name" value="印刷"><param name="Local" value="4PRINT/1PRINT.HTM"></object>' +
      '</ul></body></html>';
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        text: async () => (String(url).endsWith('ccatalog.hhk') ? hhk : hhc),
        json: async () => [],
      })),
    );
    const { user } = await renderApp();

    await chooseMenu(user, 'ヘルプ(H)', /^目次/);
    const help = await screen.findByTestId('help-window');
    // 目次 (32815) は目次タブ。実機と同じく、目次の先頭のトピックを出す。
    expect(within(help).getByRole('tab', { selected: true })).toHaveTextContent('目次(C)');
    await waitFor(() => expect(within(help).getAllByTestId('help-toc-label')).toHaveLength(2));
    expect(within(help).getAllByTestId('help-toc-label')[0]).toHaveTextContent('はじめに');
    expect(screen.getByTestId('help-topic-frame')).toHaveAttribute('src', '/help/0BASE/1OVERVIE.HTM');

    // 検索 (32816) / キーワード (32817) はそのタブで開く (タブは中のリンクが切り替える)。
    const tabLink = (name: string) =>
      (within(help).getByRole('tab', { name }).querySelector('a') ??
        within(help).getByRole('tab', { name })) as HTMLElement;
    await user.click(tabLink('検索(S)'));
    expect(within(help).getByRole('tab', { selected: true })).toHaveTextContent('検索(S)');
    await user.click(tabLink('キーワード(N)'));
    expect(within(help).getByRole('tab', { selected: true })).toHaveTextContent('キーワード(N)');

    // 閉じる (タイトルバーの ×) で消える。
    await user.click(within(help).getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('help-window')).toBeNull();
  }, 30000);

  it('チェックリストの RSS ボタンはダミーの取得結果を出す', async () => {
    const { user } = await renderApp();
    const checklist = await screen.findByTestId('checklist-window');

    await user.click(within(checklist).getByRole('button', { name: 'RSS' }));

    expect(screen.getByTestId('main-window')).toHaveTextContent('RSS情報を取得しました');
  });

  it('標準のチェック色 (サブメニュー) で登録する色が変わる', async () => {
    const { user } = await renderApp();
    await waitFor(() =>
      expect(checkedCount()).toBe(65),
    );

    await chooseSubmenu(user, 'チェックリスト(A)', /^標準のチェック色/, /^色5$/);

    // スペース番号ボックスを持つのは a のサークルだけ。
    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    const target = [...cells].find((cell) => cell.querySelector('.cut-cell__space')) as HTMLElement;
    await user.dblClick(target);

    const space = target.querySelector('.cut-cell__space') as HTMLElement;
    await waitFor(() => expect(space).toHaveStyle({ background: CHECK_COLOR_HEX[5] }));
  });

  it('ツールバー表示の切替 (サブメニュー) でバーが消える', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    expect(within(main).getByTestId('toolbar-group-basic')).toBeInTheDocument();

    await chooseSubmenu(user, '表示(V)', /^ツールバー/, /基本バー/);

    await waitFor(() =>
      expect(within(main).queryByTestId('toolbar-group-basic')).not.toBeInTheDocument(),
    );
    expect(within(main).getByTestId('toolbar-group-jump')).toBeInTheDocument();
  });
});
