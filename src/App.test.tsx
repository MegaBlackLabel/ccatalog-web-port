import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import dummy from './data/fixtures/dummy-catalog.json';
import { DEFAULT_SEARCH_CONDITION, searchCircles } from './domain/search';
import { normalize } from './domain/normalize';
import { SEARCH_FIELDS } from './domain/search-fields';
import type { CatalogData } from './domain/types';
import { CHECK_COLOR_HEX } from './ui/check-colors';

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

/**
 * サブメニュー (標準のチェック色 / ツールバー) を開いて項目を選ぶ。
 * ライブラリのサブメニューはホバーで開く (role="menu" が入れ子で出る)。
 */
async function chooseSubmenu(user: UserEvent, topLabel: string, subLabel: RegExp, itemName: RegExp) {
  const menus = screen.getAllByRole('menubar');
  await user.click(within(menus[menus.length - 1]).getByRole('menuitem', { name: topLabel }));
  const opened = screen.getAllByRole('menu');
  await user.hover(within(opened[opened.length - 1]).getByRole('menuitem', { name: subLabel }));
  // サブメニューはホバーして 150ms 後に開く (ライブラリ側の遅延)。
  await waitFor(() =>
    expect(screen.getAllByRole('menuitem', { name: itemName }).length).toBeGreaterThan(0),
  );
  await user.click(screen.getAllByRole('menuitem', { name: itemName })[0]);
}

/** 各テストのスパイ (window.open / clipboard / 計測) と保存内容を戻す。 */
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

/**
 * 動作設定ダイアログ (ダイアログ 150) で 1 項目だけ切り替えて閉じる。
 * ラベルは実物のニーモニック付き (「…する (S)」) なので、先頭一致で引く
 * (ラベルそのものはダイアログのテストで見る)。
 */
