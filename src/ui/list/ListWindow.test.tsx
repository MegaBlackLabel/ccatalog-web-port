import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Circle, Genre } from '../../domain/types';
import { CHECK_COLOR_HEX, CHECK_COLOR_IDS, checkSwatchIcon } from '../check-colors';
import { TOOLBAR_ICONS } from '../main/toolbar-icons';
import { ListWindow } from './ListWindow';
import type { ListWindowProps } from './ListWindow';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const GENRES: Genre[] = [{ id: 14, name: '創作(少女)', code: 112 }];
/** 色1〜色9 の名称 (index 0 が「色1」)。 */
const COLOR_NAMES = ['赤', '橙', '黄', '緑', '水', '青', '紫', '桃', '灰'];

function makeCircle(id: number, patch: Partial<Circle> = {}): Circle {
  return {
    id,
    comiketNo: 96,
    pageNo: 100 + id,
    cutIndex: 1,
    day: 1,
    blockId: 1,
    spaceNo: id,
    spaceNoSub: 0,
    genreId: 14,
    circleName: `サークル${id}`,
    circleKana: `さーくる${id}`,
    penName: `ペン${id}`,
    bookName: `本${id}`,
    url: '',
    mailAddr: '',
    description: '',
    memo: '',
    updateId: 0,
    updateData: '',
    circlems: '',
    rss: '',
    updateFlag: 0,
    twitter: '',
    pixiv: '',
    ...patch,
  };
}

const CIRCLES: Circle[] = [
  makeCircle(1, {
    circleName: 'サークルA',
    circleKana: 'さーくるA',
    penName: '執筆者A',
    bookName: '発行誌A',
    spaceNo: 5,
    spaceNoSub: 0,
    day: 1,
    genreId: 14,
  }),
  makeCircle(2, {
    circleName: 'サークルB',
    circleKana: 'さーくるB',
    penName: '執筆者B',
    bookName: '発行誌B',
    spaceNo: 12,
    spaceNoSub: 1,
    day: 0,
    genreId: 999,
  }),
];

/** 表示モードの検証用: 日付・ブロック・読みの 1 文字目がひと通り揃ったサークル。 */
const MODE_CIRCLES: Circle[] = [
  makeCircle(11, { circleName: 'あ行1', circleKana: 'あいうえお', day: 1, blockId: 1 }),
  makeCircle(12, { circleName: 'か行1', circleKana: 'かきくけこ', day: 1, blockId: 1 }),
  makeCircle(13, { circleName: 'あ行B', circleKana: 'あいうえお', day: 1, blockId: 2 }),
  makeCircle(14, { circleName: 'さ行2', circleKana: 'さしすせそ', day: 2, blockId: 1 }),
  makeCircle(15, {
    circleName: '抽選漏れ1',
    circleKana: 'たりらり',
    day: 0,
    blockId: 0,
    spaceNo: 0,
  }),
];

function renderList(overrides: Partial<ListWindowProps> = {}) {
  const props: ListWindowProps = {
    circles: CIRCLES,
    // 既定は「検索を実行した後」の状態 (アプリは検索結果を一覧に出す)。
    results: CIRCLES,
    genres: GENRES,
    selectedId: null,
    status: '該当 2 件',
    onSelect: vi.fn(),
    onOpenDetail: vi.fn(),
    onSearch: vi.fn(),
    onOpenSearch: vi.fn(),
    locked: false,
    onToggleLock: vi.fn(),
    colorNames: COLOR_NAMES,
    onSetColor: vi.fn(),
    onRemove: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  render(<ListWindow {...props} />);
  return { user, props, list: screen.getByTestId('list-window') };
}

/** リストに出ているサークル名 (ヘッダー行を除く)。 */
function listedNames(list: HTMLElement): string[] {
  // 先頭の列は「リスト表示」の設定で変わるので、サークル名の列をヘッダーから探す。
  const headers = within(list).getAllByRole('columnheader');
  const nameIndex = headers.findIndex((cell) => cell.textContent === 'サークル名');
  return within(list)
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.querySelectorAll('td')[nameIndex]?.textContent ?? '');
}

