import { describe, expect, it } from 'vitest';
// Vite の ?raw でファイルそのものを読む (生成物がそのまま配られるので、中身を見張る)。
import s12 from '../../../public/maps/S12.svg?raw';
import s34 from '../../../public/maps/S34.svg?raw';
import w12 from '../../../public/maps/W12.svg?raw';
import w34 from '../../../public/maps/W34.svg?raw';

/**
 * 会場マップの SVG (tools/gen-map-svg.py が生成) は、机のセルの座標 (DB の ComiketMap の
 * 印刷範囲 w1/h1) とそのまま重なる必要がある。元画像は高解像度版 (HMP*) で w2/h2 = 2 x w1/h1
 * なので、生成側の縮尺がずれると机の位置が全部ずれる。ファイルそのものを見張る。
 */
const MAPS: readonly [name: string, svg: string, width: number, height: number][] = [
  ['W12', w12, 1000, 800],
  ['W34', w34, 760, 800],
  ['S12', s12, 800, 460],
  ['S34', s34, 800, 460],
];

describe('会場マップの SVG', () => {
  it.each(MAPS)('%s.svg は DB の印刷範囲 (viewBox) に合わせてある', (_name, svg, width, height) => {
    expect(svg).toContain(`viewBox="0 0 ${width} ${height}"`);
    expect(svg).toContain(`width="${width}" height="${height}"`);
    // 拡大しても線が階段状にならないよう、shape-rendering でアンチエイリアスを切らない。
    expect(svg).not.toContain('shape-rendering');
  });
});
