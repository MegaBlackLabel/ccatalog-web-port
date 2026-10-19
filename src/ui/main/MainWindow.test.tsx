import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CCATALOG_MENUS } from '../menu/menu-defs';
import { CHECK_COLOR_HEX, CHECK_COLOR_IDS, checkSwatchIcon } from '../check-colors';
import type { CheckColor } from '../../app/catalog-state';
import type { Circle } from '../../domain/types';
import { CircleCutView } from './CircleCutView';
import { MainWindow } from './MainWindow';
import type { MainWindowJumpOptions, MainWindowProps } from './MainWindow';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});


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
  makeCircle(1),
  makeCircle(2, { spaceNoSub: 1 }),
  makeCircle(3, { spaceNo: 12 }),
];

const NO_CHECKED: ReadonlySet<number> = new Set<number>();
/** チェック色 (既定は空)。 */
const NO_COLORS = new Map<number, CheckColor>();

/**
 * 元実装のツールバー (ヘルプ 1WINDOW/8TOOLBAR.HTM)。左から 5 本のドッキング
 * ツールバーで、グループの中にはツールバー本体のボタンのほかに、実物の
 * ToolbarWindow32 の子コントロール (ComboBox / Edit / Button) も並ぶ。
 */
const TOOLBAR_GROUPS: readonly {
  id: string;
  label: string;
  items: readonly string[];
  extra: readonly string[];
}[] = [
  {
    id: 'basic',
    label: '基本ツールバー',
    items: ['新規作成', 'チェックリストを開く', 'チェックリストの保存', '印刷'],
    extra: [],
  },
  {
    id: 'jump',
    label: 'ページ移動ツールバー',
    items: ['前のページ', '次のページ'],
    extra: ['日付ジャンプ', 'ホールジャンプ', 'インデックスジャンプ'],
  },
  {
    // 実物は 1 本のツールバーで、中に [ズームアウト][拡大率の Edit][ズームイン]… が並ぶ。
    // Web 版は Toolbar の item に任意ノードを置けないので、Edit を挟んで 2 本に分ける
    // (2 本目は aria-labelledby が同じ「表示ツールバー」。グリップは CSS で消す)。
    id: 'view',
    label: '表示ツールバー',
    items: ['ズームアウト'],
    extra: ['拡大率', 'ズームイン', '幅に合わせる', '高さに合わせる', '元のサイズ', 'アンチエイリアス'],
  },
  {
    id: 'check',
    label: 'チェックツールバー',
    items: ['色1', '色2', '色3', '色4', '色5', '色6', '色7', '色8', '色9', 'チェックリストから外す'],
    extra: ['色編集'],
  },
  {
    id: 'nav',
    label: 'ナビゲートツールバー',
    items: ['戻る', '進む'],
    extra: [],
  },
];

/** ツールバー本体の並び (グループの間はセパレータ)。 */
const TOOLBAR_SEQUENCE: readonly string[] = TOOLBAR_GROUPS.flatMap((group, index) =>
  index === 0 ? [...group.items] : ['separator', ...group.items],
);

/**
 * 実測 (ui_capture/windows.tsv): ドッキング ツールバー 1 本の幅。
 * 実物のメインウィンドウは 900x629 で、この幅では 5 本が 2 段になる。
 */
const GROUP_WIDTHS: Record<string, number> = {
  basic: 115,
  jump: 235,
  view: 197,
  check: 319,
  nav: 57,
};

/**
 * jsdom にはレイアウトが無いので、ツールバー帯と各グループの幅だけを実測値に
 * 差し替える (MainWindow は計測した幅でグループを段に詰める)。
 * 他の要素は 0x0 になるので、カットビューなどは原寸のまま描かれる。
 */
