import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import dummy from './data/fixtures/dummy-catalog.json';
import { DEFAULT_SEARCH_CONDITION, searchCircles } from './domain/search';
import { normalize } from './domain/normalize';
import { SEARCH_FIELDS } from './domain/search-fields';
import type { CatalogData } from './domain/types';

/** 同梱のダミーカタログの件数 (生成: tools/gen-dummy-data.py)。 */
const SAMPLE_COUNT = dummy.circles.length;

async function renderApp() {
  const user = userEvent.setup();
  // 起動シーケンス (起動確認 → シリアル → 情報送信) は専用のテストで確認する
  render(<App startup={false} />);
  await screen.findByTestId('main-window');
  await waitFor(() => expect(screen.getByTestId('main-window')).toBeInTheDocument());
  return { user };
}

/** メニューを開いて項目を選ぶ。ドロップダウンはライブラリが body へ portal する。 */
async function chooseMenu(user: UserEvent, topLabel: string, itemName: RegExp) {
  const menus = screen.getAllByRole('menubar');
  await user.click(within(menus[menus.length - 1]).getByRole('menuitem', { name: topLabel }));
  const opened = screen.getAllByRole('menu');
  await user.click(within(opened[opened.length - 1]).getByRole('menuitem', { name: itemName }));
}

async function openSearch(user: UserEvent) {
  await chooseMenu(user, '検索(S)', /^検索\(S\)\.\.\./);
  return screen.findByTestId('search-window');
}

describe('App — 元アプリの画面が揃っている', () => {
  it('実装済みのウィンドウ (カット/詳細/チェックリスト/一覧/マップ) を同時に表示する', async () => {
    await renderApp();
    expect(await screen.findByTestId('main-window')).toBeInTheDocument();
    expect(await screen.findByTestId('detail-window')).toBeInTheDocument();
    expect(await screen.findByTestId('checklist-window')).toBeInTheDocument();
    expect(await screen.findByTestId('cut-view')).toBeInTheDocument();
    expect(await screen.findByTestId('list-window')).toBeInTheDocument();
    expect(await screen.findByTestId('map-window')).toBeInTheDocument();
    // 検索ダイアログだけは必要なときにメニューから開く。
    expect(screen.queryByTestId('search-window')).not.toBeInTheDocument();
  });

  it('画面が広いときは主要 5 ウィンドウを初期表示する (地図は実物と同じ 690 幅でサークル詳細と重なる)', async () => {
    const widthDesc = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const heightDesc = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 2560 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1440 });
    try {
      render(<App startup={false} />);
      expect(await screen.findByTestId('main-window')).toBeInTheDocument();
      const boxes = ['main-window', 'detail-window', 'checklist-window', 'list-window', 'map-window'].map((id) => {
        const element = screen.getByTestId(id);
        const root = (element.matches('.window') ? element : element.querySelector('.window')) as HTMLElement;
        expect(root, `${id} のウィンドウ枠`).not.toBeNull();
        return {
          id,
          left: Number.parseFloat(root.style.left),
          top: Number.parseFloat(root.style.top),
          width: Number.parseFloat(root.style.width),
          height: Number.parseFloat(root.style.height),
        };
      });
      for (const box of boxes) {
        expect(Number.isFinite(box.left) && Number.isFinite(box.top), `${box.id} の位置`).toBe(true);
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
      // 会場マップは実物 (ヘルプのスクリーンショット) と同じ 690x542 を最小幅にしているので、
      // 1920px 幅のレイアウトでは右端でサークル詳細と重なる (実物の初期配置も カット / 一覧 /
      // 地図 が重なっている)。それ以外の組み合わせは重ならずに並ぶ。
      const overlaps = (a: (typeof boxes)[number], b: (typeof boxes)[number]) =>
        a.left < b.left + b.width &&
        b.left < a.left + a.width &&
        a.top < b.top + b.height &&
        b.top < a.top + a.height;
      for (let i = 0; i < boxes.length; i += 1) {
        for (let j = i + 1; j < boxes.length; j += 1) {
          const a = boxes[i];
          const b = boxes[j];
          const pair = [a.id, b.id].sort().join(' / ');
          const expected = pair === 'detail-window / map-window';
          expect(`${pair}: ${overlaps(a, b) ? '重なる' : '重ならない'}`).toBe(
            `${pair}: ${expected ? '重なる' : '重ならない'}`,
          );
        }
      }
    } finally {
      if (widthDesc) Object.defineProperty(window, 'innerWidth', widthDesc);
      if (heightDesc) Object.defineProperty(window, 'innerHeight', heightDesc);
    }
  });

  it('カットにはダミー画像が並ぶ', async () => {
    await renderApp();
    const cutView = await screen.findByTestId('cut-view');
    const images = cutView.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toHaveAttribute('src', expect.stringMatching(/^\/cuts\/\d+\.png$/));
  });
});