async function toggleSetting(user: UserEvent, label: string) {
  await chooseMenu(user, 'ファイル(F)', /^動作設定\(C\)\.\.\./);
  const dialog = await screen.findByTestId('preferences-dialog');
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await user.click(within(dialog).getByLabelText(new RegExp(`^${escaped}`)));
  await user.click(within(dialog).getByTestId('preferences-ok'));
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
    expect(listedColumn(list, '日付').every((cell) => cell === `${day}日目`)).toBe(true);
  });

  it('表示モードを「日付／インデックス」にすると、選んだ読みのかな行だけを出す', async () => {
    const { user } = await renderApp();
    const list = await openList();

    await user.selectOptions(within(list).getByTestId('list-mode'), 'dateIndex');
    await user.selectOptions(within(list).getByTestId('list-index'), 'あ');

    const cells = listedCells(list);
    expect(cells.length).toBeGreaterThan(0);
    // すべて既定の日付 (1 日目) のサークル。
    expect(listedColumn(list, '日付').every((cell) => cell === '1日目')).toBe(true);
    // 読みの 1 文字目はすべて「あ」行 (あいうえお + 小書き)。
    const aRow = normalize('あいうえおぁぃぅぇぉ');
    expect(
      listedColumn(list, '読み').every((cell) => aRow.includes(normalize(cell.charAt(0)))),
    ).toBe(true);
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

  it('印刷詳細設定は 4 タブの 1 枚で、タブを切り替えてプレビュー → 印刷中 まで進める', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^印刷詳細設定/);
    const dialog = await screen.findByTestId('print-settings-dialog');

    // 元ダイアログ 163〜166 が 1 枚のタブになっている。
    expect(within(dialog).getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'サークルリスト印刷',
      'サークルカット印刷',
      'マップ印刷',
      '白地図印刷',
    ]);

    // 既定はサークルリスト印刷のタブ。
    expect(dialog).toHaveTextContent('印刷項目');
    // タブを切り替えるとマップ印刷の項目になる。
    await user.click(within(dialog).getByRole('link', { name: 'マップ印刷' }));
    expect(dialog).toHaveTextContent('指示線');

    // プレビューは別ウィンドウで開き、閉じると印刷詳細設定に戻る。
    await user.click(within(dialog).getByRole('button', { name: 'プレビュー' }));
    expect(await screen.findByTestId('print-preview-window')).toBeInTheDocument();
    // マップ印刷タブなので、会場図のプレビューが出る。
    expect(screen.getByTestId('preview-print-map')).toBeInTheDocument();
    await user.click(screen.getByTestId('preview-close'));
    expect(screen.queryByTestId('print-preview-window')).not.toBeInTheDocument();

    // 下部は実物と同じ OK / キャンセル / 適用(A)。「用紙サイズ・余白」「印刷」はここには無い
    // (実物では用紙・余白は印刷ダイアログ、印刷はファイル > 印刷から)。
    expect(within(dialog).getByTestId('print-settings-ok')).toHaveTextContent('OK');
    expect(within(dialog).getByTestId('print-settings-cancel')).toHaveTextContent('キャンセル');
    expect(within(dialog).getByTestId('print-settings-apply')).toHaveTextContent('適用(A)');
    expect(within(dialog).queryByTestId('print-settings-page-setup')).toBeNull();
    expect(within(dialog).queryByTestId('print-settings-print')).toBeNull();
    await user.click(within(dialog).getByTestId('print-settings-ok'));
    expect(screen.queryByTestId('print-settings-dialog')).not.toBeInTheDocument();
  });

  it('白地図印刷のプレビューにはチェック色の凡例を出さない', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^印刷詳細設定/);
    const dialog = await screen.findByTestId('print-settings-dialog');

    await user.click(within(dialog).getByRole('link', { name: '白地図印刷' }));
    await user.click(within(dialog).getByRole('button', { name: 'プレビュー' }));

    const preview = await screen.findByTestId('print-preview-window');
    expect(within(preview).getByTestId('preview-print-map')).toBeInTheDocument();
    // 白地図はチェック色を使わないので、ウィンドウ下端の凡例は出さない。
    expect(within(preview).queryByTestId('preview-check-colors')).toBeNull();
  });

  it('印刷ダイアログでプリンタを選ぶと設定ダイアログへ進む', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^印刷\(P\)/);
    const printDialog = await screen.findByTestId('print-dialog');
    await user.click(within(printDialog).getByTestId('print-submit'));
    expect(await screen.findByTestId('print-settings-dialog')).toBeInTheDocument();
  });

  it('印刷ダイアログの詳細設定は印刷詳細設定を上に重ね、印刷ダイアログは開いたままにする', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^印刷\(P\)/);
    const printDialog = await screen.findByTestId('print-dialog');

    await user.click(within(printDialog).getByRole('radio', { name: 'マップ印刷(M)' }));
    await user.click(within(printDialog).getByTestId('print-details'));

    const settings = await screen.findByTestId('print-settings-dialog');
    expect(settings).toBeInTheDocument();
    // 選んだ形式のタブで開き、印刷ダイアログは閉じない (重ねて出す)。
    expect(within(settings).getByRole('tab', { name: 'マップ印刷' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByTestId('print-dialog')).toBeInTheDocument();

    await user.click(within(settings).getByTestId('print-settings-cancel'));
    expect(screen.queryByTestId('print-settings-dialog')).toBeNull();
    expect(screen.getByTestId('print-dialog')).toBeInTheDocument();
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

  it('画像ファイル出力は説明・詳細設定・出力まで進められる (ダイアログ 197)', async () => {
    const { user } = await renderApp();
    await chooseMenu(user, 'ファイル(F)', /^画像ファイル出力/);
    const dialog = await screen.findByTestId('image-output-dialog');
    expect(dialog).toHaveTextContent('※ ページ番号と拡張子".bmp"が付加されます。');

    // 説明 (1646) → 説明ダイアログ。閉じると画像ファイル出力に戻る。
    await user.click(within(dialog).getByTestId('image-output-help'));
    const help = await screen.findByTestId('image-output-help-dialog');
    expect(help).toHaveTextContent('BMPファイル出力');
    await user.click(within(help).getByTestId('image-output-help-close'));
    expect(screen.getByTestId('image-output-dialog')).toBeInTheDocument();

    // 詳細設定 (1051) → 出力形式の詳細 (既定はサークルリスト印刷)。
    await user.click(within(dialog).getByTestId('image-output-details'));
    const details = await screen.findByTestId('print-list-dialog');
    await user.click(within(details).getByRole('button', { name: '閉じる' }));

    // ページ指定で出力 → 指定したページ数がステータスバーに出る (範囲は 1 - 3)。
    await user.click(within(dialog).getByLabelText('ページ指定(G) :'));
    const from = within(dialog).getByTestId('image-output-page-from');
    await user.clear(from);
    await user.type(from, '1');
    const to = within(dialog).getByTestId('image-output-page-to');
    await user.clear(to);
    await user.type(to, '3');
    await user.click(within(dialog).getByTestId('image-output-submit'));

    await waitFor(() =>
      expect(screen.getByTestId('main-window')).toHaveTextContent('3 ページを BMP で出力しました'),
    );
  });
});

