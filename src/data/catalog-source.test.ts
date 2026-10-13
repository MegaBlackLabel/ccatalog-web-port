import { describe, expect, it } from 'vitest';
import type { AreaInfo, BlockInfo, CatalogData, Circle, MapInfo } from '../domain/types';
import { DUMMY_CATALOG } from './catalog-source';
import dummy from './fixtures/dummy-catalog.json';

/**
 * 同梱のダミーカタログの構造を守るテスト。
 *
 * 構造 (info / dates / areas / blocks / genres / maps と机の座標) は実物の ccatalog96.db の
 * 値そのものなので、生成 (tools/gen-dummy-data.py) が壊れたらここで気付けるようにする。
 */
const catalog = dummy as CatalogData;

/** 実物のカットは 6x6 の格子 (cutIndex 1〜36)。机は 10px ピッチ。 */
const CUTS_PER_PAGE = 36;
const DESK_PITCH = 10;
/** 実物の ComiketCircle の最初のページ。 */
const FIRST_PAGE = 104;

const ascending = (a: number, b: number) => a - b;

// 実物の主キー (エリア ID / ブロック ID / 地図 ID) で引く。静的な表なので Record。
const areaById: Record<number, AreaInfo> = {};
const blockById: Record<number, BlockInfo> = {};
const mapById: Record<number, MapInfo> = {};
for (const area of catalog.areas) areaById[area.id] = area;
for (const block of catalog.blocks) blockById[block.id] = block;
for (const map of catalog.maps) mapById[map.id] = map;

/** 実物の関係 (ブロック → 地区) で机の地区を引く。 */
const areaOf = (blockId: number): AreaInfo => areaById[blockById[blockId]?.areaId ?? 0];

const placed = catalog.circles.filter((circle) => circle.blockId > 0);
const missed = catalog.circles.filter((circle) => circle.blockId === 0);

