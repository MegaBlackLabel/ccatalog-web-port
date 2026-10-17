import type { CSSProperties } from 'react';
import type { CheckColor } from '../../app/catalog-state';
import { checkColorHex } from '../check-colors';
import type { Circle } from '../../domain/types';

/**
 * 実物のカット枠 (635x903 = tools/cut-template.png) の左上ボックス (x 22..164 / y 22..164)。
 * カットの原寸 (178x253) に対する比率なので、どのウィンドウでも同じ位置に重なる
 * (サークルカット ウィンドウの格子、サークル詳細のカット欄。tools/gen-dummy-data.py も
 * 同じ位置に空のボックスを描いている)。
 */
export const CUT_SPACE_BOX = {
  left: 22 / 635,
  top: 22 / 903,
  width: 143 / 635,
  height: 143 / 903,
} as const;

/**
 * ボックスの中に描くスペース番号の文字サイズ。実物は数字がボックスいっぱいに入る
 * (カットの画像 118x167 を 10 倍に拡大して実測: ボックス 25px に対し数字の高さ 22px = 88%)。
 * カット 1 枚 (105x150) のボックスは 24px なので 21px にする。
 */
export const CUT_SPACE_FONT_SIZE = Math.round(CUT_SPACE_BOX.height * 150 * 0.88);

/**
 * スペース番号の表記。実物のカットの左上に出るのは数字だけ (「36」「37」) で、
 * a / b の区別は付かない。b のサークルはそもそも番号ボックスを持たない
 * (実測: a のセルにだけ見出し帯の左に区切り線がある)。
 */
export function cutSpaceLabel(circle: Pick<Circle, 'spaceNo' | 'spaceNoSub'>): string {
  return String(circle.spaceNo);
}

const BASE_STYLE: CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // 実物の数字は太字で、線幅が文字高の 20%。Roboto Bold (700) が 16% で一番近い
  // (実測: Roboto 400=8% / 500=14% / 700=16% / 900=43%)。
  fontFamily: "'Roboto', 'Pixelated MS Sans Serif', sans-serif",
  fontWeight: 700,
  overflow: 'hidden',
};

export type CutSpaceBoxProps = {
  /** 「12」のようなスペース番号。 */
  space: string;
  /**
   * カット 1 枚の高さの倍率 (既定 1 = 105x150 のカット)。サークル詳細は
   * カット欄が 214x304 なので 2.04 を渡し、番号も同じ比率で大きくする。
   */
  scale?: number;
  /** チェック色。渡すとその色で塗る (文字は色の明暗で白黒を選ぶ)。 */
  color?: CheckColor;
  /** 「色の設定」の 9 色 (動作設定)。未指定なら実物から実測した色。 */
  colors?: readonly string[];
  className?: string;
  style?: CSSProperties;
  'data-testid'?: string;
};

/**
 * カットの左上にあるスペース番号のボックス。チェック済みのカットはチェック色で塗る
 * (元実装のカットの見た目。色を指定していないサークルは標準色 = 緑)。
 */
export function CutSpaceBox({
  space,
  color,
  colors,
  className,
  scale = 1,
  style,
  ...rest
}: CutSpaceBoxProps) {
  return (
    <span
      className={className}
      style={{
        ...BASE_STYLE,
        left: `${CUT_SPACE_BOX.left * 100}%`,
        top: `${CUT_SPACE_BOX.top * 100}%`,
        width: `${CUT_SPACE_BOX.width * 100}%`,
        height: `${CUT_SPACE_BOX.height * 100}%`,
        fontSize: Math.round(CUT_SPACE_FONT_SIZE * scale),
        ...(color === undefined
          ? null
          // チェック色で塗っても文字は黒のまま (実物の数字はチェックの有無に関わらず黒)。
          : { background: checkColorHex(color, colors), color: '#000000' }),
        ...style,
      }}
      {...rest}
    >
      {space}
    </span>
  );
}