describe('App — チェックツールバー (33001〜33009 / 33020)', () => {
  /** 起動時のダミー登録の件数 (1 日目 20 / 翌日以降 各 14 / 抽選漏れ 3)。 */
  const DEMO_TOTAL = 65;

  it('色ボタンは選択中のサークルをその色でチェックに追加する', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(main).toHaveTextContent(`チェック ${DEMO_TOTAL} 件`));

    await user.click(within(main).getByRole('button', { name: '色5' }));

    await waitFor(() => expect(main).toHaveTextContent(`チェック ${DEMO_TOTAL + 1} 件`));
    // 選択中のカットのスペース番号ボックスが、押した色で塗られる。
    const cell = screen.getByTestId('cut-view').querySelector('.cut-cell--selected');
    expect(cell).not.toBeNull();
    const space = cell?.querySelector('.cut-cell__space') as HTMLElement;
    expect(space).toHaveStyle({ background: CHECK_COLOR_HEX[5] });
  });

  it('登録済みのサークルの色ボタンは色だけ変える (件数は増えない)', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(main).toHaveTextContent(`チェック ${DEMO_TOTAL} 件`));

    await user.click(within(main).getByRole('button', { name: '色3' }));
    await waitFor(() => expect(main).toHaveTextContent(`チェック ${DEMO_TOTAL + 1} 件`));
    await user.click(within(main).getByRole('button', { name: '色7' }));

    expect(main).toHaveTextContent(`チェック ${DEMO_TOTAL + 1} 件`);
    const cell = screen.getByTestId('cut-view').querySelector('.cut-cell--selected');
    const space = cell?.querySelector('.cut-cell__space') as HTMLElement;
    expect(space).toHaveStyle({ background: CHECK_COLOR_HEX[7] });
  });

  it('チェックリストから外すボタンは選択中のサークルを外す', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(main).toHaveTextContent(`チェック ${DEMO_TOTAL} 件`));

    await user.click(within(main).getByRole('button', { name: '色1' }));
    await waitFor(() => expect(main).toHaveTextContent(`チェック ${DEMO_TOTAL + 1} 件`));

    await user.click(within(main).getByRole('button', { name: 'チェックリストから外す' }));

    await waitFor(() => expect(main).toHaveTextContent(`チェック ${DEMO_TOTAL} 件`));
    const cell = screen.getByTestId('cut-view').querySelector('.cut-cell--selected');
    const space = cell?.querySelector('.cut-cell__space') as HTMLElement;
    expect(space.style.background).toBe('');
  });
});

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
    // 幅 534px はカット 178px x 6 列 の半分 → 50%。
    // 高さ 1012px は 6 行 (253px x 6 = 1518px) の 2/3 → 67%。
    mockViewBox(534, 1012);
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    const zoomInput = within(main).getByRole('textbox', { name: '拡大率' });

    await user.click(within(main).getByRole('button', { name: '幅に合わせる' }));
    await waitFor(() => expect(zoomInput).toHaveValue('50%'));
    expect(main).toHaveTextContent('ズーム 50%');

    await user.click(within(main).getByRole('button', { name: '高さに合わせる' }));
    await waitFor(() => expect(zoomInput).toHaveValue('67%'));
  });

  it('全体を表示 (メニュー) は幅と高さの小さい方に合わせる', async () => {
    mockViewBox(534, 1012);
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');

    await chooseMenu(user, '表示(V)', /^全体を表示/);

    expect(within(main).getByRole('textbox', { name: '拡大率' })).toHaveValue('50%');
  });

  it('元のサイズは 100% に戻し、カットを実寸 178px の列で並べる', async () => {
    mockViewBox(534, 1012);
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');

    await user.click(within(main).getByRole('button', { name: '元のサイズ' }));

    await waitFor(() =>
      expect(within(main).getByRole('textbox', { name: '拡大率' })).toHaveValue('100%'),
    );
    const grid = screen.getByTestId('cut-view').firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(6, 178px)');
  });
});

