import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CheckColor } from '../../app/catalog-state';
import type { Circle, ComiketInfo } from '../../domain/types';
import { CircleCutView } from './CircleCutView';

/**
 * 実物のカットビューは 6x6 の固定格子 (cutIndex 1〜36)。ここでは縦横の余白と
 * セルの隙間を含めた格子の原寸を確かめ、ウィンドウに入りきらないときの縮小も見る。
 */
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

// 実物はカットが隙間なく並ぶ (外側の余白もセルどうしの隙間も 0)。
const CELL_GAP = 0;
const VIEW_PADDING = 0;
const GRID_WIDTH = 6 * INFO.cutSizeW + 5 * CELL_GAP + VIEW_PADDING * 2;

function makeCircle(id: number): Circle {
  return {
    id,
    comiketNo: 96,
    pageNo: 104,
    cutIndex: id,
    day: 1,
    blockId: 5,
    spaceNo: id,
    spaceNoSub: 0,
    genreId: 1,
    circleName: `サークル${id}`,
    circleKana: 'ｻｰｸﾙ',
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
  };
}

/** jsdom にはレイアウトが無いので、カットビューの計測だけ差し替える。 */
function renderCutView(
  width: number,
  height: number,
  circles: Circle[],
  checkedIds: ReadonlySet<number> = new Set<number>(),
  colorById: ReadonlyMap<number, CheckColor> = new Map<number, CheckColor>(),
) {
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
  render(
    <CircleCutView
      circles={circles}
      info={INFO}
      selectedId={null}
      checkedIds={checkedIds}
      colorById={colorById}
      onSelect={vi.fn()}
      onOpenDetail={vi.fn()}
    />,
  );

  const view = screen.getByTestId('cut-view');
  return { view, grid: view.firstElementChild as HTMLElement };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CircleCutView — 6 列の格子 (実物のカット枠)', () => {
  it('カットは 6 列の格子に、カット枠の比率で並ぶ', () => {
    const circles = [makeCircle(1), makeCircle(2)];
    const { grid } = renderCutView(2000, 2000, circles);

    expect(grid).toHaveStyle({
      gridTemplateColumns: `repeat(6, minmax(0, 1fr))`,
      width: '100%',
    });
    // 原寸 (178x253 = 100%) より大きくは広げない。
    expect(grid).toHaveStyle({ maxWidth: `${GRID_WIDTH}px` });
    const cells = grid.querySelectorAll('.cut-cell');
    expect(cells).toHaveLength(circles.length);
    expect(cells[0]).toHaveStyle({ aspectRatio: `${INFO.cutSizeW} / ${INFO.cutSizeH}` });
  });

  it('高さが入りきらないときは縦スクロールバーを出す (横には出さない)', () => {
    const { view } = renderCutView(548, 400, [makeCircle(1)]);

    expect(view).toHaveStyle({ overflowY: 'auto', overflowX: 'hidden' });
  });

  it('カットは幅に合わせて縮み、その分は縦スクロールになる', () => {
    // 幅を 1fr で分けるので、セルの実寸は CSS 側 (aspect-ratio) が決める。
    const { grid } = renderCutView(548, 400, [makeCircle(1)]);
    const cell = grid.querySelector('.cut-cell') as HTMLElement;

    expect(cell.style.width).toBe('');
    expect(cell).toHaveStyle({ aspectRatio: `${INFO.cutSizeW} / ${INFO.cutSizeH}` });
  });

  it('スペース番号を実物のカット枠の左上ボックスの中に描く', () => {
    const { grid } = renderCutView(2000, 2000, [makeCircle(3)]);
    const cell = grid.querySelector('.cut-cell') as HTMLElement;
    const space = cell.querySelector('.cut-cell__space') as HTMLElement;

    expect(space).toHaveTextContent('3a');
    // 実物のカット枠 (635x903) の左上ボックス (x 22..164 / y 22..164) を比率で重ねる。
    expect(space.style.left).toBe(`${(22 / 635) * 100}%`);
    expect(space.style.top).toBe(`${(22 / 903) * 100}%`);
    expect(space.style.width).toBe(`${(143 / 635) * 100}%`);
    expect(space.style.height).toBe(`${(143 / 903) * 100}%`);
    // セルに置く番号は 1 つだけ。
    expect(cell.querySelectorAll('.cut-cell__space')).toHaveLength(1);
  });

  it('チェック済みはスペース番号のボックスを指定したチェック色で塗る', () => {
    const colors = new Map<number, CheckColor>([
      [1, 3], // 黄 (明るい色 → 文字は黒)
      [2, 9], // 赤 (暗い色 → 文字は白)
      [3, 0], // 標準色 (実物の会場マップで使われている緑)
    ]);
    const { grid } = renderCutView(
      2000,
      2000,
      [makeCircle(1), makeCircle(2), makeCircle(3)],
      new Set([1, 2, 3]),
      colors,
    );
    const spaces = [...grid.querySelectorAll('.cut-cell__space')] as HTMLElement[];

    expect(spaces[0]).toHaveStyle({ background: '#fff700', color: '#000000' });
    expect(spaces[1]).toHaveStyle({ background: '#ff0000', color: '#ffffff' });
    // 標準色 (実物の会場マップの緑) は中間の明るさなので、文字は白にする。
    expect(spaces[2]).toHaveStyle({ background: '#00c060', color: '#ffffff' });
  });

  it('チェック色は枠の外に着けない (実物は枠の中のスペース番号ボックスだけ)', () => {
    const colors = new Map<number, CheckColor>([[3, 9]]);
    const { grid } = renderCutView(2000, 2000, [makeCircle(3), makeCircle(4)], new Set([3]), colors);
    const cells = [...grid.querySelectorAll('.cut-cell')] as HTMLElement[];

    // チェック済みでもセル自身に枠・影・背景色を足さない (カットの枠は画像に焼き込み済み)。
    expect(cells[0].className).toContain('cut-cell--checked');
    expect(cells[0].style.border).toBe('');
    expect(cells[0].style.borderColor).toBe('');
    expect(cells[0].style.boxShadow).toBe('');
    // 未チェックのセルと同じ見た目。
    expect(cells[0].style.border).toBe(cells[1].style.border);
    expect(cells[0].style.boxShadow).toBe(cells[1].style.boxShadow);
  });

  it('カットどうしは隙間なく並ぶ (外側の余白も 0)', () => {
    const { grid } = renderCutView(2000, 2000, [makeCircle(1), makeCircle(2)]);

    expect(grid.style.gap).toBe('0px');
    expect(grid.style.paddingTop).toBe('0px');
    expect(grid.style.paddingLeft).toBe('0px');
    expect(grid.style.maxWidth).toBe(`${6 * INFO.cutSizeW}px`);
  });

  it('セルにサークル名を重ねて描かない (見出し帯に焼き込み済み)', () => {
    const { grid } = renderCutView(2000, 2000, [makeCircle(3)]);
    const cell = grid.querySelector('.cut-cell') as HTMLElement;

    // 見た目に出る文字はスペース番号だけ。名前は画像に焼き込んであるので DOM には重ねない。
    expect(cell.querySelector('.cut-cell__name')).toBeNull();
    expect(cell.querySelector('.cut-cell__caption')).toBeNull();
    expect(grid.querySelectorAll('.cut-cell__space')).toHaveLength(1);
    // 代わりにツールチップとアクセシブル名でサークルを特定できる。
    expect(cell).toHaveAttribute('aria-label', expect.stringContaining('サークル3'));
  });

  it('セルにカーソルが乗るとサークルを通知し、離れると null を通知する', async () => {
    const user = userEvent.setup();
    const onHoverCircle = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 2000, bottom: 2000, width: 2000, height: 2000,
      toJSON: () => ({}),
    });
    render(
      <CircleCutView
        circles={[makeCircle(3)]}
        info={null}
        selectedId={null}
        checkedIds={new Set<number>()}
        onSelect={vi.fn()}
        onOpenDetail={vi.fn()}
        onHoverCircle={onHoverCircle}
      />,
    );

    const cell = screen.getByRole('button', { name: /サークル3/ });
    await user.hover(cell);
    expect(onHoverCircle).toHaveBeenLastCalledWith(expect.objectContaining({ id: 3 }));
    await user.unhover(cell);
    expect(onHoverCircle).toHaveBeenLastCalledWith(null);
  });
});
