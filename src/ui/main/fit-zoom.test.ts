import { describe, expect, it } from 'vitest';
import { fitZoom, FIT_ZOOM_MAX, FIT_ZOOM_MIN } from './fit-zoom';

/** ダミーカタログと同じカットの表示サイズ。 */
const CUT = { width: 178, height: 253 };

describe('fitZoom — カットビューの表示領域に合わせる拡大率', () => {
  it('幅に合わせる: 6 列が横に収まる倍率 (0.5 = 178x253 のカットが 89x126.5 で 6 列)', () => {
    expect(fitZoom('width', { width: 534, height: 9999 }, CUT, 6, 6)).toBeCloseTo(0.5, 5);
  });

  it('高さに合わせる: 行数ぶんが縦に収まる倍率', () => {
    // 6 行 x 253px を 759px に収める。
    expect(fitZoom('height', { width: 9999, height: 759 }, CUT, 6, 6)).toBeCloseTo(0.5, 5);
  });

  it('全体を表示: 幅と高さの両方が収まる小さい方', () => {
    // 幅は 100%、高さは 50% なので 50%。
    expect(fitZoom('all', { width: 1068, height: 759 }, CUT, 6, 6)).toBeCloseTo(0.5, 5);
  });

  it('表示領域が未計測 (幅か高さが 0) のときは 100% のまま', () => {
    expect(fitZoom('all', { width: 0, height: 0 }, CUT, 6, 6)).toBe(1);
    expect(fitZoom('width', { width: 500, height: 0 }, CUT, 6, 6)).toBe(1);
  });

  it('倍率は 25%〜300% に収める (極端に狭い / 広いウィンドウ)', () => {
    expect(fitZoom('width', { width: 10, height: 9999 }, CUT, 6, 6)).toBe(FIT_ZOOM_MIN);
    expect(fitZoom('width', { width: 99999, height: 9999 }, CUT, 6, 6)).toBe(FIT_ZOOM_MAX);
  });
});