describe('App — ツールバー (実物の既定の並び)', () => {
  it('既定は 4 本 22 ボタン (基本 / ページ移動 / 表示 / チェック)。ナビゲートバーは出さない', async () => {
    await renderApp();
    const band = await screen.findByTestId('main-toolbar');

    expect(screen.getByTestId('toolbar-group-basic')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-group-jump')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-group-view')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar-group-check')).toBeInTheDocument();
    expect(screen.queryByTestId('toolbar-group-nav')).toBeNull();

    // 実物のツールバー 1 行ぶんのボタン (22 個) + ツールバー内の「色編集」。
    const labels = [...band.querySelectorAll('button')]
      .map((button) => button.getAttribute('aria-label'))
      .filter((label): label is string => label !== null);
    expect(labels.slice(0, 4)).toEqual(['新規作成', 'チェックリストを開く', 'チェックリストの保存', '印刷']);
    expect(labels).toContain('前のページ');
    expect(labels).toContain('ズームイン');
    expect(labels.filter((label) => /^色\d$/.test(label))).toHaveLength(9);
  });
});

describe('App — ナビゲート (前に戻る / 次に進む)', () => {
  it('ナビゲートバーを表示 > ツールバーで出し、戻る / 進む で行き来できる', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');

    // 実物の既定は 4 本 (基本 / ページ移動 / 表示 / チェック)。ナビゲートバーは隠れている。
    expect(within(main).queryByRole('button', { name: '戻る' })).toBeNull();
    await chooseMenu(user, '表示(V)', /^ツールバー/);
    await user.click(await screen.findByRole('menuitem', { name: /ナビゲートバー/ }));
    expect(within(main).getByRole('button', { name: '戻る' })).toBeInTheDocument();
    // 起動時に表示するページ (先頭のサークルのページ) と、最後のページ。
    const firstPage = dummy.circles[0].pageNo;
    const targetPage = Math.max(...dummy.circles.map((circle) => circle.pageNo));
    await waitFor(() => expect(main).toHaveTextContent(`ページ ${firstPage}`));

    await chooseMenu(user, 'ページ移動(J)', /^ページ指定で移動/);
    const input = await screen.findByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, String(targetPage));
    await user.click(screen.getByTestId('goto-page-submit'));
    await waitFor(() => expect(main).toHaveTextContent(`ページ ${targetPage}`));

    await user.click(within(main).getByRole('button', { name: '戻る' }));
    await waitFor(() => expect(main).toHaveTextContent(`ページ ${firstPage}`));

    await user.click(within(main).getByRole('button', { name: '進む' }));
    await waitFor(() => expect(main).toHaveTextContent(`ページ ${targetPage}`));
  });
});

describe('App — 動作設定 (ダイアログ 150) の反映', () => {
  it('シングルクリックでチェックする (1026) を入れると、1 回のクリックでチェックに載る', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(main).toHaveTextContent('チェック 65 件'));

    await toggleSetting(user, 'シングルクリックでチェックする');

    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await user.click(cells[1] as HTMLElement);

    expect(cells[1]).toHaveClass('cut-cell--checked');
    // ステータスバーはマウスの下のサークル情報に切り替わるので、離してから件数を見る。
    await user.unhover(cells[1] as HTMLElement);
    await waitFor(() => expect(main).toHaveTextContent('チェック 66 件'));
  });

  it('選択カーソルをマウスカーソルに追従する (1024) を入れると、かざしたカットが選択される', async () => {
    const { user } = await renderApp();
    await toggleSetting(user, '選択カーソルをマウスカーソルに追従する');

    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await user.hover(cells[2] as HTMLElement);

    expect(cells[2]).toHaveClass('cut-cell--selected');
  });

  it('リターンキーで次のサークルへ移動 (1021) は既定で有効。Enter でチェックして次のカットへ進む', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(main).toHaveTextContent('チェック 65 件'));
    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');

    (cells[0] as HTMLElement).focus();
    await user.keyboard('{Enter}');

    expect(cells[0]).toHaveClass('cut-cell--checked');
    expect(cells[1]).toHaveClass('cut-cell--selected');
    // カーソルが移ったので、ステータスバーのページ表示も変わらない (同じページ内)。
    (cells[0] as HTMLElement).blur();
    await waitFor(() => expect(main).toHaveTextContent('チェック 66 件'));
  });

  it('ページ変更時に左上のカットへカーソルを合わせる (1710) を入れると、ページ移動で先頭が選ばれる', async () => {
    const { user } = await renderApp();
    await waitFor(() => expect(screen.getByTestId('main-window')).toBeInTheDocument());
    await toggleSetting(user, 'ページ変更時に常に左上のサークルカットにカーソルを合わせる');

    // 起動時とは違うページへ移動する (サークルのいるページ)。
    const targetPage = Math.max(...dummy.circles.map((circle) => circle.pageNo));
    await chooseMenu(user, 'ページ移動(J)', /^ページ指定で移動/);
    const input = await screen.findByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, String(targetPage));
    await user.click(screen.getByTestId('goto-page-submit'));

    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await waitFor(() => expect(cells[0]).toHaveClass('cut-cell--selected'));
  });
});

