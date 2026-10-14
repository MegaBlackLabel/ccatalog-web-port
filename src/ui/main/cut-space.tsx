import type { CSSProperties } from 'react';
import type { CheckColor } from '../../app/catalog-state';
import { checkColorHex, checkColorText } from '../check-colors';
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

/** ボックスの中に描くスペース番号の文字サイズ (原寸 178x253 のセル基準。実物も固定サイズ)。 */
export const CUT_SPACE_FONT_SIZE = Math.max(8, Math.round(253 / 20));

/** 元実装と同じスペース番号の表記 (「12a」/「12b」)。 */
export function cutSpaceLabel(circle: Pick<Circle, 'spaceNo' | 'spaceNoSub'>): string {
  return `${circle.spaceNo}${circle.spaceNoSub === 1 ? 'b' : 'a'}`;
}

const BASE_STYLE: CSSProperties = {
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  overflow: 'hidden',
};

export type CutSpaceBoxProps = {
  /** 「12a」のようなスペース番号。 */
  space: string;
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
export function CutSpaceBox({ space, color, colors, className, style, ...rest }: CutSpaceBoxProps) {
  return (
    <span
      className={className}
      style={{
        ...BASE_STYLE,
        left: `${CUT_SPACE_BOX.left * 100}%`,
        top: `${CUT_SPACE_BOX.top * 100}%`,
        width: `${CUT_SPACE_BOX.width * 100}%`,
        height: `${CUT_SPACE_BOX.height * 100}%`,
        fontSize: CUT_SPACE_FONT_SIZE,
        ...(color === undefined
          ? null
          : { background: checkColorHex(color, colors), color: checkColorText(color, colors) }),
        ...style,
      }}
      {...rest}
    >
      {space}
    </span>
  );
}