/** 指定した文字列を含むリストの行。 */
function rowOf(text: string): HTMLElement {
  const row = screen.getByText(text).closest('tr');
  if (!row) throw new Error(`${text} の行が見つかりません`);
  return row;
}

/** セレクトの選択肢のラベル。 */
function optionLabels(element: HTMLElement): (string | null)[] {
  return within(element)
    .getAllByRole('option')
    .map((option) => option.textContent);
}

/**
 * ツールバーの項目 1 個の幅。コンボとラベルは実測 (ui_capture/windows.tsv の
 * 一覧ウィンドウの子コントロール: 表示モードのラベル 72 / コンボ 134、日付 64、
 * インデックス 40、簡易検索のエディット 160)、ボタンは実物のツールバー ボタン相当
 * (検索・リストロック・チェック解除はアイコンだけの 22x22)。
 * 色 1〜9 のパレットは 22x22 のボタン 9 個 + 隙間 1px (ui/main/toolbar-groove.ts の
 * TOOLBAR_PALETTE_STYLE。実測のピッチ 23px) = 206
 * (チェックリストと同じく見出しの文字は持たない)。
 * 区切り線のぶん (8px) は項目の外側なので ListWindow 側が足して段詰めする。
 */
const ITEM_WIDTHS: Record<string, number> = {
  mode: 206,
  day: 64,
  blockIndex: 40,
  search: 22,
  quick: 160,
  lock: 22,
  color: 206,
  remove: 22,
};

/**
 * jsdom にはレイアウトが無いので、ツールバー帯と項目の幅だけを実測値に差し替える
 * (ListWindow は計測した幅で項目を段に詰める)。他の要素は 0x0 になる。
 */
function mockToolbarWidths(stripWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const testId = this.getAttribute('data-testid') ?? '';
    const width =
      testId === 'list-toolbar'
        ? stripWidth
        : testId.startsWith('list-toolbar-item-')
          ? (ITEM_WIDTHS[testId.slice('list-toolbar-item-'.length)] ?? 0)
          : 0;
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: width,
      bottom: 0,
      width,
      height: 26,
      toJSON: () => ({}),
    } as DOMRect;
  });
}

/** ツールバーの段に入っている項目の ID (data-testid の接尾辞)。 */
function rowItems(row: HTMLElement): string[] {
  return [...row.querySelectorAll('[data-testid^="list-toolbar-item-"]')].map((item) =>
    (item.getAttribute('data-testid') ?? '').replace('list-toolbar-item-', ''),
  );
}