describe('App — Google 検索・用紙・一覧追従・アイコン化・表紙の設定反映', () => {
  it('Google 検索の条件設定 (212) で「いずれかを含む」を選ぶと OR で検索する', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { user } = await renderApp();

    await chooseMenu(user, '検索(S)', /^Google検索の条件設定/);
    const dialog = await screen.findByTestId('google-search-dialog');
    await user.click(within(dialog).getByLabelText('「サークル名」と「執筆者名」のいずれかを含む（OR条件）'));
    // 選択は OK で確定する (キャンセルでは捨てる)。
    await user.click(within(dialog).getByTestId('google-search-ok'));

    await chooseMenu(user, '検索(S)', /^サークルをGoogleで検索/);

    const circle = dummy.circles[0];
    expect(open).toHaveBeenCalledWith(
      `https://www.google.com/search?q=${encodeURIComponent(
        `${circle.circleName} OR ${circle.penName}`,
      )}`,
      '_blank',
      'noreferrer',
    );
  });

  it('用紙サイズ・余白 (203) の設定は印刷プレビューに出る', async () => {
    const { user } = await renderApp();

    // 実物と同じく、用紙・余白は印刷ダイアログ (1538) のボタンから開く。
    await chooseMenu(user, 'ファイル(F)', /^印刷\(P\)/);
    const printDialog = await screen.findByTestId('print-dialog');
    await user.click(within(printDialog).getByTestId('print-page-setup'));
    const setup = await screen.findByTestId('page-setup-dialog');
    const paper = within(setup).getByLabelText('用紙(P)');
    await user.selectOptions(paper, 'A3');
    const left = within(setup).getByLabelText('左(L)');
    await user.clear(left);
    await user.type(left, '60');
    await user.click(within(setup).getByTestId('page-setup-ok'));

    // OK で閉じると印刷ダイアログに戻る。
    expect(screen.queryByTestId('page-setup-dialog')).toBeNull();
    expect(screen.getByTestId('print-dialog')).toBeInTheDocument();
    await user.click(within(printDialog).getByTestId('print-cancel'));

    await chooseMenu(user, 'ファイル(F)', /^印刷詳細設定/);
    const settings = await screen.findByTestId('print-settings-dialog');
    await user.click(within(settings).getByRole('button', { name: 'プレビュー' }));

    const shown = await screen.findByTestId('preview-page-setup');
    expect(shown).toHaveTextContent('用紙 A3 297.0×420.0mm');
    expect(shown).toHaveTextContent('余白 左 60.0');
  });

  it('一覧の追従 (1022) を入れると、選んだサークルの日付とブロックへ一覧が切り替わる', async () => {
    const { user } = await renderApp();
    await toggleSetting(user, '選択サークルのブロックが変わった際にサークル一覧の表示も追従する');

    const targetPage = Math.max(...dummy.circles.map((circle) => circle.pageNo));
    await chooseMenu(user, 'ページ移動(J)', /^ページ指定で移動/);
    const input = await screen.findByTestId('goto-page-input');
    await user.clear(input);
    await user.type(input, String(targetPage));
    await user.click(screen.getByTestId('goto-page-submit'));

    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await user.click(cells[0] as HTMLElement);

    const target = dummy.circles.filter((circle) => circle.pageNo === targetPage)[0];
    const list = screen.getByTestId('list-window');
    await waitFor(() => expect(within(list).getByTestId('list-day')).toHaveValue(String(target.day)));
    await waitFor(() =>
      expect(within(list).getByTestId('list-block')).toHaveValue(String(target.blockId)),
    );
  });

  it('個別窓のアイコン化を連動する (1714) を入れると、1 つ最小化すると子ウィンドウが全部たたまれる', async () => {
    const { user } = await renderApp();
    await toggleSetting(user, '個別窓のアイコン化を連動する');

    const detail = screen.getByTestId('detail-window');
    await user.click(within(detail).getByRole('button', { name: 'Minimize' }));

    await waitFor(() => expect(screen.queryByTestId('detail-window')).not.toBeInTheDocument());
    expect(screen.queryByTestId('list-window')).not.toBeInTheDocument();
    expect(screen.queryByTestId('checklist-window')).not.toBeInTheDocument();
    expect(screen.queryByTestId('map-window')).not.toBeInTheDocument();

    // ウィンドウメニューから戻せる。
    await chooseMenu(user, 'ウィンドウ(W)', /^サークル詳細/);
    expect(await screen.findByTestId('detail-window')).toBeInTheDocument();
  });

  it('起動時に表紙画像を表示する (1711) を入れると表紙ウィンドウが出て、閉じられる', async () => {
    const { user } = await renderApp();
    await toggleSetting(user, '起動時に表紙画像を表示する');

    const cover = await screen.findByTestId('cover-dialog');
    expect(cover).toHaveTextContent(dummy.info.comiketName);

    await user.click(within(cover).getByTestId('cover-close'));
    expect(screen.queryByTestId('cover-dialog')).not.toBeInTheDocument();
  });
});