describe('App — サークルを選ぶ', () => {
  it('カットをダブルクリックすると詳細が埋まり、チェックリストに載る', async () => {
    const { user } = await renderApp();
    const cutView = await screen.findByTestId('cut-view');
    const cell = cutView.querySelector('.cut-cell');
    expect(cell).not.toBeNull();

    await user.dblClick(cell as HTMLElement);

    const detail = await screen.findByTestId('detail-window');
    // サークル名は見出し帯としてカット画像に焼き込まれているので、DOM からは
    // 詳細ウィンドウの「サークル名」行 (実物は読み取り専用テキスト) を読んで突き合わせる。
    const nameRow = within(detail)
      .getAllByTestId('detail-info-row')
      .find((row) => row.getAttribute('data-label') === 'サークル名');
    const name = nameRow?.lastElementChild?.textContent ?? '';
    expect(name.length).toBeGreaterThan(0);

    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getByText(name)).toBeInTheDocument());
  });

  it('メモを編集すると詳細ウィンドウに反映される', async () => {
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
  });

  it('ページ指定で移動するとカット表示のページが変わる', async () => {
    const { user } = await renderApp();
    const lastPage = dummy.circles[dummy.circles.length - 1].pageNo;
    await chooseMenu(user, 'ページ移動(J)', /^ページ指定で移動/);
    const input = await screen.findByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, String(lastPage));
    await user.click(screen.getByTestId('goto-page-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('main-window')).toHaveTextContent(`ページ ${lastPage}`),
    );
  });
});

describe('App — チェックリストのダミー登録 (見た目とスクロールの確認用)', () => {
  /** ダミー登録の日付ごとの件数 (App 側と同じ規則: 各日の末尾から決定的に選ぶ)。 */
  const DEMO_COUNTS: Record<number, number> = { 1: 20, 2: 14, 3: 14, 4: 14, 0: 3 };
  const DEMO_TOTAL = Object.values(DEMO_COUNTS).reduce((sum, count) => sum + count, 0);
  /** チェックリスト 1 行の高さ (実測 20px)。 */
  const CHECKLIST_ROW_HEIGHT = 20;
  /** チェックリストウィンドウの高さ (LAYOUT_WIDE の 390px。タブパネルはこれより低い)。 */
  const CHECKLIST_WINDOW_HEIGHT = 390;

  it('タブ名は日付名だけで、件数の括弧を出さない', async () => {
    await renderApp();
    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getAllByRole('tab')).toHaveLength(5));

    const labels = within(checklist)
      .getAllByRole('tab')
      .map((tab) => tab.textContent ?? '');
    expect(labels).toEqual(['1日目', '2日目', '3日目', '4日目', '抽選漏れ']);
    expect(labels.every((label) => !label.includes('('))).toBe(true);
  });

  it('初期表示のタブに、縦スクロールが出る量の行が入っている', async () => {
    await renderApp();
    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getAllByRole('row').length).toBeGreaterThan(1));

    // ヘッダー行を除いた件数。
    const rows = within(checklist).getAllByRole('row').length - 1;
    expect(rows).toBe(DEMO_COUNTS[1]);
    // 行数 x 行高がウィンドウ高 (≧ タブパネル高) を超えるので、パネルからはみ出して縦スクロールが出る。
    expect(rows * CHECKLIST_ROW_HEIGHT).toBeGreaterThan(CHECKLIST_WINDOW_HEIGHT);
  });

  it('各日にダミー登録が入り、件数はステータスバーに出る', async () => {
    const { user } = await renderApp();
    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getAllByRole('tab')).toHaveLength(5));

    for (const day of [1, 2, 3, 4, 0]) {
      await user.click(
        within(checklist).getByRole('link', { name: day === 0 ? '抽選漏れ' : `${day}日目` }),
      );
      await waitFor(() =>
        expect(
          within(checklist).getByText(`全 ${DEMO_TOTAL} 件中 ${DEMO_COUNTS[day]} 件を表示`),
        ).toBeInTheDocument(),
      );
    }
  });

  it('解除したダミー登録は入れ直さない', async () => {
    const { user } = await renderApp();
    const checklist = await screen.findByTestId('checklist-window');
    await waitFor(() => expect(within(checklist).getAllByRole('row').length).toBeGreaterThan(1));

    // 1 日目のタブのデータ行 (ヘッダー行を除く)。
    const dataRows = within(checklist).getAllByRole('row').slice(1);
    expect(dataRows).toHaveLength(DEMO_COUNTS[1]);

    // 1 日目の行をすべて選んで「チェック解除」する (Ctrl クリックで追加選択)。
    await user.click(dataRows[0]);
    for (const row of dataRows.slice(1)) {
      fireEvent.click(row, { ctrlKey: true });
    }
    await waitFor(() =>
      expect(within(checklist).getByText(`選択 ${DEMO_COUNTS[1]} 件`)).toBeInTheDocument(),
    );
    await user.click(within(checklist).getByRole('button', { name: 'チェック解除' }));

    await waitFor(() =>
      expect(within(checklist).getByText('この日のチェックリストは空です')).toBeInTheDocument(),
    );
    // 解除した 20 件は登録し直されず、他の日のダミー登録だけが残る。
    expect(
      within(checklist).getByText(`全 ${DEMO_TOTAL - DEMO_COUNTS[1]} 件中 0 件を表示`),
    ).toBeInTheDocument();
  });
});

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
  });

  it('検索前は絞込み・やり直しができず、初期化は条件を既定に戻す', async () => {
    const { user } = await renderApp();
    await openSearch(user);
    expect(screen.getByTestId('search-narrow')).toBeDisabled();
    expect(screen.getByTestId('search-undo')).toBeDisabled();

    await user.type(screen.getByTestId('search-keyword'), 'ダミー');
    await user.click(screen.getByTestId('search-reset'));
    expect(screen.getByTestId('search-keyword')).toHaveValue('');
  });

  it('空のキーワードで検索すると全件が一覧に出る', async () => {
    const { user } = await renderApp();
    await openSearch(user);
    await user.click(screen.getByTestId('search-run'));
    const list = await screen.findByTestId('list-window');
    expect(within(list).getByText(new RegExp(`該当 ${SAMPLE_COUNT} 件`))).toBeInTheDocument();
  });

  it('一覧の行をダブルクリックすると、そのサークルのページへ移動する', async () => {
    const { user } = await renderApp();
    await openSearch(user);
    await user.click(screen.getByTestId('search-run'));
    const list = await screen.findByTestId('list-window');
    await waitFor(() => expect(within(list).getAllByRole('row').length).toBeGreaterThan(1));

    const rows = within(list).getAllByRole('row');
    await user.dblClick(rows[rows.length - 1]);
    const lastPage = dummy.circles[dummy.circles.length - 1].pageNo;
    await waitFor(() =>
      expect(screen.getByTestId('main-window')).toHaveTextContent(`ページ ${lastPage}`),
    );
  });
});

