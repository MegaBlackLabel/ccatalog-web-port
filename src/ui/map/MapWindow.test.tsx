import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import dummy from '../../data/fixtures/dummy-catalog.json';
import type { CatalogData, Circle, ComiketInfo, LayoutInfo, MapInfo } from '../../domain/types';
import { CHECK_COLOR_HEX } from '../check-colors';
import { TOOLBAR_ICONS } from '../main/toolbar-icons';
import { genreColor } from './genre-colors';
import { MapWindow } from './MapWindow';
import type { MapWindowEntry, MapWindowProps, MapWindowSeat } from './MapWindow';

const INFO: ComiketInfo = {
  comiketNo: 96,
  comiketName: 'コミックマーケット96',
  cutSizeW: 178,
  cutSizeH: 253,
  cutOriginX: 8,
  cutOriginY: 64,
  cutOffsetX: 0,
  cutOffsetY: 0,
  mapSizeW: 10,
  mapSizeH: 10,
  mapOriginX: 0,
  mapOriginY: 0,
};

/** 実物の ComiketMap (西12 は 1000x800、西34 は 760x800)。
 *  地図画像は tools/gen-map-svg.py が作った public/maps/<filename>.svg
 *  (ファイルが無ければ従来の <filename>.png にフォールバックする)。 */
const MAPS: MapInfo[] = [
  { id: 1, name: '西12', filename: 'W12', w: 1000, h: 800, allFilename: 'A3' },
  { id: 2, name: '西34', filename: 'W34', w: 760, h: 800, allFilename: 'A4' },
];

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

function makeLayout(patch: Partial<LayoutInfo> = {}): LayoutInfo {
  return { blockId: 1, spaceNo: 12, xpos: 130, ypos: 260, layout: 0, mapId: 1, ...patch };
}

/** 東1 のマス: チェック済み (色 3)、空席、逆向き (layout 90)。 */
/** 机 1 つ = a 席 (左) と b 席 (右)。テストは checked / 空席 / 未チェック の 3 机を使う。 */
const ENTRIES: MapWindowEntry[] = [
  {
    layout: makeLayout({ blockId: 1, spaceNo: 12, xpos: 130, ypos: 260 }),
    seatA: { circle: makeCircle(1), color: 3 },
    seatB: { circle: null, color: null },
  },
  {
    layout: makeLayout({ blockId: 1, spaceNo: 13, xpos: 260, ypos: 260 }),
    seatA: { circle: null, color: null },
    seatB: { circle: null, color: null },
  },
  {
    layout: makeLayout({ blockId: 2, spaceNo: 21, xpos: 390, ypos: 520, layout: 90 }),
    seatA: { circle: makeCircle(2, { blockId: 2, spaceNo: 21 }), color: null },
    seatB: { circle: null, color: null },
  },
];