describe('App — メニューの残り (ファイル / 表示 / ページ移動 / チェックリスト / 検索 / ヘルプ)', () => {
  it('新規作成 (32818) はチェックリストを空にする', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(main).toHaveTextContent('チェック 65 件'));

    await chooseMenu(user, 'ファイル(F)', /^新規作成/);

    await waitFor(() => expect(main).toHaveTextContent('チェック 0 件'));
  });

  it('チェックリストの保存 (32794) は CSV をダウンロードする', async () => {
    const createObjectURL = vi.fn(() => 'blob:ccatalog');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(main).toHaveTextContent('チェック 65 件'));

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
    await waitFor(() => expect(main).toHaveTextContent('チェック 65 件'));

    await chooseMenu(user, 'チェックリスト(A)', /^選択サークルをクリップボードにコピー/);
    await waitFor(() => expect(main).toHaveTextContent('コピーしました'));

    await chooseMenu(user, 'チェックリスト(A)', /^クリップボードからチェックリストにペースト/);

    await waitFor(() => expect(main).toHaveTextContent('チェック 66 件'));
  });

  it('リスト中のカット表示 (32868) で一覧のカットの列を入れ外しできる', async () => {
    const { user } = await renderApp();
    const list = await screen.findByTestId('list-window');
    // 「リスト表示」の既定でサークルカットの列が出ている。
    expect(within(list).getAllByTestId('list-cut').length).toBeGreaterThan(0);

    // 表示 > リスト中のカット表示 (32868) は入っていないので、入れても二重にならない。
    await chooseMenu(user, '表示(V)', /^リスト中のカット表示/);
    await waitFor(() => expect(within(list).getAllByTestId('list-cut').length).toBeGreaterThan(0));
    expect(within(list).getAllByTestId('list-cut')[0]).toHaveAttribute(
      'src',
      expect.stringMatching(/^\/cuts\/\d+\.png$/),
    );
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

  it('ヘルプの目次 (32815) を開き、キーワードで絞り込める', async () => {
    const { user } = await renderApp();

    await chooseMenu(user, 'ヘルプ(H)', /^目次/);
    const help = await screen.findByTestId('help-dialog');
    expect(within(help).getAllByTestId('help-topic').length).toBeGreaterThan(1);

    await user.type(within(help).getByLabelText('キーワード'), 'ジャンル表示');

    await waitFor(() => expect(within(help).getAllByTestId('help-topic')).toHaveLength(1));
    expect(within(help).getByTestId('help-content')).toHaveTextContent('机');
  });

  it('チェックリストの RSS ボタンはダミーの取得結果を出す', async () => {
    const { user } = await renderApp();
    const checklist = await screen.findByTestId('checklist-window');

    await user.click(within(checklist).getByRole('button', { name: 'RSS' }));

    expect(screen.getByTestId('main-window')).toHaveTextContent('RSS情報を取得しました');
  });

  it('標準のチェック色 (サブメニュー) で登録する色が変わる', async () => {
    const { user } = await renderApp();
    await waitFor(() =>
      expect(screen.getByTestId('main-window')).toHaveTextContent('チェック 65 件'),
    );

    await chooseSubmenu(user, 'チェックリスト(A)', /^標準のチェック色/, /^色5$/);

    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await user.dblClick(cells[1] as HTMLElement);

    const space = cells[1].querySelector('.cut-cell__space') as HTMLElement;
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

describe('App — 保存 (元実装の INI / チェックリストファイル相当)', () => {
  it('動作設定は次の起動でも残る', async () => {
    const { user } = await renderApp();
    await toggleSetting(user, 'シングルクリックでチェックする');
    cleanup();

    render(<App startup={false} />);
    await screen.findByTestId('main-window');
    await chooseMenu(user, 'ファイル(F)', /^動作設定\(C\)\.\.\./);

    expect(await screen.findByLabelText('シングルクリックでチェックする (S)')).toBeChecked();
  });

  it('起動時に前回のチェックリストを読み込む (1664) を入れると、次の起動でもチェックリストが残る', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(main).toHaveTextContent('チェック 65 件'));
    await toggleSetting(user, '起動時に前回使用したチェックリストを自動的に読み込む');

    // 1 件登録して 66 件にする。
    const cells = screen.getByTestId('cut-view').querySelectorAll('.cut-cell');
    await user.dblClick(cells[1] as HTMLElement);
    expect(cells[1]).toHaveClass('cut-cell--checked');
    // ステータスバーはマウスの下のサークル情報に切り替わるので、離してから件数を見る。
    await user.unhover(cells[1] as HTMLElement);
    await waitFor(() => expect(main).toHaveTextContent('チェック 66 件'));
    cleanup();

    render(<App startup={false} />);

    // 読み込んだチェックリストがあるので、デモ用のダミー登録は入れ直さない。
    await waitFor(() =>
      expect(screen.getByTestId('main-window')).toHaveTextContent('チェック 66 件'),
    );
  });
});

describe('App — 動作設定 (プロパティシート)', () => {
  /** 動作設定を開いて、指定したページを選ぶ。 */
  async function openPage(user: UserEvent, label: string) {
    await chooseMenu(user, 'ファイル(F)', /^動作設定\(C\)\.\.\./);
    const dialog = await screen.findByTestId('preferences-dialog');
    if (label !== '動作オプション') {
      // タブは <li role="tab"> の中の <a> が押せる (ライブラリの実装)。
      await user.click(within(dialog).getByRole('link', { name: label }));
    }
    return dialog;
  }

  it('元実装と同じ 4 ページを持ち、ウィンドウは 510 x 670 (ラベルが折り返さない幅)', async () => {
    const { user } = await renderApp();
    const dialog = await openPage(user, '動作オプション');

    expect(within(dialog).getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      '動作オプション',
      'パス設定',
      'リスト表示',
      'チェック色',
    ]);
    const root = dialog.matches('.window') ? dialog : (dialog.querySelector('.window') as HTMLElement);
    expect(root.style.width).toBe('510px');
    expect(root.style.height).toBe('670px');
  });

  it('各ページに元ダイアログの項目が並ぶ', async () => {
    const { user } = await renderApp();

    // ② パス設定 (元ダイアログ 191)
    let dialog = await openPage(user, 'パス設定');
    expect(within(dialog).getByLabelText('自動検索する(F)')).toBeChecked();
    expect(within(dialog).getByLabelText('指定場所から読み込む(R)')).not.toBeChecked();
    expect(within(dialog).getByLabelText('画像データの場所')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('標準(S)')).toBeChecked();
    expect(within(dialog).getByLabelText('ブラウザの場所')).toBeInTheDocument();
    await user.click(within(dialog).getByTestId('preferences-ok'));

    // ③ リスト表示 (元ダイアログ 210)
    dialog = await openPage(user, 'リスト表示');
    expect(within(dialog).getByText('チェックリスト 表示項目 (C)')).toBeInTheDocument();
    expect(within(dialog).getByText('サークル一覧 表示項目 (L)')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('button', { name: '前へ移動(F)' })).toHaveLength(1);
    expect(within(dialog).getAllByRole('button', { name: '後へ移動(B)' })).toHaveLength(1);
    expect(within(dialog).getAllByRole('button', { name: '前へ移動(P)' })).toHaveLength(1);
    expect(within(dialog).getAllByRole('button', { name: '後へ移動(N)' })).toHaveLength(1);
    expect(within(dialog).getByTestId('preferences-list-default')).toBeInTheDocument();
    await user.click(within(dialog).getByTestId('preferences-ok'));

    // ④ チェック色 (元ダイアログ 149)
    dialog = await openPage(user, 'チェック色');
    expect(within(dialog).getByLabelText('編集するチェック色')).toHaveValue('standard');
    expect(within(dialog).getByTestId('display-color-1')).toBeInTheDocument();
    expect(within(dialog).getByTestId('print-color-9')).toBeInTheDocument();
    expect(within(dialog).getByLabelText('色の名称')).toHaveValue('');
    expect(within(dialog).getByTestId('preferences-color-reset')).toBeEnabled();
    // 標準の設定値を編集中は Mac 版の既定色が無いので使えない。
    expect(within(dialog).getByTestId('preferences-color-mac-reset')).toBeDisabled();
  });

  it('パス設定で「指定場所から読み込む」にすると、画像の取得元が変わる', async () => {
    const { user } = await renderApp();
    const dialog = await openPage(user, 'パス設定');

    await user.click(within(dialog).getByLabelText('指定場所から読み込む(R)'));
    await user.clear(within(dialog).getByLabelText('画像データの場所'));
    await user.type(within(dialog).getByLabelText('画像データの場所'), 'https://cdn.example.com/img');
    await user.click(within(dialog).getByTestId('preferences-ok'));

    await waitFor(() =>
      expect(screen.getByTestId('cut-view').querySelector('img')).toHaveAttribute(
        'src',
        expect.stringMatching(/^https:\/\/cdn\.example\.com\/img\/cuts\/\d+\.png$/),
      ),
    );
  });

  it('リスト表示で列を外すとチェックリストの列が消える', async () => {
    const { user } = await renderApp();
    const checklist = await screen.findByTestId('checklist-window');
    expect(within(checklist).getByRole('columnheader', { name: 'メモ' })).toBeInTheDocument();

    const dialog = await openPage(user, 'リスト表示');
    await user.click(within(dialog).getByLabelText('メモ'));
    await user.click(within(dialog).getByTestId('preferences-ok'));

    await waitFor(() =>
      expect(within(checklist).queryByRole('columnheader', { name: 'メモ' })).not.toBeInTheDocument(),
    );
    // サークル名は外せない (5LIST.HTM)。
    expect(within(checklist).getByRole('columnheader', { name: 'サークル名' })).toBeInTheDocument();
  });

  it('チェック色で表示色を変えると、チェックしたカットの色が変わる', async () => {
    const { user } = await renderApp();
    const main = screen.getByTestId('main-window');
    await waitFor(() => expect(main).toHaveTextContent('チェック 65 件'));
    // 選択中のサークルを色1 でチェックする。
    await user.click(within(main).getByRole('button', { name: '色1' }));
    await waitFor(() => expect(main).toHaveTextContent('チェック 66 件'));

    const dialog = await openPage(user, 'チェック色');
    await user.click(within(dialog).getByTestId('display-color-1'));
    const palette = await screen.findByTestId('color-palette-dialog');
    await user.click(within(palette).getByRole('button', { name: '#ffffff' }));
    await user.click(within(palette).getByTestId('palette-ok'));
    await user.click(within(dialog).getByTestId('preferences-ok'));

    const space = screen
      .getByTestId('cut-view')
      .querySelector('.cut-cell--selected .cut-cell__space') as HTMLElement;
    await waitFor(() => expect(space).toHaveStyle({ background: '#ffffff' }));
  });
});
