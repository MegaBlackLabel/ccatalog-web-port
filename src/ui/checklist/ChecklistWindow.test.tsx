import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CheckColor } from '../../app/catalog-state';
import { DEFAULT_LIST_DISPLAY_SETTINGS } from '../../domain/app-settings';
import type { Circle } from '../../domain/types';
import { CHECK_COLOR_HEX, CHECK_COLOR_IDS, checkSwatchIcon } from '../check-colors';
import { TOOLBAR_ICONS } from '../main/toolbar-icons';
import { ChecklistWindow } from './ChecklistWindow';
import type { ChecklistRow, ChecklistWindowProps } from './ChecklistWindow';

/** 色1〜色9 の名称 (index 0 が「色1」)。 */
const COLOR_NAMES = ['赤', '橙', '黄', '緑', '水', '青', '紫', '桃', '灰'];

const DAYS = [1, 2, 3, 4, 0];
const COUNTS: Record<number, number> = { 1: 2, 2: 1, 3: 0, 4: 0, 0: 1 };

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

function makeRow(
  id: number,
  color: CheckColor,
  patch: Partial<Circle> = {},
  genreName = '創作(少女)',
): ChecklistRow {
  return { entry: { circleId: id, color }, circle: makeCircle(id, patch), genreName };
}

const ROWS: ChecklistRow[] = [
  makeRow(1, 0, {
    circleName: 'サークルA',
    circleKana: 'さーくるA',
    penName: 'ペンA',
    bookName: '発行誌A',
    url: 'https://example.com/a',
    mailAddr: 'a@example.com',
    description: '補足A',
    memo: 'メモA',
    spaceNo: 12,
    spaceNoSub: 0,
    day: 1,
  }),
  makeRow(
    2,
    3,
    {
      circleName: 'サークルB',
      circleKana: 'さーくるB',
      penName: 'ペンB',
      spaceNo: 12,
      spaceNoSub: 1,
      day: 1,
    },
    '評論',
  ),
];