describe('同梱のダミーカタログ — 実物の構造', () => {
  it('構造テーブルは実物 DB の値 (info / dates / maps / genres)', () => {
    expect(catalog.info).toEqual({
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
    });
    expect(catalog.dates).toEqual([
      { id: 1, year: 2019, month: 8, day: 9, weekday: 6 },
      { id: 2, year: 2019, month: 8, day: 10, weekday: 7 },
      { id: 3, year: 2019, month: 8, day: 11, weekday: 1 },
      { id: 4, year: 2019, month: 8, day: 12, weekday: 2 },
    ]);
    expect(catalog.maps).toEqual([
      { id: 1, name: '西12', filename: 'W12', w: 1000, h: 800, allFilename: 'A3' },
      { id: 2, name: '西34', filename: 'W34', w: 760, h: 800, allFilename: 'A4' },
      { id: 3, name: '南12', filename: 'S12', w: 800, h: 460, allFilename: 'A6' },
      { id: 4, name: '南34', filename: 'S34', w: 800, h: 460, allFilename: 'A7' },
    ]);
    expect(catalog.genres).toHaveLength(50);
    expect(catalog.genres[0]).toEqual({ id: 1, name: '創作(少年)', code: 111 });
    expect(catalog.genres[49]).toEqual({ id: 50, name: 'ノンジャンル', code: 999 });
  });

  it('地区とブロックは実物 DB の値 (壁の地区は印刷範囲 0x0)', () => {
    expect(catalog.areas).toHaveLength(12);
    expect(areaById[2]).toEqual({
      id: 2,
      name: '西2',
      simpleName: '西',
      mapId: 1,
      x: 500,
      y: 0,
      w: 500,
      h: 800,
      allFilename: 'W2',
    });
    // 壁の地区 (西2壁) には印刷範囲が無いので机を置かない。
    expect(areaById[1]).toMatchObject({ name: '西2壁', x: 0, y: 0, w: 0, h: 0 });

    expect(catalog.blocks).toHaveLength(100);
    expect(catalog.blocks[0]).toEqual({ id: 1, name: 'あ', areaId: 1 });
    expect(catalog.blocks[99]).toEqual({ id: 100, name: 'リ', areaId: 12 });
    for (const block of catalog.blocks) {
      expect(areaById[block.areaId], block.name).toBeDefined();
    }
  });

  it('ローダーは件数入りのラベルで同じデータを返す', async () => {
    const loaded = await DUMMY_CATALOG.load();

    expect(loaded.circles).toHaveLength(catalog.circles.length);
    expect(loaded.layouts).toEqual(catalog.layouts);
    expect(loaded.maps).toEqual(catalog.maps);
    expect(DUMMY_CATALOG.label).toContain('コミックマーケット96');
    expect(DUMMY_CATALOG.label).toContain(`${catalog.circles.length} 件`);
  });

  it('(blockId, spaceNo) はカタログ全体で一意で、番号は 1 から連番', () => {
    const spots = placed.map((circle) => `${circle.blockId}-${circle.spaceNo}`);
    expect(new Set(spots).size).toBe(spots.length);

    for (const blockId of new Set(placed.map((circle) => circle.blockId))) {
      const spaces = placed
        .filter((circle) => circle.blockId === blockId)
        .map((circle) => circle.spaceNo)
        .sort(ascending);
      expect(spaces).toEqual(spaces.map((_, index) => index + 1));
    }

    // 抽選漏れ (実物と同じく day / blockId / spaceNo / pageNo / cutIndex が 0) も入れてある。
    expect(missed.length).toBeGreaterThan(0);
    for (const circle of missed) {
      expect([circle.day, circle.blockId, circle.spaceNo, circle.pageNo, circle.cutIndex]).toEqual([
        0, 0, 0, 0, 0,
      ]);
    }
  });

  it('layouts は使った (blockId, spaceNo) のぶんだけで、重複も無い', () => {
    const deskKeys = catalog.layouts.map(
      (layout) => `${layout.mapId}-${layout.blockId}-${layout.spaceNo}`,
    );
    const spotKeys = placed.map(
      (circle) => `${areaOf(circle.blockId).mapId}-${circle.blockId}-${circle.spaceNo}`,
    );

    expect(catalog.layouts).toHaveLength(placed.length);
    expect(new Set(deskKeys).size).toBe(deskKeys.length);
    // サークルと机は 1 対 1。
    expect(new Set(deskKeys)).toEqual(new Set(spotKeys));
    for (const layout of catalog.layouts) {
      expect([0, 90]).toContain(layout.layout);
    }
  });

  it('机は地区の印刷範囲の内側に 10px ピッチで並ぶ', () => {
    const deskSize = catalog.info.mapSizeW;

    for (const layout of catalog.layouts) {
      const area = areaOf(layout.blockId);
      const map = mapById[layout.mapId];
      expect(area).toBeDefined();
      expect(map).toBeDefined();
      expect(layout.mapId).toBe(area?.mapId);
      expect(area.w).toBeGreaterThan(0);
      expect(area.h).toBeGreaterThan(0);
      // 机 1 つ分が地区の印刷範囲 (= 地図の範囲) の内側に収まる。
      expect(layout.xpos).toBeGreaterThanOrEqual(area.x);
      expect(layout.ypos).toBeGreaterThanOrEqual(area.y);
      expect(layout.xpos + deskSize).toBeLessThanOrEqual(area.x + area.w);
      expect(layout.ypos + deskSize).toBeLessThanOrEqual(area.y + area.h);
      expect(layout.xpos + deskSize).toBeLessThanOrEqual(map.w);
      expect(layout.ypos + deskSize).toBeLessThanOrEqual(map.h);
    }

    for (const blockId of new Set(catalog.layouts.map((layout) => layout.blockId))) {
      const desks = catalog.layouts.filter((layout) => layout.blockId === blockId);
      const positions = desks.map((layout) => `${layout.xpos}-${layout.ypos}`);
      expect(new Set(positions).size).toBe(positions.length);
      for (const key of ['xpos', 'ypos'] as const) {
        const values = [...new Set(desks.map((layout) => layout[key]))].sort(ascending);
        for (let i = 1; i < values.length; i += 1) {
          expect((values[i] - values[i - 1]) % DESK_PITCH).toBe(0);
        }
      }
    }
  });

  it('ページは 36 席そろい、日程ごとの連番になっている', () => {
    const pages = new Map<number, Circle[]>();
    for (const circle of placed) {
      pages.set(circle.pageNo, [...(pages.get(circle.pageNo) ?? []), circle]);
    }
    const pageNos = [...pages.keys()].sort(ascending);

    expect(pageNos[0]).toBe(FIRST_PAGE);
    expect(pageNos).toEqual(pageNos.map((_, index) => FIRST_PAGE + index));
    for (const [pageNo, pageCircles] of pages) {
      expect(pageCircles, `${pageNo} ページ`).toHaveLength(CUTS_PER_PAGE);
      expect(pageCircles.map((circle) => circle.cutIndex).sort(ascending)).toEqual(
        Array.from({ length: CUTS_PER_PAGE }, (_, index) => index + 1),
      );
      // 1 ページは 1 日程ぶん。
      expect(new Set(pageCircles.map((circle) => circle.day)).size).toBe(1);
    }

    // 日程ごとにページが連番で並び、どの日程にもサークルがある。
    for (const date of catalog.dates) {
      const dayPages = pageNos.filter((pageNo) => pages.get(pageNo)?.[0].day === date.id);
      expect(dayPages.length, `${date.id} 日目`).toBeGreaterThan(0);
      expect(dayPages).toEqual(dayPages.map((_, index) => dayPages[0] + index));
    }
  });

  it('サークルの位置・日程・ジャンルは実物の範囲に収まる', () => {
    const dayIds = catalog.dates.map((date) => date.id);
    for (const circle of placed) {
      expect(dayIds).toContain(circle.day);
      expect(catalog.genres.some((genre) => genre.id === circle.genreId)).toBe(true);
      expect(areaOf(circle.blockId)).toBeDefined();
      // 読みがなは実物と同じ半角カナ。
      expect(circle.circleKana).toMatch(/^[\uff61-\uff9f]+$/);
    }
  });
});
