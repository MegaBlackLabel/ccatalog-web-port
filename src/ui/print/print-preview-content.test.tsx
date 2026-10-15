import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ChecklistEntry } from '../../app/catalog-state';
import type { Circle, LayoutInfo, MapInfo } from '../../domain/types';
import {
  PrintCutPreview,
  PrintListPreview,
  PrintMapPreview,
  orderPrintRows,
  printTargetCircles,
} from './print-preview-content';

function makeCircle(over: Partial<Circle> & { id: number }): Circle {
  return {
    comiketNo: 96,
    pageNo: 104,
    cutIndex: over.id,
    day: 1,
    blockId: 5,
    spaceNo: over.id,
    spaceNoSub: 0,
    genreId: 1,
    circleName: `サークル${over.id}`,
    circleKana: 'ｻｰｸﾙ',
    penName: `ペン${over.id}`,
    bookName: '',
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
    ...over,
  };
}

const CIRCLES: Circle[] = [
  makeCircle({ id: 1, day: 1, blockId: 5 }),
  makeCircle({ id: 2, day: 2, blockId: 9 }),
  makeCircle({ id: 3, day: 1, blockId: 9 }),
  makeCircle({ id: 4, day: 0, blockId: 0 }),
];

const HALL: Record<number, string> = { 5: '東1', 9: '西2', 0: '' };
const circleOf = (id: number) => CIRCLES.find((circle) => circle.id === id);
const hallOf = (circle: Circle) => HALL[circle.blockId] ?? '';

const CHECKLIST: ChecklistEntry[] = [
  { circleId: 1, color: 1 },
  { circleId: 2, color: 3 },
  { circleId: 3, color: 3 },
  { circleId: 4, color: 0 },
];

const ALL = {
  days: [0, 1, 2, 3, 4],
  halls: ['東1', '西2', ''],
  colors: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};