describe('App — サークル一覧のツールバー', () => {
  /** サークル一覧 (初期表示なのでメニューでトグルしない)。 */
  async function openList() {
    return screen.findByTestId('list-window');
  }

  /** 一覧に出ている行のセル (ヘッダー行を除く)。 */
  function listedCells(list: HTMLElement): string[][] {
    return within(list)
      .getAllByRole('row')
      .slice(1)
      .map((row) => Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent ?? ''));
  }

  it('一覧を開くと、最初の日付とブロックのサークルを出す', async () => {
    await renderApp();
    const list = await openList();

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
    expect(cells.every((row) => row[5] === `${day}日目`)).toBe(true);
  });

  it('表示モードを「日付／インデックス」にすると、選んだ読みのかな行だけを出す', async () => {
    const { user } = await renderApp();
    const list = await openList();

    await user.selectOptions(within(list).getByTestId('list-mode'), 'dateIndex');
    await user.selectOptions(within(list).getByTestId('list-index'), 'あ');

    const cells = listedCells(list);
    expect(cells.length).toBeGreaterThan(0);
    // すべて既定の日付 (1 日目) のサークル。
    expect(cells.every((row) => row[5] === '1日目')).toBe(true);
    // 読みの 1 文字目はすべて「あ」行 (あいうえお + 小書き)。
    const aRow = normalize('あいうえおぁぃぅぇぉ');
    expect(cells.every((row) => aRow.includes(normalize(row[1].charAt(0))))).toBe(true);
  });

  it('簡易検索ボックスはリターンキーで検索を実行し、件数をステータスバーに出す', async () => {
    const { user } = await renderApp();
    const list = await openList();

    const keyword = dummy.circles[0].circleName;
    const expected = searchCircles(dummy as CatalogData, {
      ...DEFAULT_SEARCH_CONDITION,
      keywords: keyword,
    }).length;
    expect(expected).toBeGreaterThan(0);

    await user.type(within(list).getByTestId('list-quick-search'), `${keyword}{Enter}`);

    await waitFor(() =>
      expect(within(list).getByText(new RegExp(`該当 ${expected} 件`))).toBeInTheDocument(),
    );
    expect(listedCells(list).length).toBe(expected);
  });

  it('検索ボタンで検索ダイアログを開ける', async () => {
    const { user } = await renderApp();
    const list = await openList();

    await user.click(within(list).getByRole('button', { name: '検索' }));

    expect(await screen.findByTestId('search-window')).toBeInTheDocument();
  });

  it('一覧で選んだサークルを「チェック解除」でチェックリストから外す', async () => {
    const { user } = await renderApp();
    const list = await openList();
    const name = within(list).getAllByRole('row')[1].querySelector('td')?.textContent ?? '';
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

describe('App — ウィンドウメニューとダイアログ', () => {
  it('会場マップは初期表示され、実物の地図画像を出す', async () => {
    await renderApp();
    expect(await screen.findByTestId('map-window')).toBeInTheDocument();
    // 地図画像は実物をベクター化した SVG (public/maps/<filename>.svg)。
    expect(await screen.findByTestId('map-image')).toHaveAttribute(
      'src',
      `/maps/${dummy.maps[0].filename}.svg`,
    );
  });

  it('ヘルプのバージョン情報を開ける', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ヘルプ(H)', /^バージョン情報/);
    const about = await screen.findByTestId('about-dialog');
    expect(about).toHaveTextContent(dummy.info.comiketName);
    expect(about).toHaveTextContent(`サークル数: ${SAMPLE_COUNT}`);
  });
});

describe('App — 起動シーケンス (元実装: 起動確認 → シリアル番号 → 情報送信)', () => {
  it('起動確認 → シリアル番号 → 情報送信 の順に進み、完了すると閉じる', async () => {
    const user = userEvent.setup();
    render(<App />);

    const startup = await screen.findByTestId('startup-confirm-dialog');
    expect(startup).toHaveTextContent('コミックマーケット96');
    await user.click(screen.getByTestId('startup-launch'));

    const serial = await screen.findByTestId('serial-input-dialog');
    expect(serial).toBeInTheDocument();
    await user.type(screen.getByTestId('serial-input'), 'DUMMY-0001');
    await user.click(screen.getByTestId('serial-submit'));

    expect(await screen.findByTestId('send-info-dialog')).toBeInTheDocument();
    await user.click(screen.getByTestId('send-info-yes'));

    await waitFor(() => expect(screen.queryByTestId('send-info-dialog')).not.toBeInTheDocument());
    expect(screen.getByTestId('main-window')).toBeInTheDocument();
  });
});

describe('App — 残りのダイアログをメニューから開ける', () => {
  it('動作設定 (32780) を開く', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^動作設定\(C\)\.\.\./);
    expect(await screen.findByTestId('preferences-dialog')).toBeInTheDocument();
  });

  it('印刷詳細設定からサークルリスト印刷 → プレビュー → 印刷中 まで進める', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^印刷詳細設定/);
    const chooser = await screen.findByTestId('list-dialog');
    await user.dblClick(within(chooser).getByText('サークルリスト印刷'));

    const settings = await screen.findByTestId('print-list-dialog');
    await user.click(within(settings).getByTestId('print-list-preview'));
    expect(await screen.findByTestId('print-preview-window')).toBeInTheDocument();

    await user.click(screen.getByTestId('preview-print'));
    expect(await screen.findByTestId('print-progress-dialog')).toBeInTheDocument();
  });

  it('印刷ダイアログでプリンタを選ぶと設定ダイアログへ進む', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^印刷\(P\)/);
    const printDialog = await screen.findByTestId('print-dialog');
    await user.click(within(printDialog).getByTestId('print-submit'));
    expect(await screen.findByTestId('print-list-dialog')).toBeInTheDocument();
  });

  it('ブックマークを追加できる', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ブックマーク(B)', /^このページを追加/);
    const add = await screen.findByTestId('bookmark-add-dialog');
    await user.clear(within(add).getByTestId('bookmark-name-input'));
    await user.type(within(add).getByTestId('bookmark-name-input'), 'あとで見るページ');
    await user.click(within(add).getByTestId('bookmark-add-submit'));
    await waitFor(() =>
      expect(screen.getByTestId('main-window')).toHaveTextContent('あとで見るページ'),
    );
  });

  it('データベースの初期化から古いデータベースの統合を開ける', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^データベースの初期化/);
    const chooser = await screen.findByTestId('list-dialog');
    await user.dblClick(within(chooser).getByText('古いデータベースの統合'));
    expect(await screen.findByTestId('database-merge-dialog')).toBeInTheDocument();
  });

  it('チェックリストのエクスポート結果を表示できる', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^チェックリストを circle\.ms にエクスポート/);
    expect(await screen.findByTestId('export-result-dialog')).toBeInTheDocument();
  });
});