describe('ListWindow', () => {
  it('サークル一覧の 7 列とステータスバーを表示する', () => {
    const { list } = renderList();

    expect(within(list).getByText('サークル一覧')).toBeInTheDocument();
    // 並びは実物のダイアログ 210 (リスト表示) の項目順。
    expect(within(list).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      '日付',
      '位置',
      'ジャンル',
      'カット',
      'サークル名',
      '読み',
      '執筆者',
      '発行誌',
    ]);
    expect(within(list).getByText('該当 2 件')).toBeInTheDocument();
    expect(within(list).getByText('表示 2 件')).toBeInTheDocument();
  });

  it('1 行 1 サークルで日付・ジャンル・スペース番号を表示する', () => {
    const { list } = renderList();

    // ヘッダー行 + サークル数。
    expect(within(list).getAllByRole('row')).toHaveLength(CIRCLES.length + 1);

    expect(within(rowOf('サークルA')).getByText('さーくるA')).toBeInTheDocument();
    expect(within(rowOf('サークルA')).getByText('5a')).toBeInTheDocument();
    expect(within(rowOf('サークルA')).getByText('1日目')).toBeInTheDocument();
    expect(within(rowOf('サークルA')).getByText('創作(少女)')).toBeInTheDocument();
    expect(within(rowOf('サークルB')).getByText('12b')).toBeInTheDocument();
    expect(within(rowOf('サークルB')).getByText('抽選漏れ')).toBeInTheDocument();
    // 未知のジャンル ID はそのまま出す。
    expect(within(rowOf('サークルB')).getByText('999')).toBeInTheDocument();
  });

  it('selectedId の行を選択状態にする', () => {
    const { list } = renderList({ selectedId: CIRCLES[1].id });
    const rows = within(list).getAllByRole('row');

    expect(rows[1]).not.toHaveClass('highlighted');
    expect(rows[2]).toHaveClass('highlighted');
  });

  it('行のクリックで数値 ID を選択し、ダブルクリックで詳細を開く', async () => {
    const { user, props, list } = renderList();
    const rows = within(list).getAllByRole('row');

    await user.click(rows[2]);
    expect(props.onSelect).toHaveBeenCalledWith(CIRCLES[1].id);

    await user.dblClick(rows[2]);
    expect(props.onOpenDetail).toHaveBeenCalledWith(CIRCLES[1].id);
  });

  it('サークルの無いときはヘッダーだけを表示する', () => {
    const { list } = renderList({ circles: [], results: null });

    expect(within(list).getAllByRole('row')).toHaveLength(1);
  });

  it('ツールバーは幅に入りきらない項目を次の段へ回す (既定幅 714px では 2 段)', () => {
    // アプリのワイド配置の一覧ウィンドウは 714px (App.tsx の layout)。
    mockToolbarWidths(714);
    renderList();

    const rows = within(screen.getByTestId('list-toolbar')).getAllByTestId('list-toolbar-row');
    expect(rows).toHaveLength(2);
    // ソートのロックは色パレットと同じ段の先頭。1 段目は簡易検索まで。
    expect(rowItems(rows[0])).toEqual(['mode', 'day', 'blockIndex', 'search', 'quick']);
    expect(rowItems(rows[1])).toEqual(['lock', 'color', 'remove']);
    // 区切り線は 1 段目は [検索] の前だけ。2 段目は先頭のロックには出さず、色とチェック解除の前。
    expect(within(rows[0]).getAllByTestId('list-toolbar-separator')).toHaveLength(1);
    expect(within(rows[1]).getAllByTestId('list-toolbar-separator')).toHaveLength(2);
  });

  it('幅が広ければツールバーは 1 段に収める', () => {
    mockToolbarWidths(1200);
    renderList();

    const rows = within(screen.getByTestId('list-toolbar')).getAllByTestId('list-toolbar-row');
    expect(rows).toHaveLength(1);
    expect(rowItems(rows[0])).toHaveLength(8);
  });

  it('2 段のときは段の間に凹んだ溝 (銀 → 暗 #808080 → 明 #ffffff → 銀 2px) を入れる', () => {
    mockToolbarWidths(714);
    renderList();

    const strip = screen.getByTestId('list-toolbar');
    const rows = within(strip).getAllByTestId('list-toolbar-row');

    expect(rows).toHaveLength(2);
    // 帯はライブラリの ToolbarBand (CSS Modules: bandContainer)、段はその直下に並ぶ。
    expect(strip.className).toContain('bandContainer');
    expect(rows[0].className).toContain('bandRow');
    expect(rows[1].className).toContain('bandRow');
    // 段と段の間の溝 (横 Groove) はライブラリが挿す。見た目 (銀 / 暗 / 明 / 銀) はライブラリ CSS が持つ。
    const children = Array.from(strip.children);
    expect(children).toHaveLength(3);
    expect(children[1]).toHaveAttribute('role', 'separator');
    expect(children[1]).toHaveAttribute('aria-orientation', 'horizontal');
    expect(children[1]).toHaveAttribute('aria-hidden', 'true');
    // 段の中の左右の余白は共通 (アプリ inline の 2px)。
    expect(rows[0].style.paddingLeft).toBe('2px');
    expect(rows[1].style.paddingLeft).toBe('2px');
  });

  it('1 段のときは段の間の Groove を出さない', () => {
    mockToolbarWidths(1200);
    renderList();

    const strip = screen.getByTestId('list-toolbar');

    // 帯の直下は段 1 個だけで、横 Groove は挿さらない。
    const children = Array.from(strip.children);
    expect(children).toHaveLength(1);
    expect(children[0].className).toContain('bandRow');
    expect(strip.querySelector('[aria-orientation="horizontal"]')).toBeNull();
  });


  it('ツールバーはサークルカット ウィンドウと同じ溝 (上辺の外の暗 + 上辺の明 1px + silver 1px + 下辺の暗 2px) を持つ', () => {
    renderList();

    const toolbar = screen.getByTestId('list-toolbar');

    // 溝 (上辺の外の暗 + 上辺の明 1px + silver 1px + 下辺の暗 2px) はライブラリの
    // ToolbarBand の CSS Modules (bandContainer) が持つ。jsdom には CSS が無いので
    // 見た目は element.style には出ない = サークルカット ウィンドウと同じ帯を使っていることで確かめる。
    expect(toolbar.className).toContain('bandContainer');
  });

  it('ツールバーの並びは 表示モード | 日付 | ブロック | 区切り | 検索 | 簡易検索 | 区切り | リストロック | 区切り | 色1〜9 | 区切り | チェック解除', () => {
    renderList();

    const row = screen.getByTestId('list-toolbar-row');
    const slots = Array.from(row.children).map((child) => {
      const testId = child.getAttribute('data-testid') ?? '';
      return testId === 'list-toolbar-separator'
        ? '区切り'
        : testId.replace('list-toolbar-item-', '');
    });

    expect(slots).toEqual([
      'mode',
      'day',
      'blockIndex',
      '区切り',
      'search',
      'quick',
      '区切り',
      'lock',
      '区切り',
      'color',
      '区切り',
      'remove',
    ]);
  });

  it('アイコン ボタンの間の区切り線はチェックリストと同じ 1px の溝にする', () => {
    renderList();

    const separators = screen.getAllByTestId('list-toolbar-separator');

    // [表示モード〜ブロック] | [検索・簡易検索] | [リストロック] | 色1〜9 | [チェック解除] の 4 か所。
    expect(separators).toHaveLength(4);
    for (const separator of separators) {
      // 1px の溝 (暗 + 明の縦線を高さ 18px で引く) はライブラリの Groove が持つ。
      // jsdom には CSS が無いので、種別 (role / 向き / 隠す) とアプリ inline の余白だけを確かめる。
      expect(separator).toHaveAttribute('role', 'separator');
      expect(separator).toHaveAttribute('aria-orientation', 'vertical');
      expect(separator).toHaveAttribute('aria-hidden', 'true');
      expect(separator.style.flex).toBe('0 0 auto');
      expect(separator.style.margin).toBe('0px 3px');
    }
  });

  it.each([
    ['検索', TOOLBAR_ICONS.search, 'サークルを検索'],
    ['リストロック', TOOLBAR_ICONS.listLock, 'リストのソートのロック'],
    ['チェック解除', TOOLBAR_ICONS.checkRemove, 'チェックリストから外す'],
  ])('「%s」は実物のアイコンだけのボタンにする (文字を持たない)', (name, icon, title) => {
    renderList({ selectedId: CIRCLES[0].id });

    const button = screen.getByRole('button', { name });
    const image = button.querySelector('img');

    // アイコンだけなので、名前は文字ではなく aria-label で付ける。
    expect(button.textContent).toBe('');
    expect(button).toHaveAttribute('aria-label', name);
    expect(button).toHaveAttribute('title', title);
    // 実物のツールバー ボタンと同じ 22x22。
    expect(button).toHaveStyle({ width: '22px', height: '22px' });
    // チェックリストの ICON_BUTTON_STYLE と同じ平らな見た目 (98.css の浮き出しを打ち消す)。
    expect(button.style.borderStyle).toBe('solid');
    expect(button.style.borderWidth).toBe('1px');
    expect(button.style.boxSizing).toBe('border-box');
    expect(button.style.boxShadow).toBe('none');
    expect(image).toHaveAttribute('src', icon);
    expect(image).toHaveAttribute('aria-hidden', 'true');
  });

  it('色 1〜9 のボタンもサークルカット ウィンドウと同じ 22x22 のアイコンだけにする', () => {
    renderList({ selectedId: CIRCLES[0].id });

    for (const color of CHECK_COLOR_IDS) {
      const name = COLOR_NAMES[color - 1];
      const button = screen.getByRole('button', { name });

      // 文字は出さず、名前は aria-label と title (ツールチップ) に持たせる。
      expect(button.textContent).toBe('');
      expect(button).toHaveAttribute('aria-label', name);
      expect(button).toHaveAttribute('title', name);
      expect(button).toHaveAttribute('data-color', String(color));
      // サークルカット ウィンドウの色ボタンと同じ 22x22 + 同じアイコン (ui/check-colors.ts)。
      expect(button).toHaveStyle({ width: '22px', height: '22px' });
      expect(button.querySelector('img')?.getAttribute('src')).toBe(
        checkSwatchIcon(CHECK_COLOR_HEX[color]),
      );
    }
  });

  it('ツールバーに一覧の操作要素を並べる (色の見出しの文字は持たない)', () => {
    renderList();

    expect(screen.getByTestId('list-mode')).toBeInTheDocument();
    expect(screen.getByTestId('list-day')).toBeInTheDocument();
    expect(screen.getByTestId('list-block')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
    expect(screen.getByTestId('list-quick-search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'リストロック' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'チェック解除' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '赤' })).toBeInTheDocument();
    // 実物と同じく色の見出しの文字は出さない (チェックリストと同じ)。
    expect(screen.queryByText('チェック色変更')).not.toBeInTheDocument();
  });

  it('表示モード・日付・ブロック・インデックスの選択肢をデータから作る', () => {
    renderList({ circles: MODE_CIRCLES, results: null });

    expect(optionLabels(screen.getByTestId('list-mode'))).toEqual([
      '日付／ブロック指定',
      '日付／インデックス',
      '抽選漏れサークル',
      '検索結果',
    ]);
    // 抽選漏れ (day 0) は専用のモードで見るので日付には出さない。
    expect(optionLabels(screen.getByTestId('list-day'))).toEqual(['1日目', '2日目']);
    expect(optionLabels(screen.getByTestId('list-block'))).toEqual(['A', 'B']);
  });

  it('既定は「日付／ブロック指定」で、最初の日付とブロックのサークルを出す', () => {
    const { list } = renderList({ circles: MODE_CIRCLES, results: null });

    expect(screen.getByTestId('list-mode')).toHaveValue('dateBlock');
    expect(listedNames(list)).toEqual(['あ行1', 'か行1']);
  });

  it('日付とブロックを選ぶとその組み合わせだけになる', async () => {
    const { user, list } = renderList({ circles: MODE_CIRCLES, results: null });

    await user.selectOptions(screen.getByTestId('list-block'), '2');
    expect(listedNames(list)).toEqual(['あ行B']);

    // ブロックは日付ごとに違うので、日付を変えるとその日のブロックに切り替わる。
    await user.selectOptions(screen.getByTestId('list-day'), '2');
    expect(optionLabels(screen.getByTestId('list-block'))).toEqual(['A']);
    expect(listedNames(list)).toEqual(['さ行2']);
  });

  it('「日付／インデックス」は読みの 1 文字目が同じかな行を出す', async () => {
    const { user, list } = renderList({ circles: MODE_CIRCLES, results: null });

    await user.selectOptions(screen.getByTestId('list-mode'), 'dateIndex');
    expect(optionLabels(screen.getByTestId('list-index'))).toEqual(['あ', 'か']);
    expect(listedNames(list)).toEqual(['あ行1', 'あ行B']);

    await user.selectOptions(screen.getByTestId('list-index'), 'か');
    expect(listedNames(list)).toEqual(['か行1']);

    await user.selectOptions(screen.getByTestId('list-day'), '2');
    expect(listedNames(list)).toEqual(['さ行2']);
  });

  it('「抽選漏れサークル」にすると day 0 のサークルだけになる', async () => {
    const { user, list } = renderList({ circles: MODE_CIRCLES, results: null });

    await user.selectOptions(screen.getByTestId('list-mode'), 'lotteryMiss');

    expect(listedNames(list)).toEqual(['抽選漏れ1']);
    expect(within(list).getByText('抽選漏れ')).toBeInTheDocument();
    // 抽選漏れ以外のモードで使うボックスは選べない。
    expect(screen.getByTestId('list-day')).toBeDisabled();
    expect(screen.getByTestId('list-block')).toBeDisabled();
  });

  it('「検索結果」は直前の検索結果を出し、検索前は空にする', async () => {
    const { user, list } = renderList({ circles: MODE_CIRCLES, results: null });

    await user.selectOptions(screen.getByTestId('list-mode'), 'searchResults');

    expect(listedNames(list)).toEqual([]);
  });

  it('検索結果が届くと表示モードを「検索結果」に切り替える', () => {
    const { list } = renderList({ circles: MODE_CIRCLES, results: [MODE_CIRCLES[3]] });

    expect(screen.getByTestId('list-mode')).toHaveValue('searchResults');
    expect(listedNames(list)).toEqual(['さ行2']);
  });

  it('簡易検索はリターンキーでキーワードを渡して検索する', async () => {
    const { user, props } = renderList();
    const box = screen.getByTestId('list-quick-search');

    await user.type(box, 'サークルA');
    expect(props.onSearch).not.toHaveBeenCalled();

    await user.type(box, '{Enter}');
    expect(props.onSearch).toHaveBeenCalledWith('サークルA');
  });

  it('検索ボタンは検索ダイアログを開く', async () => {
    const { user, props } = renderList();

    await user.click(screen.getByRole('button', { name: '検索' }));

    expect(props.onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it('リストロックは押下状態を aria-pressed で示し、クリックで onToggleLock を呼ぶ', async () => {
    const { user, props } = renderList({ locked: true });
    const lock = screen.getByRole('button', { name: 'リストロック' });

    expect(lock).toHaveAttribute('aria-pressed', 'true');

    await user.click(lock);
    expect(props.onToggleLock).toHaveBeenCalledTimes(1);
  });

  it('ロックされていないときは aria-pressed を false にする', () => {
    renderList({ locked: false });

    expect(screen.getByRole('button', { name: 'リストロック' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('選択が無いときは「チェック解除」と色ボタンを押せなくする', () => {
    renderList();

    expect(screen.getByRole('button', { name: 'チェック解除' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '赤' })).toBeDisabled();
  });

  it('複数選択した行の ID を色ボタンと「チェック解除」にまとめて渡す', async () => {
    const { user, props, list } = renderList();
    const rows = within(list).getAllByRole('row');

    await user.click(rows[1]);
    await user.keyboard('{Control>}');
    await user.click(rows[2]);
    await user.keyboard('{/Control}');

    // colorNames[2] = 黄 → 色3。
    await user.click(screen.getByRole('button', { name: '黄' }));
    expect(props.onSetColor).toHaveBeenCalledWith([1, 2], 3);

    await user.click(screen.getByRole('button', { name: 'チェック解除' }));
    expect(props.onRemove).toHaveBeenCalledWith([1, 2]);
  });

  it('色名が無いときは「色N」の名前で色ボタンを出す', async () => {
    const { user, props } = renderList({ colorNames: [], selectedId: CIRCLES[0].id });

    await user.click(screen.getByRole('button', { name: '色9' }));

    expect(props.onSetColor).toHaveBeenCalledWith([1], 9);
  });
});