describe('printTargetCircles (印刷範囲)', () => {
  it('すべてチェックならチェックリストの全部が対象になる', () => {
    expect(printTargetCircles(CHECKLIST, circleOf, hallOf, ALL).map((row) => row.circle.id)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it('日付・ホール・チェック色のどれか外れれば対象から外れる', () => {
    // 2 日目だけ
    expect(
      printTargetCircles(CHECKLIST, circleOf, hallOf, { ...ALL, days: [2] }).map((row) => row.circle.id),
    ).toEqual([2]);
    // 東1 だけ
    expect(
      printTargetCircles(CHECKLIST, circleOf, hallOf, { ...ALL, halls: ['東1'] }).map((row) => row.circle.id),
    ).toEqual([1]);
    // 色3 だけ
    expect(
      printTargetCircles(CHECKLIST, circleOf, hallOf, { ...ALL, colors: [3] }).map((row) => row.circle.id),
    ).toEqual([2, 3]);
    // 標準色 (0) は「標準色」のチェックで選ぶ
    expect(
      printTargetCircles(CHECKLIST, circleOf, hallOf, { ...ALL, colors: [0] }).map((row) => row.circle.id),
    ).toEqual([4]);
  });

  it('何もチェックしていなければ 1 件も出ない', () => {
    expect(printTargetCircles(CHECKLIST, circleOf, hallOf, { days: [], halls: [], colors: [] })).toEqual([]);
  });

  it('カタログに無いサークルは落とす', () => {
    const rows = printTargetCircles([{ circleId: 999, color: 1 }], circleOf, hallOf, ALL);
    expect(rows).toEqual([]);
  });
});

describe('orderPrintRows (印刷順 1139)', () => {
  const rows = printTargetCircles(CHECKLIST, circleOf, hallOf, ALL);

  it('チェックリスト順は登録順のまま', () => {
    expect(orderPrintRows(rows, 'checklist').map((row) => row.circle.id)).toEqual([1, 2, 3, 4]);
  });

  it('配置順は席番号の順、サークル名順は名前順', () => {
    expect(orderPrintRows(rows, 'space').map((row) => row.circle.spaceNo)).toEqual([1, 2, 3, 4]);
    expect(orderPrintRows(rows, 'name').map((row) => row.circle.circleName)).toEqual([
      'サークル1',
      'サークル2',
      'サークル3',
      'サークル4',
    ]);
  });

  it('色順はチェック色の順 (標準色 0 が先頭)', () => {
    expect(orderPrintRows(rows, 'color').map((row) => row.color)).toEqual([0, 1, 3, 3]);
  });
});

const MAP: MapInfo = { id: 1, name: '東123', filename: 'E123', w: 1000, h: 560 };
/** 用紙 (713x504) に収まってしかも原寸より小さい地図 (詰め方向の確認用)。 */
const SMALL_MAP: MapInfo = { id: 1, name: '東123', filename: 'E123', w: 300, h: 200 };
const LAYOUTS: LayoutInfo[] = [
  { mapId: 1, blockId: 5, spaceNo: 1, xpos: 100, ypos: 200, layout: 0 },
];

function mapPreview(over: Partial<Parameters<typeof PrintMapPreview>[0]> = {}) {
  const rows = [{ circle: makeCircle({ id: 1, blockId: 5, spaceNo: 1 }), color: 1 as const }];
  return (
    <PrintMapPreview
      map={MAP}
      imageUrl="/maps/E123.png"
      layouts={LAYOUTS}
      rows={rows}
      deskSize={{ width: 20, height: 20 }}
      blank={false}
      genreDensity={0}
      genreColorOf={() => '#ffffff'}
      {...over}
    />
  );
}

describe('PrintMapPreview (マップ印刷のプレビュー)', () => {
  it('用紙は A4 比で、地図は収まる倍率まで縮める (原寸より大きくはしない)', () => {
    render(mapPreview());

    const page = screen.getByTestId('preview-print-map');
    const inner = screen.getByTestId('preview-map-page');
    expect([page.style.width, page.style.height]).toEqual(['713px', '504px']);
    // 1000x560 を 713x504 の用紙へ: min(697/1000, 488/560) = 0.697。
    expect(parseFloat(inner.style.width)).toBeCloseTo(697, 0);
    expect(parseFloat(inner.style.height)).toBeCloseTo(390, 0);
    cleanup();

    // 縦のレイアウトは用紙も地図の収め方も入れ替わる。
    render(mapPreview({ landscape: false }));
    const portrait = screen.getByTestId('preview-print-map');
    expect([portrait.style.width, portrait.style.height]).toEqual(['504px', '713px']);
    // 縦は min(488/1000, 697/560) = 0.488 で、幅が効く。
    expect(parseFloat(screen.getByTestId('preview-map-page').style.width)).toBeCloseTo(488, 0);
  });

  it('用紙に収まる地図は拡大しない', () => {
    render(mapPreview({ map: SMALL_MAP }));

    expect(parseFloat(screen.getByTestId('preview-map-page').style.width)).toBe(300);
    expect(parseFloat(screen.getByTestId('preview-map-page').style.height)).toBe(200);
  });

  it('地図詰めの方向で地図の位置が変わる', () => {
    render(mapPreview({ map: SMALL_MAP, packing: 'leftBottom' }));

    expect(screen.getByTestId('preview-print-map')).toHaveAttribute('data-packing', 'leftBottom');
    const leftBottom = screen.getByTestId('preview-map-page');
    expect([leftBottom.style.left, leftBottom.style.top]).toEqual(['8px', '296px']);
    cleanup();

    render(mapPreview({ map: SMALL_MAP, packing: 'rightTop' }));
    const rightTop = screen.getByTestId('preview-map-page');
    expect([rightTop.style.left, rightTop.style.top]).toEqual(['405px', '8px']);
  });

  it('略図マップはチェックを入れたときだけ出て、回転で向きが変わる', () => {
    render(mapPreview());
    expect(screen.queryByTestId('preview-map-sketch')).not.toBeInTheDocument();
    cleanup();

    render(mapPreview({ sketch: true }));
    const plain = screen.getByTestId('preview-map-sketch');
    expect(plain).toHaveAttribute('data-rotated', 'false');
    expect(plain.querySelectorAll('rect[data-testid="preview-map-seat"]')).toHaveLength(1);
    cleanup();

    render(mapPreview({ sketch: true, rotateSketch: true }));
    expect(screen.getByTestId('preview-map-sketch')).toHaveAttribute('data-rotated', 'true');
  });

  it('チェック色一覧は使った色だけを出す', () => {
    render(mapPreview());
    expect(screen.queryByTestId('preview-map-legend')).not.toBeInTheDocument();
    cleanup();

    render(mapPreview({ colorLegend: true }));
    const legend = screen.getByTestId('preview-map-legend');
    expect(legend).toHaveTextContent('色 1');
    expect(legend).not.toHaveTextContent('色 0');
  });

  it('白地図印刷では位置を塗らない', () => {
    render(mapPreview({ blank: true, sketch: true }));
    expect(screen.queryAllByTestId('preview-map-seat')).toHaveLength(0);
  });
});

/** ページ割りをまたぐ件数の行 (横向き 1 ページ = 24 件)。 */
const MANY_ROWS = Array.from({ length: 30 }, (_, index) => ({
  circle: makeCircle({ id: 100 + index, spaceNo: 100 + index, blockId: 5 }),
  color: ((index % 9) + 1) as 1,
}));
const PRINT_ITEMS = ['サークル名', '配置', '色'];
const dayLabel = () => '1日目';
const genreName = () => 'ジャンルA';

describe('PrintListPreview (サークルリスト印刷のプレビュー)', () => {
  it('見出しに実施回と日付を出し、表は全幅・全高で組む', () => {
    render(
      <PrintListPreview
        rows={MANY_ROWS.slice(0, 2)}
        items={PRINT_ITEMS}
        title="コミックマーケット96 1日目 （金）"
        dayLabelOf={dayLabel}
        genreNameOf={genreName}
        printSequenceNumber={false}
        layout="portrait"
        pageNo={1}
        pageCount={1}
      />,
    );
    expect(screen.getByTestId('preview-list-title')).toHaveTextContent('コミックマーケット96 1日目 （金）');
    // ウインドウ幅いっぱいに広げる (用紙の幅で止めない)。
    const page = screen.getByTestId('preview-print-list');
    expect(page.style.width).toBe('100%');
    expect(page.style.maxWidth).toBe('none');
    expect(page.style.flex).toBe('1 1 auto');
    expect(page.style.padding).toBe('0px');
  });

  it('1 ページ目は横向き 24 件、2 ページ目は続きを出し、余りは空行で埋める', () => {
    render(
      <PrintListPreview
        rows={MANY_ROWS}
        items={PRINT_ITEMS}
        title=""
        dayLabelOf={dayLabel}
        genreNameOf={genreName}
        printSequenceNumber={false}
        layout="landscape1"
        pageNo={1}
        pageCount={2}
      />,
    );
    // thead 1 行 + 24 件。
    expect(screen.getAllByRole('row')).toHaveLength(25);
    cleanup();

    render(
      <PrintListPreview
        rows={MANY_ROWS}
        items={PRINT_ITEMS}
        title=""
        dayLabelOf={dayLabel}
        genreNameOf={genreName}
        printSequenceNumber={false}
        layout="landscape1"
        pageNo={2}
        pageCount={2}
      />,
    );
    // 実物と同じく、足りない行も罫線で埋める (2 ページ目は 6 件 + 空行 18)。
    expect(screen.getAllByRole('row')).toHaveLength(25);
  });

  it('サークル通し番号の印刷で No. 列が付き、2 ページ目は 25 から続く', () => {
    const { unmount } = render(
      <PrintListPreview
        rows={MANY_ROWS}
        items={PRINT_ITEMS}
        dayLabelOf={dayLabel}
        genreNameOf={genreName}
        printSequenceNumber
        layout="landscape1"
        pageNo={2}
        pageCount={2}
      />,
    );
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('No.');
    expect(screen.getAllByRole('cell')[0]).toHaveTextContent('25');
    unmount();
  });

  it('ヘッダーは実物と同じ白地に黒枠 (98.css の銀色を打ち消す)', () => {
    render(
      <PrintListPreview
        rows={MANY_ROWS.slice(0, 1)}
        items={PRINT_ITEMS}
        title=""
        dayLabelOf={dayLabel}
        genreNameOf={genreName}
        printSequenceNumber={false}
        layout="portrait"
        pageNo={1}
        pageCount={1}
      />,
    );
    const header = screen.getAllByRole('columnheader')[0] as HTMLElement;
    expect(header.style.background).toBe('rgb(255, 255, 255)');
    // 98.css の `table > thead > tr > *` が当てる銀色と 3D の陰を打ち消す。
    expect(header.style.boxShadow).toBe('none');
    expect(header.style.border).toContain('1px solid');
  });

  it('色の見本は印刷色を使う (12x12 + 1px 枠)', () => {
    render(
      <PrintListPreview
        rows={MANY_ROWS.slice(0, 2)}
        items={PRINT_ITEMS}
        dayLabelOf={dayLabel}
        genreNameOf={genreName}
        printSequenceNumber={false}
        layout="portrait"
        pageNo={1}
        pageCount={1}
        checkColors={['#010203', '#040506']}
      />,
    );
    const swatches = screen.getAllByTestId('preview-list-color');
    expect(swatches).toHaveLength(2);
    // 色1 → パレット 1 番目、色2 → 2 番目 (印刷色で描く)。
    expect([swatches[0].dataset.color, swatches[0].style.background]).toEqual(['1', 'rgb(1, 2, 3)']);
    expect([swatches[1].dataset.color, swatches[1].style.background]).toEqual(['2', 'rgb(4, 5, 6)']);
    expect([swatches[0].style.width, swatches[0].style.height]).toEqual(['12px', '12px']);
    expect(swatches[0].style.border).toContain('1px');
  });
});

describe('PrintCutPreview (サークルカット印刷のプレビュー)', () => {
  const cutProps = {
    rows: MANY_ROWS.slice(0, 7),
    cutSize: { width: 100, height: 140 },
    printFrame: false,
    cellWidth: 90,
    imageUrlOf: (circle: { id: number }) => `/cuts/${circle.id}.png`,
  };

  it('カット詰め方向で列数が変わる (横詰め 6 列 / 縦詰め 4 列)', () => {
    const { unmount } = render(<PrintCutPreview {...cutProps} cutPacking="horizontal" />);
    const grid = screen.getByTestId('preview-print-cut').firstElementChild as HTMLElement;
    expect(grid.style.gridTemplateColumns).toBe('repeat(6, 90px)');
    expect(screen.getAllByTestId('preview-cut-cell')).toHaveLength(7);
    unmount();

    render(<PrintCutPreview {...cutProps} cutPacking="vertical" />);
    const verticalGrid = screen.getByTestId('preview-print-cut').firstElementChild as HTMLElement;
    expect(verticalGrid.style.gridTemplateColumns).toBe('repeat(4, 90px)');
  });

  it('枠の印刷はセルに枠を付け、色の見本は印刷色を使う', () => {
    render(<PrintCutPreview {...cutProps} cutPacking="horizontal" printFrame checkColors={['#0a0b0c']} />);
    const cell = screen.getAllByTestId('preview-cut-cell')[0];
    expect(cell.style.border).toContain('solid');
    // 枠なしのときは枠を付けない。
    cleanup();
    render(<PrintCutPreview {...cutProps} cutPacking="horizontal" checkColors={['#0a0b0c']} />);
    expect(screen.getAllByTestId('preview-cut-cell')[0].style.border).toBe('');
    // 見本は印刷色 (色1 → パレット 1 番目)。
    expect(screen.getAllByTestId('preview-cut-color')[0].style.background).toBe('rgb(10, 11, 12)');
  });
});
