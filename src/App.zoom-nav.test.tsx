// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { dummy, pageNumberOf, renderApp, chooseMenu, screen, waitFor, within } from './test/app-harness';

describe('App — 表示の拡大率 (幅 / 高さ / 全体 / 元のサイズ)', () => {
  /** カットビューの表示領域 (jsdom にはレイアウトが無いので計測だけ差し替える)。 */
  function mockViewBox(width: number, height: number) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: height,
      width,
      height,
      toJSON: () => ({}),
    });
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('幅 / 高さ に合わせると、カットビューの表示領域から拡大率を決める', async () => {
    // カットは実物の実寸 105x150。幅 534px は 6 列 (105px x 6 = 630px) の 85%。
    // 高さ 1012px は 6 行 (150px x 6 = 900px) に収まるので 112% (拡大も許す)。
    mockViewBox(534, 1012);
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    const zoomInput = within(main).getByRole('textbox', { name: '拡大率' });

    await user.click(within(main).getByRole('button', { name: '幅に合わせる' }));
    // 拡大率はツールバーの欄に出る (ステータスバーは通常は空)。
    await waitFor(() => expect(zoomInput).toHaveValue('85%'));

    await user.click(within(main).getByRole('button', { name: '高さに合わせる' }));
    // 1 ページ = 30 カット (6 列 x 5 行) なので、高さ 1012px / (150px x 5) = 135%。
    await waitFor(() => expect(zoomInput).toHaveValue('135%'));

    // 全体を表示 (メニュー) は幅と高さの小さい方 (幅 534px / 6 列 = 85%) に合わせる。
    await chooseMenu(user, '表示(V)', /^全体を表示/);
    await waitFor(() => expect(zoomInput).toHaveValue('85%'));
  });

  it('元のサイズは 100% に戻し、カットを実寸 105px の列で並べる', async () => {
    mockViewBox(534, 1012);
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');

    await user.click(within(main).getByRole('button', { name: '元のサイズ' }));

    await waitFor(() =>
      expect(within(main).getByRole('textbox', { name: '拡大率' })).toHaveValue('100%'),
    );
    const view = screen.getByTestId('cut-view');
    // 格子は配置情報の帯の次にある (帯は格子の直前)。
    const grid = [...view.children].find(
      (child) => (child as HTMLElement).style.display === 'grid',
    ) as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(6, 105px)');
  });
});

describe('App — ナビゲート (前に戻る / 次に進む)', () => {
  it('既定で出ているナビゲートバーの 戻る / 進む で行き来できる', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');

    expect(within(main).getByRole('button', { name: '戻る' })).toBeInTheDocument();
    // 起動時に表示するページ (先頭のサークルのページ) と、最後のページ。
    const firstPage = dummy.circles[0].pageNo;
    const targetPage = Math.max(...dummy.circles.map((circle) => circle.pageNo));
    await waitFor(() => expect(pageNumberOf()).toBe(String(firstPage)));

    await chooseMenu(user, 'ページ移動(J)', /^ページ指定で移動/);
    const input = await screen.findByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, String(targetPage));
    await user.click(screen.getByTestId('goto-page-submit'));
    await waitFor(() => expect(pageNumberOf()).toBe(String(targetPage)));

    await user.click(within(main).getByRole('button', { name: '戻る' }));
    await waitFor(() => expect(pageNumberOf()).toBe(String(firstPage)));

    await user.click(within(main).getByRole('button', { name: '進む' }));
    await waitFor(() => expect(pageNumberOf()).toBe(String(targetPage)));
  });
});
