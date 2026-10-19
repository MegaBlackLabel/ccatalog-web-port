// App の統合テスト (メニュー操作 → 画面遷移)。共有するヘルパーは test/app-harness.tsx に置く。
import { dummy, pageNumberOf, renderApp, chooseMenu, openSearch, screen, waitFor, within } from './test/app-harness';
import { DEFAULT_SEARCH_CONDITION, searchCircles } from './domain/search';
import { SEARCH_FIELDS } from './domain/search-fields';
import type { UserEvent } from '@testing-library/user-event';
import type { CatalogData } from './domain/types';

describe('App — 検索 (メニューから開く)', () => {
  it('検索ダイアログが元実装の 14 項目をそのまま持つ', async () => {
    const { user } = await renderApp();
    const search = await openSearch(user);
    for (const field of SEARCH_FIELDS) {
      expect(search.querySelector(`[data-ctrl-id="${field.controlId}"]`), field.label).not.toBeNull();
    }
  });

  it('キーワード検索の結果が一覧に反映され、絞込みが有効になる', async () => {
    const { user } = await renderApp();
    await openSearch(user);

    const keyword = dummy.circles[0].circleName;
    const expected = searchCircles(dummy as CatalogData, {
      ...DEFAULT_SEARCH_CONDITION,
      keywords: keyword,
    }).length;
    expect(expected).toBeGreaterThan(0);

    await user.type(screen.getByTestId('search-keyword'), keyword);
    await user.click(screen.getByTestId('search-run'));

    const list = await screen.findByTestId('list-window');
    await waitFor(() =>
      expect(within(list).getByText(new RegExp(`該当 ${expected} 件`))).toBeInTheDocument(),
    );
    expect(screen.getByTestId('search-narrow')).toBeEnabled();
    expect(screen.getByTestId('search-undo')).toBeDisabled();

    // 初期化は検索条件を既定に戻す (キーワード欄が空になる)。
    await user.click(screen.getByTestId('search-reset'));
    expect(screen.getByTestId('search-keyword')).toHaveValue('');
  });

  it('一覧の行をダブルクリックすると、そのサークルのページへ移動する', async () => {
    const { user } = await renderApp();
    await openSearch(user);

    // 全件 (2853 行) を一覧に出すと、行の描画だけで数秒かかる。
    // 数件に絞った検索で「行のダブルクリック → そのページへ移動」の配線だけを確かめる。
    const keyword = dummy.circles[0].circleName;
    const hits = searchCircles(dummy as CatalogData, {
      ...DEFAULT_SEARCH_CONDITION,
      keywords: keyword,
    });
    expect(hits.length).toBeGreaterThan(1);

    await user.type(screen.getByTestId('search-keyword'), keyword);
    await user.click(screen.getByTestId('search-run'));
    const list = await screen.findByTestId('list-window');
    const rows = () => [...list.querySelectorAll('tbody tr')];
    await waitFor(() => expect(rows()).toHaveLength(hits.length));

    // 一覧の行はクリックで選択、ダブルクリックで詳細 (ページ移動)。
    const lastRow = () => rows()[rows().length - 1] as HTMLElement;
    await user.click(lastRow());
    await user.dblClick(lastRow());
    const last = hits[hits.length - 1];
    await waitFor(() => expect(pageNumberOf()).toBe(String(last.pageNo)));
  }, 30000);
});

describe('App — サークル一覧のツールバー', () => {
  /** サークル一覧 (初期表示なのでメニューでトグルしない)。 */
  async function openList(user: UserEvent) {
    // サークル一覧は既定では出さない (取り込み画像の配置に合わせて 4 枚だけ出す)。
    const existing = screen.queryByTestId('list-window');
    if (existing !== null) return existing;
    await chooseMenu(user, 'ウィンドウ(W)', /^サークル一覧/);
    return screen.findByTestId('list-window');
  }

  /** 一覧に出ている行のセル (ヘッダー行を除く)。 */
  function listedCells(list: HTMLElement): string[][] {
    return within(list)
      .getAllByRole('row')
      .slice(1)
      .map((row) => Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent ?? ''));
  }

  /** 列名で引いた 1 列分のセル (列の並びは「リスト表示」の設定で変わる)。 */
  function listedColumn(list: HTMLElement, header: string): string[] {
    const headers = within(list)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    const index = headers.indexOf(header);
    if (index < 0) throw new Error(`${header} の列がありません`);
    return listedCells(list).map((row) => row[index] ?? '');
  }

  it('一覧を開くと、最初の日付とブロックのサークルを出す', async () => {
    const { user } = await renderApp();
    const list = await openList(user);

    const day = Math.min(...dummy.circles.map((circle) => circle.day).filter((value) => value > 0));
    // ブロックは日付ごとに違うので、その日付のサークルから最初のブロックを選ぶ。
    const block = Math.min(
      ...dummy.circles.filter((circle) => circle.day === day).map((circle) => circle.blockId),
    );
    const expected = dummy.circles.filter(
      (circle) => circle.day === day && circle.blockId === block,
    ).length;
    expect(expected).toBeGreaterThan(0);

    const cells = listedCells(list);
    expect(cells).toHaveLength(expected);
    // 日付の列。
    expect(listedColumn(list, '参加日').every((cell) => cell === `${day}日目`)).toBe(true);
  });

  it('表示モードを「日付／インデックス」にすると、選んだインデックスのサークルだけを出す', async () => {
    const { user } = await renderApp();
    const list = await openList(user);

    await user.selectOptions(within(list).getByTestId('list-mode'), 'dateIndex');
    // 3 つ目は実物のブロック名 (あ〜れ / Ａ〜Ｒ / ア〜リ) をそのまま出す。
    const index = within(list).getByTestId('list-index') as HTMLSelectElement;
    const labels = [...index.options].map((option) => option.text);
    expect(labels[0]).toBe('あ');
    expect(labels).toContain('れ');
    expect(labels).toContain('Ｒ');
    expect(labels).toContain('ア');
    expect(labels).toContain('リ');
    // 配置のあるブロックを選ぶ (実物は配置の無いブロックを選ぶと 0 件になる)。
    const withCircles = [...index.options].find((option) =>
      dummy.circles.some((circle) => circle.blockId === Number(option.value) && circle.day === 1),
    );
    expect(withCircles).toBeDefined();
    await user.selectOptions(index, withCircles!.value);

    const cells = listedCells(list);
    expect(cells.length).toBeGreaterThan(0);
    // すべて既定の日付 (1 日目) のサークル。
    expect(listedColumn(list, '参加日').every((cell) => cell === '1日目')).toBe(true);
  });

  it('一覧で選んだサークルを「チェック解除」でチェックリストから外す', async () => {
    const { user } = await renderApp();
    const list = await openList(user);
    const name = listedColumn(list, 'サークル名')[0] ?? '';
    expect(name.length).toBeGreaterThan(0);

    // 同じサークルをカット側でダブルクリックしてチェックリスト (1 日目のタブ) に載せる。
    const cutView = await screen.findByTestId('cut-view');
    const cell = Array.from(cutView.querySelectorAll('.cut-cell')).find((candidate) =>
      (candidate.getAttribute('aria-label') ?? '').includes(name),
    );
    if (!cell) throw new Error(`${name} のカットがありません`);
    await user.dblClick(cell);

    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getByText(name)).toBeInTheDocument());

    await user.click(within(list).getAllByRole('row')[1]);
    await user.click(within(list).getByRole('button', { name: 'チェック解除' }));

    await waitFor(() => expect(within(checklist).queryByText(name)).not.toBeInTheDocument());
  });
});