function mockToolbarWidths(stripWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const testId = this.getAttribute('data-testid') ?? '';
    const width =
      testId === 'main-toolbar'
        ? stripWidth
        : testId.startsWith('toolbar-group-')
          ? (GROUP_WIDTHS[testId.slice('toolbar-group-'.length)] ?? 0)
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

/** グループ (実物のツールバー 1 本) の中のコントロールを DOM の並びで返す。 */
function groupControls(group: HTMLElement): (string | null)[] {
  return [...group.querySelectorAll('button, select, input')].map((control) =>
    control.getAttribute('aria-label'),
  );
}

/** ツールバー本体の子 (グリップは aria-hidden なので読み飛ばす) を DOM の並びで返す。 */
function toolbarSlots(group: HTMLElement): string[] {
  const toolbar = group.querySelector('[role="toolbar"]');
  if (!toolbar) return [];
  return [...toolbar.children].slice(1).map((child) => {
    if (child.getAttribute('role') === 'separator') return 'separator';
    const control = child.tagName === 'BUTTON' ? child : child.querySelector('button, select, input');
    return control?.getAttribute('aria-label') ?? '';
  });
}

/** アプリ側 (App) がカタログデータから作って渡すジャンプの選択肢。 */
const JUMP_OPTIONS: MainWindowJumpOptions = {
  days: [
    { label: '金曜日', command: 34000 },
    { label: '土曜日', command: 34001 },
  ],
  halls: [{ label: '西2壁', command: 34100 }],
  indexes: [{ label: 'あ', command: 34300 }],
};

function renderMain(overrides: Partial<MainWindowProps> = {}) {
  const props: MainWindowProps = {
    title: 'コミックマーケット カタロム - 新規チェックリスト',
    circles: CIRCLES,
    pageNo: 3,
    selectedId: null,
    message: '',
    checkedIds: NO_CHECKED,
    colorById: NO_COLORS,
    jumpOptions: JUMP_OPTIONS,
    lastPage: 200,
    zoom: 100,
    onCommand: vi.fn(),
    onZoomChange: vi.fn(),
    onSelect: vi.fn(),
    onOpenDetail: vi.fn(),
    onPageChange: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup({ delay: null });
  render(<MainWindow {...props} />);
  return { user, props, main: screen.getByTestId('main-window') };
}

describe('MainWindow', () => {
  it('メニューバーに元実装のトップレベルメニューをすべて表示する', () => {
    const { main } = renderMain();
    const menubar = within(main).getByRole('menubar');

    expect(within(menubar).getAllByRole('menuitem')).toHaveLength(CCATALOG_MENUS.length);
    for (const menu of CCATALOG_MENUS) {
      expect(within(menubar).getByRole('menuitem', { name: menu.label })).toBeInTheDocument();
    }
  });

  it('メニューバーとツールバー帯の間に区切り線を入れる (参照画像と同じ溝)', () => {
    const { main } = renderMain();
    const menubar = within(main).getByRole('menubar');
    const strip = within(main).getByTestId('main-toolbar');

    // メニューバーの下辺は銀の余白 1px (アプリ側 MENU_BAR_STYLE の inline)。
    expect(menubar.style.borderBottom).toBe('');
    expect(menubar.style.padding).toBe('1px 0px');
    // 帯の外周の溝 (上辺の外の暗 1px / 上辺の明 1px / 明と暗の間の silver 1px /
    // 下辺の暗 2px) と z-index / position / isolation はライブラリの ToolbarBand が持つ。
    // jsdom は CSS を読まないので inline style には出ない。ここでは溝を担うのが
    // ライブラリの帯であることだけを確かめる。
    expect(strip.className).toContain('bandContainer');
  });

  it('ツールバーが 2 段になると段と段の間に凹んだ溝 (銀 → 暗 → 明 → 銀) を入れる', () => {
    mockToolbarWidths(900);
    const { main } = renderMain();
    const strip = within(main).getByTestId('main-toolbar');
    const rows = within(main).getAllByTestId('toolbar-row');

    expect(rows).toHaveLength(2);
    // 帯の直下は [段, 段と段の間の横 Groove, 段] の 3 個。溝はライブラリの ToolbarBand が
    // 挿す (role=separator / aria-orientation=horizontal / aria-hidden)。
    const children = Array.from(strip.children);
    expect(children).toHaveLength(3);
    const groove = children[1];
    expect(groove.getAttribute('role')).toBe('separator');
    expect(groove.getAttribute('aria-orientation')).toBe('horizontal');
    expect(groove.getAttribute('aria-hidden')).toBe('true');
    // 段は行の並び (display flex / flex-wrap / align-items / 背景) を持つライブラリの ToolbarRow。
    for (const row of rows) {
      expect(row.className).toContain('bandRow');
    }
    // 段の内容は 22px (ライブラリ Toolbar の上下の余白 1px ずつを外す)。
    // 帯の高さ (内容 22 + 溝 3) が他の 4 ウィンドウと揃う。
    for (const toolbar of within(strip).getAllByRole('toolbar')) {
      expect(toolbar).toHaveStyle({ height: '22px', padding: '0px 2px' });
    }
  });

  it('ツールバーを実物と同じ 5 グループ (ドッキング ツールバー) に分ける', () => {
    const { main } = renderMain();
    const groups = within(main).getAllByRole('toolbar');

    // 表示ツールバーだけは拡大率の Edit を挟むため 2 本に分かれる (見た目は 1 本)。
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual([
      '基本ツールバー',
      'ページ移動ツールバー',
      '表示ツールバー',
      '表示ツールバー',
      'チェックツールバー',
      'ナビゲートツールバー',
    ]);
    for (const group of TOOLBAR_GROUPS) {
      const element = within(main).getByTestId(`toolbar-group-${group.id}`);
      expect(groupControls(element)).toEqual([...group.items, ...group.extra]);
    }
  });

  it('ツールバー 1 本ごとに実物の並びを保ち、グループの区切りはセパレータ', () => {
    const { main } = renderMain();
    const groups = TOOLBAR_GROUPS.map((group) => within(main).getByTestId(`toolbar-group-${group.id}`));

    expect(groups.flatMap((group) => toolbarSlots(group))).toEqual(TOOLBAR_SEQUENCE);
    expect(within(main).getAllByRole('separator')).toHaveLength(TOOLBAR_GROUPS.length - 1);
  });

  it('色ボタンのアイコンは 4 ウィンドウで共有する色矩形 (ui/check-colors.ts)', () => {
    const { main } = renderMain();

    for (const color of CHECK_COLOR_IDS) {
      const button = within(main).getByRole('button', { name: `色${color}` });
      expect(button.querySelector('img')?.getAttribute('src')).toBe(
        checkSwatchIcon(CHECK_COLOR_HEX[color]),
      );
    }
  });

  it('ツールバー内のコントロールは実測の最小寸法を持ち、内容に合わせて広がる', () => {
    const { main } = renderMain();
    const combos = ['日付ジャンプ', 'ホールジャンプ', 'インデックスジャンプ'].map((name) =>
      within(main).getByLabelText(name),
    );
    // 実測の ComboBox は 64/68/40 x20。ただし長い選択肢 (例「西3･4壁」) が欠けないよう
    // 幅は内容に合わせる (min-width が実測値)。
    expect(combos.map((el) => el.style.minWidth)).toEqual(['64px', '68px', '40px']);
    expect(combos.map((el) => el.style.width)).toEqual(['auto', 'auto', 'auto']);
    expect(combos[0]).toHaveStyle({ height: '20px' });
    // 拡大率の Edit は実測 36x18。
    const zoom = within(main).getByRole('textbox', { name: '拡大率' });
    expect(zoom).toHaveStyle({ width: '36px', height: '18px' });
  });

  it('ツールバーのボタンが WM_COMMAND 相当の番号を通知する', async () => {
    const { user, main, props } = renderMain();
    const click = async (name: string) => user.click(within(main).getByRole('button', { name }));

    await click('新規作成');
    expect(props.onCommand).toHaveBeenLastCalledWith(32818);
    await click('チェックリストを開く');
    expect(props.onCommand).toHaveBeenLastCalledWith(32793);
    await click('チェックリストの保存');
    expect(props.onCommand).toHaveBeenLastCalledWith(32794);
    await click('印刷');
    expect(props.onCommand).toHaveBeenLastCalledWith(32771);
    await click('ズームアウト');
    expect(props.onCommand).toHaveBeenLastCalledWith(32787);
    await click('元のサイズ');
    expect(props.onCommand).toHaveBeenLastCalledWith(32789);
    await click('色3');
    expect(props.onCommand).toHaveBeenLastCalledWith(33003);
    await click('チェックリストから外す');
    expect(props.onCommand).toHaveBeenLastCalledWith(33020);
    await click('色編集');
    expect(props.onCommand).toHaveBeenLastCalledWith(61227);
    await click('戻る');
    expect(props.onCommand).toHaveBeenLastCalledWith(32845);
    await click('進む');
    expect(props.onCommand).toHaveBeenLastCalledWith(32846);
  });

  it('アンチエイリアスは押下状態を切り替えて 32792 を通知する', async () => {
    const { user, main, props } = renderMain();
    const toggle = within(main).getByRole('button', { name: 'アンチエイリアス' });

    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(props.onCommand).toHaveBeenLastCalledWith(32792);
  });

  it('拡大率の Edit は現在値を % で表示し、Enter で onZoomChange を呼ぶ', async () => {
    const { user, main, props } = renderMain({ zoom: 150 });
    const input = within(main).getByRole('textbox', { name: '拡大率' });

    expect(input).toHaveValue('150%');

    await user.clear(input);
    await user.type(input, '75{Enter}');
    expect(props.onZoomChange).toHaveBeenLastCalledWith(75);

    await user.clear(input);
    await user.type(input, '0{Enter}');
    await user.clear(input);
    await user.type(input, 'x{Enter}');
    expect(props.onZoomChange).toHaveBeenCalledTimes(1);
  });

  it('ジャンプの ComboBox は選択中の値を表示し、選ぶと onCommand を呼ぶ', async () => {
    const { user, main, props } = renderMain();
    const day = within(main).getByRole<HTMLSelectElement>('combobox', { name: '日付ジャンプ' });
    const hall = within(main).getByRole<HTMLSelectElement>('combobox', { name: 'ホールジャンプ' });
    const index = within(main).getByRole<HTMLSelectElement>('combobox', { name: 'インデックスジャンプ' });

    // 実物の ComboBox と同じく、選択中の値を表示する。
    expect(day.selectedOptions[0]).toHaveTextContent('金曜日');
    expect(hall.selectedOptions[0]).toHaveTextContent('西2壁');
    expect(index.selectedOptions[0]).toHaveTextContent('あ');

    await user.selectOptions(day, '34001');
    expect(day.selectedOptions[0]).toHaveTextContent('土曜日');
    expect(props.onCommand).toHaveBeenLastCalledWith(34001);

    await user.selectOptions(hall, '34100');
    expect(props.onCommand).toHaveBeenLastCalledWith(34100);

    await user.selectOptions(index, '34300');
    expect(props.onCommand).toHaveBeenLastCalledWith(34300);
  });

  it('jumpOptions が無いときは circles と blocks から作れる選択肢だけを入れる', () => {
    const { main } = renderMain({
      jumpOptions: undefined,
      circles: [makeCircle(1, { day: 1, circleKana: 'ﾊﾅ' }), makeCircle(2, { day: 2, circleKana: 'ｱｷ' })],
      blocks: [
        { id: 1, name: 'あ', areaId: 2 },
        { id: 2, name: 'は', areaId: 2 },
      ],
    });

    const day = within(main).getByRole<HTMLSelectElement>('combobox', { name: '日付ジャンプ' });
    expect(Array.from(day.options).map((option) => option.textContent)).toEqual(['1日目', '2日目']);

    // インデックスは実物と同じくブロック名 (渡されたブロックをそのまま並べる)。
    const index = within(main).getByRole<HTMLSelectElement>('combobox', { name: 'インデックスジャンプ' });
    expect(Array.from(index.options).map((option) => option.textContent)).toEqual(['あ', 'は']);

    // ホールはカタログデータ (circles) から作れないので選択肢なし = 押せない。
    expect(within(main).getByRole('combobox', { name: 'ホールジャンプ' })).toBeDisabled();
  });

  it('blocks が無ければインデックスジャンプは選択肢なし (押せない)', () => {
    const { main } = renderMain({ jumpOptions: undefined, blocks: undefined });

    expect(within(main).getByRole('combobox', { name: 'インデックスジャンプ' })).toBeDisabled();
  });

  it('段は初期値で決まる (幅では折り返さない)', () => {
    // 実物の rebar と同じく段は RBBS_BREAK 相当 (INITIAL_TOOLBAR_ROWS) で決まり、
    // 幅では自動で折り返さない。狭くても広くても同じ段になる。
    const expected = [
      ['基本ツールバー', 'ページ移動ツールバー', '表示ツールバー', '表示ツールバー'],
      ['チェックツールバー', 'ナビゲートツールバー'],
    ];
    for (const width of [900, 1245]) {
      cleanup();
      mockToolbarWidths(width);
      const { main } = renderMain();
      const rows = within(main).getAllByTestId('toolbar-row');

      expect(
        rows.map((row) =>
          within(row)
            .getAllByRole('toolbar')
            .map((group) => group.getAttribute('aria-label')),
        ),
      ).toEqual(expected);
    }
  });

  it('幅を計測できなくても段は初期値のまま', () => {
    const { main } = renderMain();
    const rows = within(main).getAllByTestId('toolbar-row');

    expect(rows).toHaveLength(2);
    // 段の並び (display / flex-wrap / align-items / 背景) はライブラリの ToolbarRow が持つ。
    // アプリが inline で残すのは左右 2px の余白と、グループ同士の間隔 2px。
    expect(rows[0].className).toContain('bandRow');
    expect(rows[0]).toHaveStyle({ padding: '0px 2px', gap: '2px' });
    // グループの中では折り返さない。
    for (const group of TOOLBAR_GROUPS) {
      expect(within(main).getByTestId(`toolbar-group-${group.id}`)).toHaveStyle({ flexShrink: 0 });
    }
  });

  it('circles の数だけカットを並べ、選択とチェックを反映する', async () => {
    const { user, main, props } = renderMain({ selectedId: 2, checkedIds: new Set([2]) });
    const cells = main.querySelectorAll('.cut-cell');

    expect(cells).toHaveLength(CIRCLES.length);
    expect(cells[0]).not.toHaveClass('cut-cell--selected');
    expect(cells[1]).toHaveClass('cut-cell--selected');
    expect(cells[1]).toHaveClass('cut-cell--checked');

    await user.click(cells[2]);
    expect(props.onSelect).toHaveBeenCalledWith(3);

    await user.dblClick(cells[2]);
    expect(props.onOpenDetail).toHaveBeenCalledWith(3);
  });

  it('カットの無いページではメッセージを出す', () => {
    const { main } = renderMain({ circles: [] });

    expect(within(main).getByTestId('cut-view')).toBeInTheDocument();
    expect(within(main).getByText('サークルカットがありません')).toBeInTheDocument();
  });

  it('ページ移動はツールバーとステータスバーの 2 か所にある', () => {
    const { main } = renderMain();

    expect(within(main).getAllByRole('button', { name: '前のページ' })).toHaveLength(2);
    expect(within(main).getAllByRole('button', { name: '次のページ' })).toHaveLength(2);
  });

  it('ステータスバー 1 行目にページ番号・前後ボタン・スライダを並べる', async () => {
    const { user, main, props } = renderMain({ pageNo: 3, lastPage: 200 });
    const slider = within(main).getByRole('slider', { name: 'ページ送り' });

    expect(slider).toHaveValue('3');
    expect(slider).toHaveAttribute('min', '1');
    expect(slider).toHaveAttribute('max', '200');

    await user.click(within(main).getAllByRole('button', { name: '前のページ' })[1]);
    expect(props.onPageChange).toHaveBeenLastCalledWith(2);

    await user.click(within(main).getAllByRole('button', { name: '次のページ' })[1]);
    expect(props.onPageChange).toHaveBeenLastCalledWith(4);

    fireEvent.change(slider, { target: { value: '12' } });
    expect(props.onPageChange).toHaveBeenLastCalledWith(12);
  });

  it('ステータスバーのコントロールを実測の寸法にし、文字を上下中央に揃える', () => {
    const { main } = renderMain();
    const [, prev] = within(main).getAllByRole('button', { name: '前のページ' });
    const [, next] = within(main).getAllByRole('button', { name: '次のページ' });
    const slider = within(main).getByRole('slider', { name: 'ページ送り' });

    // 実測: << >> = 41x17 / ページ番号 = 36x13 (+「ページ」ラベル) / スライダ = 90x20。
    // 98.css の min-width / min-height は打ち消す。
    expect(prev).toHaveStyle({ width: '41px', height: '17px', minWidth: '0px', minHeight: '0px' });
    expect(next).toHaveStyle({ width: '41px', height: '17px', minWidth: '0px', minHeight: '0px' });
    expect(within(main).getByRole('textbox', { name: 'ページ番号' })).toHaveStyle({
      width: '36px',
      height: '13px',
    });
    expect(slider).toHaveStyle({ width: '90px', height: '20px' });
    // 実物は番号の右に「ページ」のラベルが付く (「106 ページ」)。
    expect(within(main).getByText('ページ')).toBeInTheDocument();

    // 行は 20px (実測のスライダ 20px が収まる高さ) で、コントロールも文字も上下中央に置く。
    const controls = slider.parentElement;
    expect(controls).toHaveStyle({ alignItems: 'center', height: '20px' });
    // 文字欄も同じ行の高さを持つ (通常は空で、カットのホバー中だけサークル情報が出る)。
    const textField = controls?.nextElementSibling as HTMLElement;
    expect(textField).toHaveStyle({ display: 'flex', alignItems: 'center', height: '20px' });
  });

  it('1 ページ目では前のページへ戻らない', async () => {
    const { user, main, props } = renderMain({ pageNo: 1, lastPage: 200 });

    await user.click(within(main).getAllByRole('button', { name: '前のページ' })[1]);
    expect(props.onPageChange).toHaveBeenCalledWith(1);
  });

  it('ページ番号の入力は Enter のときだけ有効な値を通知する', async () => {
    const { user, main, props } = renderMain({ pageNo: 3 });
    const input = within(main).getByRole('textbox', { name: 'ページ番号' });
    expect(input).toHaveValue('3');

    await user.clear(input);
    await user.type(input, '12{Enter}');
    expect(props.onPageChange).toHaveBeenCalledWith(12);

    await user.clear(input);
    await user.type(input, '0{Enter}');
    await user.clear(input);
    await user.type(input, 'x{Enter}');
    expect(props.onPageChange).toHaveBeenCalledTimes(1);
  });

  it('ステータスバーは通常は空で、ページ数は左の番号欄だけが持つ', () => {
    const { main } = renderMain({ pageNo: 3 });

    // 実物のステータスバーは通常は空 (「準備完了」のような状態は出さない)。
    expect(within(main).queryByText('該当 3 件')).toBeNull();
    // ページ数は左の番号欄 (「3」+「ページ」) に出し、右端には出さない (実物に無い)。
    expect(within(main).getByRole('textbox', { name: 'ページ番号' })).toHaveValue('3');
    expect(within(main).queryByText('3 ページ目')).toBeNull();
  });

  it('カットにマウスが乗ると、ステータスバーの文言を空白区切りのサークル情報に差し替える', async () => {
    const { user, main } = renderMain({ message: '該当 3 件' });
    const cell = within(main).getAllByRole('button', { name: /サークル/ })[0];

    await user.hover(cell);
    // 実物は項目を空白で区切る (「/」は使わない)。
    const info = within(main).getByText(/サークル1/);
    expect(info).toBeInTheDocument();
    expect(info.textContent).not.toContain('/');
  });
});

describe('CircleCutView', () => {
  it('imageUrl が URL を返したカットだけ画像を描く', () => {
    render(
      <CircleCutView
        circles={CIRCLES}

        selectedId={null}
        checkedIds={NO_CHECKED}
        onSelect={vi.fn()}
        onOpenDetail={vi.fn()}
        imageUrl={(circle) => (circle.id === 1 ? '/cuts/1.png' : undefined)}
      />,
    );

    const cutView = screen.getByTestId('cut-view');
    const images = cutView.querySelectorAll('img');
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('src', '/cuts/1.png');
    expect(cutView.querySelectorAll('.cut-cell')).toHaveLength(CIRCLES.length);
  });

  it('スペース番号は a のサークルだけに出し、サークル名と執筆者はツールチップに持つ', () => {
    render(
      <CircleCutView
        circles={[
          makeCircle(11, { spaceNo: 11, spaceNoSub: 0 }),
          makeCircle(12, { spaceNo: 12, spaceNoSub: 1, penName: '執筆者名' }),
        ]}
        selectedId={null}
        checkedIds={NO_CHECKED}
        onSelect={vi.fn()}
        onOpenDetail={vi.fn()}
      />,
    );

    // 実物は a のサークルだけが見出し帯の左に番号ボックスを持つ (b には枠も番号も無い)。
    // 実物の番号は数字だけ (a / b は付かない)。
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.queryByText('12b')).toBeNull();
    // サークル名と執筆者は見出し帯として画像に焼き込まれているので、DOM ではツールチップで持つ。
    expect(screen.getByTitle(/サークル12/)).toBeInTheDocument();
    expect(screen.getByTitle(/執筆者名/)).toBeInTheDocument();
  });

  it('背景のクリックで選択を解除する', async () => {
    const user = userEvent.setup({ delay: null });
    const onSelect = vi.fn();
    render(
      <CircleCutView
        circles={CIRCLES}

        selectedId={1}
        checkedIds={NO_CHECKED}
        onSelect={onSelect}
        onOpenDetail={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId('cut-view'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});

describe('MainWindow — チェックリスト メニュー (実機の並びと活性)', () => {
  /** チェックリスト メニューを開き、出ている項目 (区切りを除く) を返す。 */
  async function openChecklistMenu(user: UserEvent, main: HTMLElement) {
    await user.click(
      within(main).getByRole('menuitem', { name: 'チェックリスト(A)' }),
    );
    const opened = screen.getAllByRole('menu');
    return within(opened[opened.length - 1]).getAllByRole('menuitem');
  }

  /** 項目の表示文字 (ラベル + ショートカット)。 */
  const textOf = (item: HTMLElement) => (item.textContent ?? '').replace(/\s+/g, ' ').trim();

  it('サークルカット未選択では選択が要る項目だけ使えない', async () => {
    const { user, main } = renderMain();
    const items = await openChecklistMenu(user, main);
    const item = (label: string) =>
      items.find((node) => textOf(node).startsWith(label)) as HTMLElement;

    // 選択中のサークルに効く項目 (追加 / 外す / メモ編集 / コピー)。
    for (const label of [
      '標準色で追加(A)',
      '色1で追加',
      '色9で追加',
      'チェックリストから外す(R)',
      'サークルのメモを編集する(M)',
      '選択サークルをクリップボードにコピー(C)',
    ]) {
      expect(item(label), label).toHaveAttribute('aria-disabled', 'true');
    }
    // 選択に関係なく使える項目 (標準のチェック色 / 色の編集 / メモの一括消去 / ペースト)。
    for (const label of [
      '標準のチェック色(D)',
      'チェック色の編集(E)...',
      'チェックなしサークルのメモを消去する',
      '全てのメモを消去する',
      'クリップボードからチェックリストにペースト(P)',
    ]) {
      expect(item(label).getAttribute('aria-disabled'), label).not.toBe('true');
    }
  });

  it('サークルカットを選択中は選択が要る項目も使える', async () => {
    const { user, main } = renderMain({ selectedId: 1 });
    const items = await openChecklistMenu(user, main);

    for (const label of [
      '標準色で追加(A)',
      '色1で追加',
      'チェックリストから外す(R)',
      'サークルのメモを編集する(M)',
      '選択サークルをクリップボードにコピー(C)',
    ]) {
      const item = items.find((node) => textOf(node).startsWith(label)) as HTMLElement;
      expect(item.getAttribute('aria-disabled'), label).not.toBe('true');
    }
  });

  it('項目は元実装のコマンドを送る (標準色で追加 33040 / 色1で追加 33001 / 外す 33020)', async () => {
    const { user, main, props } = renderMain({ selectedId: 1 });

    for (const [label, command] of [
      ['標準色で追加(A)', 33040],
      ['色1で追加', 33001],
      ['チェックリストから外す(R)', 33020],
    ] as const) {
      // 項目を選ぶとメニューが閉じるので、毎回開き直す。
      const items = await openChecklistMenu(user, main);
      await user.click(items.find((node) => textOf(node).startsWith(label)) as HTMLElement);
      expect(props.onCommand, label).toHaveBeenLastCalledWith(command);
    }
  });
});
