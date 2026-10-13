import type { CSSProperties } from 'react';
import type { CheckColor } from '../../app/catalog-state';
import { cutSpaceLabel, CutSpaceBox } from './cut-space';
import type { Circle, ComiketInfo } from '../../domain/types';

export type CircleCutViewProps = {
  /** 現在のページのサークル。 */
  circles: readonly Circle[];
  info: ComiketInfo | null;
  selectedId: number | null;
  /** チェック済みサークルの ID。 */
  checkedIds: ReadonlySet<number>;
  /**
   * サークル ID → チェック色 (0 = 標準色)。チェック済みのセルはスペース番号の
   * ボックスをこの色で塗る。渡さないときは標準色 (白) として扱う。
   */
  colorById?: ReadonlyMap<number, CheckColor>;
  onSelect: (id: number | null) => void;
  onOpenDetail: (id: number) => void;
  /** カーソルが乗っているセルのサークル (離れたら null)。元実装のステータスバー表示に使う。 */
  onHoverCircle?: (circle: Circle | null) => void;
  /** カット画像の URL。未指定ならテキストのみのプレースホルダを描く。 */
  imageUrl?: (circle: Circle) => string | undefined;
};

/** カット 1 枚の既定サイズ (カタログ情報が無いとき)。 */
const DEFAULT_CUT_WIDTH = 178;
const DEFAULT_CUT_HEIGHT = 253;

/** 実物のカットビューは 6 列の格子 (1 ページ 6x6 = cutIndex 1〜36。行数は枚数で決まる)。 */
const GRID_COLUMNS = 6;

/**
 * 格子の外側の余白とセルどうしの隙間 (縮小率の計算にも入れる)。
 * 実物のカットビューはカットが隙間なく並ぶので、どちらも 0 にする。
 */
const VIEW_PADDING = 0;
const CELL_GAP = 0;

const VIEW_STYLE: CSSProperties = {
  display: 'block',
  // 幅はセルを 1fr で縮めて合わせるので横スクロールは出さない。
  // 高さが入りきらないときは縦スクロールバーを出す (元実装の「幅に合わせる」相当)。
  overflowY: 'auto',
  overflowX: 'hidden',
  background: '#808080',
  flex: '1 1 0',
  minWidth: 0,
  minHeight: 0,
};

const EMPTY_STYLE: CSSProperties = {
  ...VIEW_STYLE,
  color: '#f0f0f0',
  fontSize: 12,
};

const CELL_STYLE: CSSProperties = {
  // 画像はカット枠 (画像に焼き込み済み) をそのまま出すので、文字も外枠も重ねない
  // (実物は枠の外に線も色も着けない)。セルは隙間なく並ぶ。
  position: 'relative',
  boxSizing: 'border-box',
  background: '#ffffff',
  cursor: 'default',
  overflow: 'hidden',
  userSelect: 'none',
};

const SELECTED_STYLE: CSSProperties = {
  outline: '2px solid #000080',
  outlineOffset: -2,
  background: '#dce9ff',
};

const IMAGE_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'fill',
  background: '#ffffff',
  // 画像は実物と同じ 635x903 で、ここでは 178x253 に縮小して描く (既定のなめらかな補間)。
};

export function CircleCutView({
  circles,
  info,
  selectedId,
  checkedIds,
  colorById,
  onSelect,
  onOpenDetail,
  onHoverCircle,
  imageUrl,
}: CircleCutViewProps) {
  const cutWidth = info?.cutSizeW || DEFAULT_CUT_WIDTH;
  const cutHeight = info?.cutSizeH || DEFAULT_CUT_HEIGHT;

  // 格子の原寸 (6 列 x 6 行 + 余白)。セルは 1fr なので、原寸は「これ以上広げない」上限。
  const gridWidth = GRID_COLUMNS * cutWidth + (GRID_COLUMNS - 1) * CELL_GAP + VIEW_PADDING * 2;

  if (circles.length === 0) {
    return (
      <div data-testid="cut-view" className="cut-view" style={EMPTY_STYLE}>
        サークルカットがありません
      </div>
    );
  }

  return (
    <div
      data-testid="cut-view"
      className="cut-view"
      style={VIEW_STYLE}
      onClick={(event) => {
        // カット以外 (背景や格子の隙間) のクリックは選択解除にする。
        if (!(event.target as HTMLElement).closest('.cut-cell')) onSelect(null);
      }}
    >
      <div
        style={{
          display: 'grid',
          // 幅いっぱいを 6 等分し、セルは cutSizeW/H の比率を保つ。
          // 幅が足りなければセルが縮み、高さが足りなければ縦スクロールバーが出る。
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
          gap: CELL_GAP,
          padding: VIEW_PADDING,
          boxSizing: 'border-box',
          width: '100%',
          // 実物の 100% 表示 (178x253) より大きくは広げない。
          maxWidth: gridWidth,
          margin: '0 auto',
        }}
      >
          {circles.map((circle) => {
            const isSelected = circle.id === selectedId;
            const isChecked = checkedIds.has(circle.id);
            const checkColor: CheckColor = colorById?.get(circle.id) ?? 0;
            const source = imageUrl?.(circle);
            // 元実装の表示と同じ「スペース番号 + a/b」。
            const space = cutSpaceLabel(circle);
            const className = [
              'cut-cell',
              isSelected ? 'cut-cell--selected' : '',
              isChecked ? 'cut-cell--checked' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={circle.id}
                className={className}
                style={{
                  ...CELL_STYLE,
                  // 幅は 1fr で決まるので、高さはカット枠の比率 (178:253 = 105:150) で決まる。
                  aspectRatio: `${cutWidth} / ${cutHeight}`,
                  ...(isSelected ? SELECTED_STYLE : {}),
                }}
                role="button"
                tabIndex={0}
                // 見出し帯のサークル名は画像に焼き込んであるため、DOM では
                // ツールチップとアクセシブル名でサークルを特定できるようにする。
                title={`${space} ${circle.circleName} / ${circle.penName}`}
                aria-label={`${space} ${circle.circleName} / ${circle.penName}`}
                onMouseEnter={() => onHoverCircle?.(circle)}
                onMouseLeave={() => onHoverCircle?.(null)}
                onFocus={() => onHoverCircle?.(circle)}
                onBlur={() => onHoverCircle?.(null)}
                onClick={() => onSelect(circle.id)}
                onDoubleClick={() => onOpenDetail(circle.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') onOpenDetail(circle.id);
                }}
              >
                {source ? (
                  <img className="cut-cell__image" src={source} alt="" style={IMAGE_STYLE} />
                ) : null}
                {/* スペース番号は実物と同じく左上のボックスの中に描く (チェック済みは色を塗る)。 */}
                <CutSpaceBox
                  className="cut-cell__space"
                  space={space}
                  color={isChecked ? checkColor : undefined}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}