function renderChecklist(overrides: Partial<ChecklistWindowProps> = {}) {
  const props: ChecklistWindowProps = {
    rows: ROWS,
    days: DAYS,
    activeDay: 1,
    counts: COUNTS,
    colorNames: COLOR_NAMES,
    locked: false,
    selectedIds: [],
    onActiveDayChange: vi.fn(),
    onSelectionChange: vi.fn(),
    onToggleLock: vi.fn(),
    onSetColor: vi.fn(),
    onRemove: vi.fn(),
    onOrderBy: vi.fn(),
    onOpenDetail: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  render(<ChecklistWindow {...props} />);
  return { user, props, checklist: screen.getByTestId('checklist-window') };
}

/** 指定した文字列を含むリストの行。 */
function rowOf(text: string): HTMLElement {
  const row = screen.getByText(text).closest('tr');
  if (!row) throw new Error(`${text} の行が見つかりません`);
  return row;
}

/** jsdom は色を rgb() 表記で返すので、実測の #rrggbb を合わせる。 */
function rgbOf(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 0xff}, ${(value >> 8) & 0xff}, ${value & 0xff})`;
}

describe('ChecklistWindow', () => {
  it('実物と同じ列見出しとステータスバーを表示する', () => {
    const { checklist } = renderChecklist({ selectedIds: [2] });

    expect(within(checklist).getByText('チェックリスト')).toBeInTheDocument();
    const headers = within(checklist)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    // 先頭は「印刷順」(色 + 連番) で、色列の見出しは無い。以降は実物のウィンドウ
    // (1WINDOW/3CHECK.HTM) の見出しと同じ並び。
    expect(headers).toEqual([
      '',
      '印刷順',
      'スペース',
      'サークルカット',
      'サークル名',
      '発行誌',
      '補足',
      'メモ',
      '更新情報',
      '更新状態',
    ]);
    expect(within(checklist).getByText('全 4 件中 2 件を表示')).toBeInTheDocument();
    expect(within(checklist).getByText('選択 1 件')).toBeInTheDocument();
  });

  it('サークルカット列は見出しとカット画像 (111x162) が欠けない幅にする', () => {
    const { checklist } = renderChecklist();

    const header = within(checklist).getAllByRole('columnheader')[3];
    expect(header).toHaveTextContent('サークルカット');
    // カット 111px + セルの左右の余白 (6px x 2) + 左の罫線 1px = 124px。
    // カットがちょうど収まる幅 (セルは overflow: hidden)。
    expect((header as HTMLElement).style.width).toBe('124px');

    const image = within(checklist).getAllByTestId('checklist-cut')[0] as HTMLImageElement;
    // 実物のカット 79x116 x 1.40。DB 上の表示サイズ 178x253 と同じ縦横比。
    expect(image.style.width).toBe('111px');
    expect(image.style.height).toBe('162px');
    // セルより広がらないように上限も付ける。
    expect(image.style.maxWidth).toBe('100%');
    // カットだけは左右中央に置く (他のセルは左寄せ)。
    expect(image.style.margin).toBe('0px auto');
  });

  it('1 行 1 サークルでスペース・補足・更新状態を表示する', () => {
    const { checklist } = renderChecklist();

    // ヘッダー行 + サークル数。
    expect(within(checklist).getAllByRole('row')).toHaveLength(ROWS.length + 1);

    expect(within(rowOf('サークルA')).getByText('12a')).toBeInTheDocument();
    expect(within(rowOf('サークルB')).getByText('12b')).toBeInTheDocument();
  });

  it('参加日とジャンルは「リスト表示」で足すと出る', () => {
    renderChecklist({
      visibleColumns: [...DEFAULT_LIST_DISPLAY_SETTINGS.checklist, 'day', 'genre'],
    });

    expect(within(rowOf('サークルA')).getByText('1日目')).toBeInTheDocument();
    expect(within(rowOf('サークルA')).getByText('創作(少女)')).toBeInTheDocument();
    expect(within(rowOf('サークルB')).getByText('評論')).toBeInTheDocument();
  });

  it('抽選漏れ (day 0) は日付欄に「抽選漏れ」と出す', () => {
    renderChecklist({
      rows: [makeRow(3, 1, { circleName: 'サークルC', day: 0, spaceNo: 0, spaceNoSub: 0 })],
      visibleColumns: [...DEFAULT_LIST_DISPLAY_SETTINGS.checklist, 'day'],
    });

    expect(within(rowOf('サークルC')).getByText('抽選漏れ')).toBeInTheDocument();
  });

  it('色列の見本色は実物のチェック色で、行ごとに変える', () => {
    renderChecklist();

    // 色 0 は標準色 (白)、色 3 は実測の黄 (#fff700)。
    const standard = rowOf('サークルA').querySelector('[data-color="0"]');
    const yellow = rowOf('サークルB').querySelector('[data-color="3"]');
    expect(standard).not.toBeNull();
    expect(yellow).not.toBeNull();
    // 標準色は実物の会場マップ (WINDOW4.PNG) で使われている緑。
    expect((standard as HTMLElement).style.backgroundColor).toBe(rgbOf('#00c060'));
    expect((yellow as HTMLElement).style.backgroundColor).toBe(rgbOf(CHECK_COLOR_HEX[3]));
    // 見本は小さな矩形 (実測の色ボタンと同じ 12x12)。
    expect((yellow as HTMLElement).style.width).toBe('12px');
    expect((yellow as HTMLElement).style.height).toBe('12px');
  });

  it('印刷順は表示順の連番を出す (色の次)', () => {
    renderChecklist();

    // 0 列目は色の見本、1 列目が「印刷順」。
    expect(rowOf('サークルA').querySelectorAll('td')[1]).toHaveTextContent('1');
    expect(rowOf('サークルB').querySelectorAll('td')[1]).toHaveTextContent('2');
  });

  it('発行誌・URL・Mail を出し、空欄は — にする', () => {
    // URL / Mail は「リスト表示」で入れる列 (既定は非表示)。
    renderChecklist({ visibleColumns: [...DEFAULT_LIST_DISPLAY_SETTINGS.checklist, 'url', 'mail'] });

    const a = within(rowOf('サークルA'));
    expect(a.getByText('発行誌A')).toBeInTheDocument();
    expect(a.getByText('https://example.com/a')).toBeInTheDocument();
    expect(a.getByText('a@example.com')).toBeInTheDocument();

    // サークルB の URL / Mail は空 (Circle の既定値) なので — になる。
    const b = within(rowOf('サークルB'));
    expect(b.getByText('本2')).toBeInTheDocument();
    expect(b.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  it('days ごとにタブを作り、ラベルは日付名だけにする', () => {
    const { checklist } = renderChecklist();

    // 実物のタブは日付名だけで、件数は出さない (1WINDOW/3CHECK.HTM)。
    expect(within(checklist).getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      '1日目',
      '2日目',
      '3日目',
      '4日目',
      '抽選漏れ',
    ]);
    expect(
      within(checklist)
        .getAllByRole('tab')
        .every((tab) => !(tab.textContent ?? '').includes('(')),
    ).toBe(true);
    expect(within(checklist).getByRole('tab', { name: '1日目' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('タブのクリックで onActiveDayChange に数値を渡す', async () => {
    const { user, props } = renderChecklist();

    await user.click(screen.getByRole('link', { name: '2日目' }));

    expect(props.onActiveDayChange).toHaveBeenCalledWith(2);
  });

  it('リストロックは押下状態を aria-pressed で示し、クリックで onToggleLock を呼ぶ', async () => {
    const { user, props } = renderChecklist({ locked: true });
    const lock = screen.getByRole('button', { name: 'リストロック' });

    expect(lock).toHaveAttribute('aria-pressed', 'true');

    await user.click(lock);
    expect(props.onToggleLock).toHaveBeenCalledTimes(1);
  });

  it('ロックされていないときは aria-pressed を false にする', () => {
    renderChecklist({ locked: false });

    expect(screen.getByRole('button', { name: 'リストロック' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('選択が無いときは「チェック解除」と色ボタンを押せなくする', () => {
    renderChecklist({ selectedIds: [] });

    expect(screen.getByRole('button', { name: 'チェック解除' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '赤' })).toBeDisabled();
  });

  it('「チェック解除」は選択中の ID を数値で渡す', async () => {
    const { user, props } = renderChecklist({ selectedIds: [2, 3] });

    await user.click(screen.getByRole('button', { name: 'チェック解除' }));

    expect(props.onRemove).toHaveBeenCalledWith([2, 3]);
  });

  it('色ボタンは選択中の ID と色で onSetColor を呼ぶ', async () => {
    const { user, props } = renderChecklist({ selectedIds: [1, 2] });

    // colorNames[2] = 色3。
    await user.click(screen.getByRole('button', { name: '黄' }));

    expect(props.onSetColor).toHaveBeenCalledWith([1, 2], 3);
  });

  it('色名が無いときは「色N」の名前で色ボタンを出す', async () => {
    const { user, props } = renderChecklist({ selectedIds: [1], colorNames: [] });

    await user.click(screen.getByRole('button', { name: '色9' }));

    expect(props.onSetColor).toHaveBeenCalledWith([1], 9);
  });

  it('「印刷順確定」は space で onOrderBy を呼ぶ', async () => {
    const { user, props } = renderChecklist();

    await user.click(screen.getByRole('button', { name: '印刷順確定' }));

    expect(props.onOrderBy).toHaveBeenCalledWith('space');
  });

  it('リストロック / 印刷順確定 / RSS / チェック解除 は実物の SVG アイコンだけの 22x22 ボタン', () => {
    const { checklist } = renderChecklist({ selectedIds: [1] });
    const toolbar = within(checklist).getByTestId('checklist-toolbar');
    const expected: readonly [string, string][] = [
      ['リストロック', TOOLBAR_ICONS.listLock],
      ['印刷順確定', TOOLBAR_ICONS.printOrder],
      ['RSS', TOOLBAR_ICONS.rss],
      ['チェック解除', TOOLBAR_ICONS.checkRemove],
    ];

    for (const [name, icon] of expected) {
      const button = within(toolbar).getByRole('button', { name });
      // 実物と同じくアイコンだけ。名前は aria-label と title (ツールチップ) に持たせる。
      expect(button.textContent).toBe('');
      expect(button).toHaveAttribute('aria-label', name);
      expect(button.getAttribute('title')).toBeTruthy();
      // 実物のツールバー ボタンと同じ 22x22。
      expect(button.style.width).toBe('22px');
      expect(button.style.height).toBe('22px');

      const image = button.querySelector('img');
      expect(image).not.toBeNull();
      // 実物のツールバー ボタン (PE の RT_BITMAP) を SVG 化した data URI をそのまま使う。
      expect(image?.getAttribute('src')).toContain('data:image/svg+xml');
      expect(image?.getAttribute('src')).toBe(icon);
      // 名前はボタン側に持たせるので、アイコンは読み上げ対象にしない。
      expect(image).toHaveAttribute('alt', '');
      expect(image).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('色 1〜9 のボタンもサークルカット ウィンドウと同じ 22x22 のアイコンだけにする', () => {
    const { checklist } = renderChecklist({ selectedIds: [1] });
    const toolbar = within(checklist).getByTestId('checklist-toolbar');

    for (const color of CHECK_COLOR_IDS) {
      const name = COLOR_NAMES[color - 1];
      const button = within(toolbar).getByRole('button', { name });

      // 文字は出さず、名前は aria-label と title (ツールチップ) に持たせる。
      expect(button.textContent).toBe('');
      expect(button).toHaveAttribute('aria-label', name);
      expect(button).toHaveAttribute('title', name);
      expect(button).toHaveAttribute('data-color', String(color));
      // ホバー / 押下の浮き出しと使えないときの薄さは共通クラスが受ける (app.css)。
      expect(button).toHaveClass('toolbar-icon-button');
      // サークルカット ウィンドウの色ボタンと同じ 22x22 + 同じアイコン (ui/check-colors.ts)。
      expect(button.style.width).toBe('22px');
      expect(button.style.height).toBe('22px');
      expect(button.querySelector('img')?.getAttribute('src')).toBe(
        checkSwatchIcon(CHECK_COLOR_HEX[color]),
      );
    }
  });

  it('ツールバーに文字付きの並べ替えドロップダウンを置かない', () => {
    const { checklist } = renderChecklist({ selectedIds: [1] });
    const toolbar = within(checklist).getByTestId('checklist-toolbar');

    expect(within(toolbar).queryByRole('combobox')).toBeNull();
    expect(within(toolbar).queryByLabelText('並べ替え')).toBeNull();
    expect(toolbar.textContent).not.toContain('並べ替え');
  });

  it('ツールバーに「チェック色変更」の文言を出さない (色ボタンだけを並べる)', () => {
    const { checklist } = renderChecklist({ selectedIds: [1] });
    const toolbar = within(checklist).getByTestId('checklist-toolbar');

    // 実物のツールバーはアイコンだけ。色の見出しの文字は持たない。
    expect(toolbar.textContent).toBe('');
    expect(within(checklist).queryByText('チェック色変更')).toBeNull();
    for (const name of COLOR_NAMES) {
      expect(within(toolbar).getByRole('button', { name })).toHaveAttribute('title', name);
    }
  });

  it('ツールバーの並びは リストロック | 印刷順確定 | RSS | 色1〜9 | チェック解除 (間に区切り線)', () => {
    const { checklist } = renderChecklist({ selectedIds: [1] });
    const toolbar = within(checklist).getByTestId('checklist-toolbar');

    // 実物 (1WINDOW/3CHECK.HTM) の並び。帯の直下は段 (ToolbarRow) 1 個だけなので、その子を歩く。
    // アイコン ボタンの間は 1px の溝のセパレータ (ライブラリの Groove = role=separator) を置く。
    const row = toolbar.firstElementChild as HTMLElement;
    const slots = Array.from(row.children).map((child) =>
      child.getAttribute('role') === 'separator'
        ? '区切り'
        : child.tagName === 'BUTTON'
          ? child.getAttribute('aria-label')
          : 'パレット',
    );
    expect(slots).toEqual([
      'リストロック',
      '区切り',
      '印刷順確定',
      '区切り',
      'RSS',
      '区切り',
      'パレット',
      '区切り',
      'チェック解除',
    ]);
  });

  it('アイコン ボタンの間の区切り線は実物と同じ 1px の溝にする', () => {
    const { checklist } = renderChecklist({ selectedIds: [1] });
    const toolbar = within(checklist).getByTestId('checklist-toolbar');
    const row = toolbar.firstElementChild as HTMLElement;
    const separators = Array.from(row.children).filter(
      (child) => child.getAttribute('role') === 'separator',
    ) as HTMLElement[];

    // リストロック | 印刷順確定 | RSS | パレット | チェック解除 の 4 か所。
    expect(separators).toHaveLength(4);
    for (const separator of separators) {
      // 1px の縦の溝 (暗 + 明の 2px を高さ 18px で引く) はライブラリの Groove が持つ。
      // jsdom には CSS が無いので、種別 (向き / 隠す) とアプリ inline の余白だけを確かめる。
      expect(separator).toHaveAttribute('aria-orientation', 'vertical');
      expect(separator).toHaveAttribute('aria-hidden', 'true');
      expect(separator.style.flex).toBe('0 0 auto');
      expect(separator.style.margin).toBe('0px 3px');
    }
  });

  it('ツールバーはサークルカット ウィンドウと同じ溝 (上辺の外の暗 + 上辺の明 1px + silver 1px + 下辺の暗 2px) を持つ', () => {
    const { checklist } = renderChecklist({ selectedIds: [1] });
    const toolbar = within(checklist).getByTestId('checklist-toolbar');

    // 溝 (上辺の外の暗 + 上辺の明 1px + silver 1px + 下辺の暗 2px) と z-index/position/
    // isolation はライブラリの ToolbarBand の CSS Modules (bandContainer) が持つ。
    // jsdom には CSS が無いので element.style には出ない =
    // サークルカット ウィンドウと同じ帯 (ToolbarBand) を使っていることで確かめる。
    expect(toolbar.className).toContain('bandContainer');
    // チェックリストの帯は 1 段。帯の直下は段 1 個だけで、段と段の間の横 Groove は挿さらない。
    const children = Array.from(toolbar.children);
    expect(children).toHaveLength(1);
    expect(children[0].className).toContain('bandRow');
    expect(toolbar.querySelector('[aria-orientation="horizontal"]')).toBeNull();
  });

  it('ツールバー帯はボタン 22x22 を内側に収め、.window-body の直下の第 1 子になる', () => {
    const { checklist } = renderChecklist({ selectedIds: [1] });
    const toolbar = within(checklist).getByTestId('checklist-toolbar');

    // 帯の高さ (明 1px + silver 1px + ボタン 22px + 暗 1px = 25px) はライブラリの
    // bandContainer が持つ。jsdom には CSS が無いので element.style では確かめられない。
    // ここでは帯の内側に収まるボタンが 22x22 のままであることだけを見る。
    for (const button of within(toolbar).getAllByRole('button')) {
      expect(button.style.height).toBe('22px');
    }
    // ツールバーは `.window-body` の直下の第 1 子 (ウィンドウ枠から同じ位置)。
    expect(toolbar.parentElement?.className).toContain('window-body');
    expect(toolbar.parentElement?.firstElementChild).toBe(toolbar);
  });

  it('RSS ボタンはアイコンだけ (Web 版に取得機能は無いので押しても何もしない)', async () => {
    const { user, props } = renderChecklist({ selectedIds: [1] });
    const rss = screen.getByRole('button', { name: 'RSS' });

    expect(rss).toHaveAttribute('title', 'サークルのRSS情報をネットから取得');
    expect(rss.textContent).toBe('');
    expect(rss.style.width).toBe('22px');
    expect(rss.querySelector('img')?.getAttribute('src')).toBe(TOOLBAR_ICONS.rss);

    await user.click(rss);
    expect(props.onToggleLock).not.toHaveBeenCalled();
    expect(props.onOrderBy).not.toHaveBeenCalled();
    expect(props.onSetColor).not.toHaveBeenCalled();
    expect(props.onRemove).not.toHaveBeenCalled();
    expect(props.onOpenDetail).not.toHaveBeenCalled();
  });

  it('「チェックリストから外す」ボタン (× 印) は選択中の ID で onRemove を呼ぶ', async () => {
    const { user, props } = renderChecklist({ selectedIds: [4, 5] });
    const remove = screen.getByRole('button', { name: 'チェック解除' });

    // 実機キャプチャから切り出した × 印を使う。
    expect(remove).toHaveAttribute('title', 'チェックリストから外す');
    expect(remove.querySelector('img')?.getAttribute('src')).toBe(TOOLBAR_ICONS.checkRemove);

    await user.click(remove);

    expect(props.onRemove).toHaveBeenCalledWith([4, 5]);
  });

  it('行のダブルクリックで数値 ID の詳細を開く', async () => {
    const { user, props } = renderChecklist();

    await user.dblClick(rowOf('サークルB'));

    expect(props.onOpenDetail).toHaveBeenCalledWith(2);
  });

  it('行の選択は数値 ID に変換して通知する', async () => {
    const { user, props } = renderChecklist();

    await user.click(rowOf('サークルB'));

    expect(props.onSelectionChange).toHaveBeenCalledWith([2]);
  });

  it('selectedIds の行を選択状態にする', () => {
    renderChecklist({ selectedIds: [2] });
    const rows = screen.getAllByRole('row');

    expect(rows[1]).not.toHaveClass('highlighted');
    expect(rows[2]).toHaveClass('highlighted');
  });

  it('rows が空のときは空メッセージを出す', () => {
    const { checklist } = renderChecklist({ rows: [] });

    expect(within(checklist).getByText('この日のチェックリストは空です')).toBeInTheDocument();
    expect(within(checklist).queryAllByRole('row')).toHaveLength(0);
    expect(within(checklist).getByText('全 4 件中 0 件を表示')).toBeInTheDocument();
  });
});