function renderMap(overrides: Partial<MapWindowProps> = {}) {
  const props: MapWindowProps = {
    info: INFO,
    maps: MAPS,
    activeMapId: 1,
    onActiveMapChange: vi.fn(),
    entries: ENTRIES,
    imageUrl: '/maps/W12.png',
    zoom: 1,
    onZoomChange: vi.fn(),
    selectedId: null,
    onSelect: vi.fn(),
    onOpenDetail: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  const user = userEvent.setup();
  render(<MapWindow {...props} />);
  return { user, props };
}

describe('MapWindow', () => {
  it('マップ画像とマス、件数、タイトルを表示する', () => {
    const { props } = renderMap();

    expect(screen.getByTestId('map-image')).toHaveAttribute('src', '/maps/W12.svg');
    expect(screen.getByText('会場マップ - 西12')).toBeInTheDocument();
    expect(screen.getByText('2 件のサークルが表示されています')).toBeInTheDocument();

    const board = screen.getByTestId('map-board');
    expect(within(board).getAllByTestId('map-cell')).toHaveLength(props.entries.length);
  });

  it('地図ごとの印刷サイズ (ComiketMap の w/h) でボードを描く', () => {
    renderMap({ activeMapId: 2, imageUrl: '/maps/W34.png' });

    const image = screen.getByTestId('map-image');
    expect(image).toHaveAttribute('src', '/maps/W34.svg');
    // 760x800 の地図。ズーム 1 なので原寸のまま。
    expect(image.parentElement).toHaveStyle({ width: '760px', height: '800px' });
    expect(image).toHaveStyle({ width: '760px' });
  });

  it('地図情報が無いときは 1000x800 で描く', () => {
    renderMap({ maps: [], activeMapId: 1 });

    const image = screen.getByTestId('map-image');
    expect(image.parentElement).toHaveStyle({ width: '1000px', height: '800px' });
    expect(screen.getByLabelText('地図')).toBeDisabled();
  });

  it('マスに文字や枠を足さない (机とスペース番号は会場図の SVG に描かれている)', () => {
    renderMap();

    const [checked, empty] = screen.getAllByTestId('map-cell');
    // サークル情報はアプリからは描かない (識別用の data-* だけ持つ)。
    expect(checked).toHaveAttribute('data-space-no', '12');
    expect(checked).toHaveAttribute('data-block-id', '1');
    expect(checked.textContent).toBe('');
    expect(empty.textContent).toBe('');
    expect(checked.style.border).toBe('');
    expect(checked.style.background).toBe('');
  });

  it('机の左半分 (a 席) を実測の色で塗り、右半分 (b 席) は塗らない', () => {
    renderMap();

    const [checked, empty, unchecked] = screen.getAllByTestId('map-cell');
    const seats = within(checked).getAllByTestId('map-seat');
    // 実物の机の四角は xpos/ypos が左上 (机 10x10 の左半分が a 席)。
    expect(seats[0]).toHaveAttribute('data-seat', 'a');
    expect(seats[0]).toHaveAttribute('data-color', '3');
    expect(seats[0]).toHaveAttribute('x', '130');
    expect(seats[0]).toHaveAttribute('y', '260');
    expect(seats[0]).toHaveAttribute('width', '5');
    expect(seats[0]).toHaveAttribute('height', '10');
    // チェック済み (色 3) なので実測の色で塗る。
    expect(seats[0]).toHaveAttribute('fill', CHECK_COLOR_HEX[3]);
    // 空席の b 席は塗らない (右半分に並ぶ)。
    expect(seats[1]).toHaveAttribute('data-seat', 'b');
    expect(seats[1]).toHaveAttribute('data-color', '');
    expect(seats[1]).toHaveAttribute('x', '135');
    expect(seats[1]).toHaveAttribute('fill', 'transparent');
    // 空席の机と、サークルはあるが未チェックの机は塗らない。
    for (const cell of [empty, unchecked]) {
      for (const other of within(cell).getAllByTestId('map-seat')) {
        expect(other).toHaveAttribute('fill', 'transparent');
      }
    }
    expect(checked).toHaveAttribute('data-selected', 'false');
  });

  it('b 席のサークルは右半分を塗る', () => {
    renderMap({
      entries: [
        {
          ...ENTRIES[0],
          seatA: { circle: null, color: null },
          seatB: { circle: makeCircle(9, { spaceNoSub: 1 }), color: 7 },
        },
      ],
    });

    const seats = within(screen.getAllByTestId('map-cell')[0]).getAllByTestId('map-seat');
    expect(seats[0]).toHaveAttribute('fill', 'transparent');
    expect(seats[1]).toHaveAttribute('data-seat', 'b');
    expect(seats[1]).toHaveAttribute('data-color', '7');
    expect(seats[1]).toHaveAttribute('x', '135');
    expect(seats[1]).toHaveAttribute('fill', CHECK_COLOR_HEX[7]);
  });

  it('標準色 (0) は実物の会場マップと同じ緑で塗り、未チェックは塗らない', () => {
    renderMap({
      entries: [
        { ...ENTRIES[0], seatA: { circle: makeCircle(1), color: 0 } },
        ENTRIES[1],
      ],
    });

    const [standard, unchecked] = screen.getAllByTestId('map-cell');
    const [seat] = within(standard).getAllByTestId('map-seat');
    expect(seat).toHaveAttribute('data-color', '0');
    expect(seat).toHaveAttribute('fill', '#00c060');
    for (const s2 of within(unchecked).getAllByTestId('map-seat')) {
      expect(s2).toHaveAttribute('fill', 'transparent');
    }
  });

  it('色は乗算 + 少しの透過で重ね、下の会場図の数字が読めるようにする', () => {
    renderMap();

    const [checked, empty] = screen.getAllByTestId('map-cell');
    const [a] = within(checked).getAllByTestId('map-seat');
    expect(a.style.mixBlendMode).toBe('multiply');
    expect(a.style.opacity).toBe('0.7');
    // 未チェックの席には合成も透過も要らない。
    const [emptySeat] = within(empty).getAllByTestId('map-seat');
    expect(emptySeat.style.mixBlendMode).toBe('');
    expect(emptySeat.style.opacity).toBe('');
  });

  it('選択中のマスだけを選択状態にする', () => {
    renderMap({ selectedId: 1 });

    const [checked, empty, unchecked] = screen.getAllByTestId('map-cell');
    expect(checked).toHaveAttribute('data-selected', 'true');
    // 選択中の机は a 席の矩形に紺の枠を描く (SVG なので stroke)。
    expect(within(checked).getAllByTestId('map-seat')[0]).toHaveAttribute('stroke', '#000080');
    expect(empty).toHaveAttribute('data-selected', 'false');
    expect(unchecked).toHaveAttribute('data-selected', 'false');
  });

  it('ズームに合わせて画像とマスの大きさを変える', () => {
    renderMap({ zoom: 0.5 });

    // 会場図も重ねる SVG も同じ倍率で描く (座標は SVG の中の実寸のまま)。
    expect(screen.getByTestId('map-image')).toHaveStyle({ width: '500px' });
    const overlay = screen.getByTestId('map-overlay');
    expect(overlay).toHaveAttribute('width', '500');
    expect(overlay).toHaveAttribute('height', '400');
    const [firstSeat] = within(screen.getAllByTestId('map-cell')[0]).getAllByTestId('map-seat');
    expect(firstSeat).toHaveAttribute('x', '130');
    expect(firstSeat).toHaveAttribute('width', '5');
  });

  it('layout が 90 のマスは幅と高さを入れ替える', () => {
    renderMap({ info: { ...INFO, mapSizeW: 12, mapSizeH: 24 } });

    const [, , reversed] = screen.getAllByTestId('map-cell');
    // 90 度の机は幅と高さを入れ替える (机 24x12 の左半分なので 12x12)。
    const [seat] = within(reversed).getAllByTestId('map-seat');
    expect(seat).toHaveAttribute('x', '390');
    expect(seat).toHaveAttribute('width', '12');
    expect(seat).toHaveAttribute('height', '12');
  });

  it('カタログ情報が無いときはマスを 110x60 で描く', () => {
    renderMap({ info: null });

    const [seat] = within(screen.getAllByTestId('map-cell')[0]).getAllByTestId('map-seat');
    // カタログ情報が無いときの机は 110x60 で、左半分が a 席。
    expect(seat).toHaveAttribute('width', '55');
    expect(seat).toHaveAttribute('height', '60');
  });

  it('マスのクリックで選択し、ダブルクリックで詳細を開く', async () => {
    const { user, props } = renderMap();
    const [checked] = screen.getAllByTestId('map-cell');

    const seat = within(checked).getAllByTestId('map-seat')[0];
    await user.click(seat);
    expect(props.onSelect).toHaveBeenLastCalledWith(1);

    await user.dblClick(seat);
    expect(props.onOpenDetail).toHaveBeenLastCalledWith(1);
  });

  it('サークルの無いマスはクリックを受け取らない', async () => {
    const { props } = renderMap();
    const [, empty] = screen.getAllByTestId('map-cell');

    // 空席の矩形はクリックを受け取らない (pointer-events: none)。
    for (const seat of within(empty).getAllByTestId('map-seat')) {
      expect(seat.style.pointerEvents).toBe('none');
    }
    expect(props.onSelect).not.toHaveBeenCalled();
    expect(props.onOpenDetail).not.toHaveBeenCalled();
  });

  it('ズームボタンで表示倍率を 25% 刻みで通知する', async () => {
    const { user, props } = renderMap({ zoom: 1.25 });
    expect(screen.getByLabelText('拡大率')).toHaveValue('125%');

    await user.click(screen.getByRole('button', { name: 'ズームイン' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(1.5);

    await user.click(screen.getByRole('button', { name: 'ズームアウト' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(1);
  });

  it('拡大率の Edit で表示倍率を変える', () => {
    const { props } = renderMap({ zoom: 1 });

    // 表示は props の zoom を映す (「100%」)。入力は「150%」「150」どちらでも受ける。
    const input = screen.getByLabelText('拡大率');
    fireEvent.change(input, { target: { value: '150%' } });
    expect(props.onZoomChange).toHaveBeenLastCalledWith(1.5);

    fireEvent.change(input, { target: { value: '10' } });
    expect(props.onZoomChange).toHaveBeenLastCalledWith(0.25);

    // 数値にならない入力は無視する。
    fireEvent.change(input, { target: { value: 'あいう' } });
    expect(props.onZoomChange).toHaveBeenCalledTimes(2);
  });

  it('ズームアウトは 25% を下回らない', async () => {
    const { user, props } = renderMap({ zoom: 0.25 });

    await user.click(screen.getByRole('button', { name: 'ズームアウト' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(0.25);
  });

  it('ズームインは 300% を超えない', async () => {
    const { user, props } = renderMap({ zoom: 2.9 });

    await user.click(screen.getByRole('button', { name: 'ズームイン' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(3);
  });

  it('マップ選択ボックスで地図を切り替える', async () => {
    const { user, props } = renderMap();

    const select = screen.getByLabelText('地図');
    expect(select).toHaveValue('1');
    expect(
      within(screen.getByTestId('map-window')).getByRole('option', { name: '西12' }),
    ).toBeInTheDocument();

    await user.selectOptions(select, '2');
    expect(props.onActiveMapChange).toHaveBeenLastCalledWith(2);
  });

  it('選択中の地図の名前をタイトルに映す', () => {
    renderMap({ activeMapId: 2, imageUrl: '/maps/W34.png' });

    expect(screen.getByText('会場マップ - 西34')).toBeInTheDocument();
    expect(screen.getByTestId('map-image')).toHaveAttribute('src', '/maps/W34.svg');
  });

  it('実物のツールバーに 4 つのコントロールを並べる', () => {
    renderMap();

    const toolbar = screen.getByTestId('map-toolbar');
    // 実測 (windows.tsv): ComboBox 32799 = 地図 / Edit 32800 = 拡大率 /
    // Static = ジャンル表示 / ComboBox 32833 = ジャンル表示の濃さ。
    const mapSelect = within(toolbar).getByLabelText('地図');
    expect(mapSelect).toHaveAttribute('data-ctrl-id', '32799');
    expect(mapSelect).toHaveValue('1');
    const zoomInput = within(toolbar).getByLabelText('拡大率');
    expect(zoomInput).toHaveAttribute('data-ctrl-id', '32800');
    expect(zoomInput).toHaveValue('100%');
    expect(within(toolbar).getByText('ジャンル表示')).toBeInTheDocument();
    const density = within(toolbar).getByLabelText('ジャンル表示の濃さ');
    expect(density).toHaveAttribute('data-ctrl-id', '32833');
    // 実物の既定値は「なし」(重ねない)。なし〜100% を 25% 刻みで選べる。
    expect(density).toHaveValue('0');
    expect(
      Array.from(density.querySelectorAll('option')).map((option) => option.textContent),
    ).toEqual(['なし', '25%', '50%', '75%', '100%']);
  });

  it('ツールバーの並びは実物 (会場マップのスクリーンショット) と同じ 5 グループで、間に縦の区切り線を挟む', () => {
    renderMap();

    const row = screen.getByTestId('map-toolbar').firstElementChild as HTMLElement;
    // 実物の並び: 地図 | ズームアウト・拡大率・ズームイン | ジャンル表示・ジャンル |
    // 幅・高さ・元のサイズ | アンチエイリアス。区切り線は各グループの先頭に置く。
    expect(
      Array.from(row.children).map((child) =>
        child.getAttribute('role') === 'separator'
          ? '区切り'
          : (child.getAttribute('aria-label') ??
            child.querySelector('[aria-label]')?.getAttribute('aria-label') ??
            child.textContent?.trim() ??
            child.tagName),
      ),
    ).toEqual([
      '地図',
      '区切り',
      'ズームアウト',
      '拡大率',
      'ズームイン',
      '区切り',
      // 見出しは Static (ただの文字)、その右が濃さの ComboBox。
      'ジャンル表示',
      'ジャンル表示の濃さ',
      '区切り',
      '表示',
      '区切り',
      'アンチエイリアス',
    ]);

    const icons: Record<string, string> = {
      ズームアウト: TOOLBAR_ICONS.zoomOut,
      ズームイン: TOOLBAR_ICONS.zoomIn,
      幅に合わせる: TOOLBAR_ICONS.fitWidth,
      高さに合わせる: TOOLBAR_ICONS.fitHeight,
      元のサイズ: TOOLBAR_ICONS.actualSize,
      アンチエイリアス: TOOLBAR_ICONS.antiAlias,
    };
    for (const [label, icon] of Object.entries(icons)) {
      const button = within(row).getByRole('button', { name: label });
      expect(button.querySelector('img')).toHaveAttribute('src', icon);
      // アイコンだけのボタンなので aria-label と title の両方を持つ。
      expect(button).toHaveAttribute('title', label);
    }
  });

  it('「ジャンル表示」は押せるボタンではなくただの文字にする', () => {
    renderMap();

    const label = screen.getByText('ジャンル表示');
    // 実物は Static (押しても何も起きない見出し)。button にはしない。
    expect(label.tagName).toBe('SPAN');
    expect(label).not.toHaveAttribute('role', 'button');
    expect(screen.queryByRole('button', { name: 'ジャンル表示' })).toBeNull();
  });

  it('ウィンドウの最小幅は実物 (ヘルプのスクリーンショット WINDOW4.PNG) と同じ 690px にする', () => {
    renderMap();

    // 実物の会場マップ ウィンドウは 690x542 (解析/chm_out/IMAGES/WINDOW4.PNG)。
    // ツールバー 1 行 (実測のコントロール幅 + 区切り線 + gap) もこの幅に収まる。
    expect(screen.getByTestId('map-window')).toHaveStyle({ minWidth: '690px' });
  });

  it('拡大率のエディットは実物 (36px) より広く取って 3 桁の数字が余白つきで入るようにする', () => {
    renderMap();

    const zoom = screen.getByTestId('map-zoom');
    // 実測 36x18 は「100%」で左右の余白が 2px しか残らないため、実物の見た目
    // (文字 26px + 左右 4px ずつ) に合わせて 44px にする。
    expect(zoom.style.width).toBe('44px');
  });

  it('ツールバーは 1 段のライブラリ帯 (bandContainer) として描かれる', () => {
    renderMap();

    const toolbar = screen.getByTestId('map-toolbar');
    // 帯はライブラリの ToolbarBand (CSS Modules の bandContainer)。
    // 外周の溝 (上辺の外の暗 + 上辺の明 1px + silver 1px + 下辺の暗 2px) と
    // z-index/position/isolation はライブラリ CSS が持つ。
    expect(toolbar.className).toContain('bandContainer');
    // 1 段なので帯の直下は段 1 個だけ。段と段の間の横 Groove は挿さらない。
    const children = Array.from(toolbar.children);
    expect(children).toHaveLength(1);
    expect(children[0].className).toContain('bandRow');
    expect(
      children.some((child) => child.getAttribute('aria-orientation') === 'horizontal'),
    ).toBe(false);
  });

  it('ツールバー帯の内側はライブラリの Toolbar を 22px に詰めて収める', () => {
    renderMap();

    const toolbar = screen.getByTestId('map-toolbar');
    // ツールバーは `.window-body` の直下の第 1 子 (ウィンドウ枠から同じ位置)。
    expect(toolbar.parentElement?.className).toContain('window-body');
    expect(toolbar.parentElement?.firstElementChild).toBe(toolbar);

    // 中に入るライブラリの Toolbar 4 本 (ズームアウト / ズームイン / 表示 / アンチエイリアス) は、
    // 既定の上下の余白 1px を外して 22px に詰める
    // (22 + 1 + 1 = 24 のままだと帯の溝の内側からはみ出す)。
    const inner = toolbar.querySelectorAll<HTMLElement>('[role="toolbar"]');
    expect(inner).toHaveLength(4);
    for (const group of inner) {
      expect(group.style.height).toBe('22px');
      expect(group.style.padding).toBe('0px 2px');
    }
    // 帯の中の残りのコントロール (地図 / 拡大率 / ジャンル表示の濃さ) も帯の内側 (22px 以下) に収まる。
    const mapCombo = within(toolbar).getByLabelText('地図');
    expect(mapCombo.style.height).toBe('20px');
    expect(within(toolbar).getByLabelText('ジャンル表示の濃さ').style.height).toBe('20px');
    expect(within(toolbar).getByLabelText('拡大率').style.height).toBe('');
  });

  it('幅/高さに合わせる/元のサイズで表示倍率を変える', async () => {
    const { user, props } = renderMap();
    const board = screen.getByTestId('map-board');
    // jsdom はレイアウトしないので、ボードの実寸を差し込む (西12 の原寸は 1000x800)。
    // clientWidth / clientHeight は枠とスクロールバーを含まない。
    Object.defineProperty(board, 'clientWidth', { value: 500, configurable: true });
    Object.defineProperty(board, 'clientHeight', { value: 600, configurable: true });

    await user.click(screen.getByRole('button', { name: '幅に合わせる' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(0.5);

    await user.click(screen.getByRole('button', { name: '高さに合わせる' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(0.75);

    await user.click(screen.getByRole('button', { name: '元のサイズ' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(1);

    // 画像より極端に狭いときは元実装のズーム範囲 (25%〜300%) に収める。
    Object.defineProperty(board, 'clientWidth', { value: 100, configurable: true });
    await user.click(screen.getByRole('button', { name: '幅に合わせる' }));
    expect(props.onZoomChange).toHaveBeenLastCalledWith(0.25);
  });

  it('アンチエイリアスのボタンで画像の描画を切り替える', async () => {
    const { user } = renderMap();
    const button = screen.getByRole('button', { name: 'アンチエイリアス' });
    const image = screen.getByTestId('map-image');

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(image).toHaveStyle({ imageRendering: 'auto' });

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(image).toHaveStyle({ imageRendering: 'pixelated' });

    await user.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(image).toHaveStyle({ imageRendering: 'auto' });
  });

  it('ジャンル表示の濃さを選ぶと ComboBox の値が変わり、その濃さでジャンル色を重ねる', async () => {
    const { user } = renderMap();

    const density = screen.getByLabelText('ジャンル表示の濃さ');
    // 既定は「なし」= 重ねない。
    expect(density).toHaveValue('0');
    expect(screen.queryByTestId('map-genre')).toBeNull();

    await user.selectOptions(density, '50');
    expect(density).toHaveValue('50');
    // サークルのある席に、ジャンル色 (VGA 原色をジャンル ID 順に割り当て) を 50% で重ねる。
    const genres = screen.getAllByTestId('map-genre');
    expect(genres.length).toBeGreaterThan(0);
    const genre = genres[0];
    expect(genre.getAttribute('fill')).toBe(genreColor(14));
    expect(genre.getAttribute('fill-opacity')).toBe('0.5');
    expect(genreColor(14)).toBe('#008080');
    // チェック色はジャンル色の上に重なる (別の矩形)。
    const checked = screen.getAllByTestId('map-seat').filter((seat) => seat.dataset.color === '3');
    expect(checked.length).toBeGreaterThan(0);
  });

  it('SVG が読み込めないときは従来の PNG にフォールバックする', () => {
    renderMap();

    const image = screen.getByTestId('map-image');
    expect(image).toHaveAttribute('src', '/maps/W12.svg');

    fireEvent.error(image);
    expect(image).toHaveAttribute('src', '/maps/W12.png');
  });

  it('同梱カタログの机でもマスのキーが重複しない', () => {
    const catalog = dummy as CatalogData;
    const entries: MapWindowEntry[] = catalog.layouts
      .filter((layout) => layout.mapId === 1)
      .map((layout) => {
        const seat = (sub: number): MapWindowSeat => ({
          circle:
            catalog.circles.find(
              (circle) =>
                circle.blockId === layout.blockId &&
                circle.spaceNo === layout.spaceNo &&
                circle.spaceNoSub === sub,
            ) ?? null,
          color: null,
        });
        return { layout, seatA: seat(0), seatB: seat(1) };
      });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderMap({
        info: catalog.info,
        maps: catalog.maps,
        entries,
        activeMapId: 1,
        imageUrl: '/maps/W12.png',
      });

      const cells = screen.getAllByTestId('map-cell');
      expect(cells).toHaveLength(entries.length);
      expect(
        entries.filter((entry) => entry.seatA.circle !== null || entry.seatB.circle !== null),
      ).not.toHaveLength(0);
      // key が重複していると React が console.error に出す。
      const messages = error.mock.calls.map((call) => call.map(String).join(' '));
      expect(messages.filter((message) => message.includes('same key'))).toEqual([]);
      // 席は地図 (西12 は 1000x800) の中に収まる。
      for (const cell of cells) {
        for (const seat of within(cell).getAllByTestId('map-seat')) {
          expect(Number(seat.getAttribute('x'))).toBeLessThan(1000);
          expect(Number(seat.getAttribute('y'))).toBeLessThan(800);
        }
      }
    } finally {
      error.mockRestore();
    }
  });
});
