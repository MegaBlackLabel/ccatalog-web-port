import type { CSSProperties, ReactNode } from 'react';
import type { CheckColor, ChecklistEntry } from '../../app/catalog-state';
import type { Circle, LayoutInfo, MapInfo } from '../../domain/types';
import { CHECK_COLOR_IDS, checkColorHex, checkSwatchIcon } from '../check-colors';

/**
 * 印刷プレビューの 1 ページ (ダイアログ 300 のプレビュー面 3011 に出す中身)。
 *
 * 元実装は印刷形式ごとに用紙 1 枚ぶんの見本を描く
 * (プレビューは印刷ダイアログ / 印刷詳細設定の各ページから開ける。CHM 4PRINT/5PREVIEW.HTM)。
 * Web 版は各形式の実データで「用紙 1 枚」を組み立てる。
 */

/** 印刷範囲 (日付 / ホール / チェック色)。ダイアログ 163〜166 のチェックと同じ意味。 */
export type PrintPreviewTarget = {
  days: readonly number[];
  /** ホール (地区) 名。 */
  halls: readonly string[];
  /** チェック色 (0 = 標準色)。 */
  colors: readonly number[];
};

/** 印刷対象のサークル。チェックリストの中で、日付・ホール・チェック色が選ばれているもの。 */
export function printTargetCircles(
  checklist: readonly ChecklistEntry[],
  circleOf: (id: number) => Circle | undefined,
  hallOf: (circle: Circle) => string,
  target: PrintPreviewTarget,
): { circle: Circle; color: CheckColor }[] {
  return checklist
    .map((entry) => ({ entry, circle: circleOf(entry.circleId) }))
    .filter((row): row is { entry: ChecklistEntry; circle: Circle } => row.circle !== undefined)
    .filter(({ entry, circle }) => {
      if (!target.days.includes(circle.day)) return false;
      if (!target.halls.includes(hallOf(circle))) return false;
      return entry.color === 0 ? target.colors.includes(0) : target.colors.includes(entry.color);
    })
    .map(({ entry, circle }) => ({ circle, color: entry.color }));
}

/** 印刷順 (1139)。 */
export type PrintPreviewOrder = 'checklist' | 'space' | 'name' | 'color';

/** 印刷順で並べ替える。'checklist' はチェックリストの登録順のまま。 */
export function orderPrintRows<T extends { circle: Circle; color: CheckColor }>(
  rows: readonly T[],
  order: PrintPreviewOrder,
): T[] {
  if (order === 'checklist') return [...rows];
  return [...rows].sort((left, right) => {
    if (order === 'space') return left.circle.spaceNo * 2 + left.circle.spaceNoSub - (right.circle.spaceNo * 2 + right.circle.spaceNoSub);
    if (order === 'name') return left.circle.circleName.localeCompare(right.circle.circleName, 'ja');
    return left.color - right.color;
  });
}

/** 用紙 1 枚 (プレビューの白い面)。 */
const PAGE_STYLE: CSSProperties = {
  background: '#ffffff',
  color: '#000000',
  margin: '0 auto',
  boxShadow: '0 0 0 1px #404040',
  boxSizing: 'border-box',
};

/** サークル 1 件の印刷項目の値。 */
export function printRowValues(
  circle: Circle,
  color: CheckColor,
  dayLabel: string,
  genreName: string,
): Record<string, ReactNode> {
  return {
    サークル名: circle.circleName,
    読み: circle.circleKana,
    執筆者: circle.penName,
    発行誌: circle.bookName,
    補足: circle.description,
    メモ: circle.memo,
    位置: `${circle.spaceNo}${circle.spaceNoSub === 1 ? 'b' : 'a'}`,
    日付: dayLabel,
    ジャンル: genreName,
    色: color === 0 ? '標準色' : `色${color}`,
  };
}

/** サークルリスト印刷のプレビュー (1 ページ = 選んだ印刷項目の表)。 */
export function PrintListPreview({
  rows,
  items,
  dayLabelOf,
  genreNameOf,
  printSequenceNumber,
  layout,
  pageNo,
  pageCount,
  checkColors,
}: {
  /** 印刷色 (色の設定の印刷色)。見本に使う。 */
  checkColors?: readonly string[];
  rows: readonly { circle: Circle; color: CheckColor }[];
  /** 印刷項目 (1144)。 */
  items: readonly string[];
  dayLabelOf: (circle: Circle) => string;
  genreNameOf: (circle: Circle) => string;
  /** サークル通し番号の印刷 (1148)。 */
  printSequenceNumber: boolean;
  layout: string;
  pageNo: number;
  pageCount: number;
}): ReactNode {
  // 用紙 1 枚の見た目。レイアウト (1145) の縦横で紙の向きを変える。
  const landscape = layout.startsWith('landscape');
  const perPage = landscape ? 24 : 18;
  const start = (pageNo - 1) * perPage;
  const pageRows = rows.slice(start, start + perPage);

  return (
    <div
      data-testid="preview-print-list"
      style={{
        ...PAGE_STYLE,
        // ウインドウ幅に合わせる (はみ出させない)。
        width: '100%',
        maxWidth: landscape ? 900 : 680,
        minHeight: 460,
        padding: 12,
        fontSize: 10,
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            {printSequenceNumber ? <th style={HEADER_CELL_STYLE}>No.</th> : null}
            <th style={HEADER_CELL_STYLE}>色</th>
            {items.map((item) => (
              <th key={item} style={HEADER_CELL_STYLE}>
                {item}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.map(({ circle, color }, index) => {
            const values = printRowValues(circle, color, dayLabelOf(circle), genreNameOf(circle));
            return (
              <tr key={circle.id}>
                {printSequenceNumber ? (
                  <td style={CELL_STYLE}>{start + index + 1}</td>
                ) : null}
                <td style={CELL_STYLE}>
                  {/* チェックリストの表と同じ見本 (12x12 + 1px の枠)。色は印刷色。 */}
                  <span
                    data-testid="preview-list-color"
                    data-color={color}
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      border: '1px solid #808080',
                      verticalAlign: 'middle',
                      background: checkColorHex(color, checkColors),
                    }}
                  />
                </td>
                {items.map((item) => (
                  <td key={item} style={CELL_STYLE}>
                    {values[item] ?? ''}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 6, textAlign: 'right' }}>
        {`${pageNo} / ${pageCount} ページ`}
      </div>
    </div>
  );
}

const HEADER_CELL_STYLE: CSSProperties = {
  border: '1px solid #808080',
  background: '#dfdfdf',
  padding: '1px 3px',
  whiteSpace: 'nowrap',
};

const CELL_STYLE: CSSProperties = {
  border: '1px solid #d4d0c8',
  padding: '1px 3px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

/** サークルカット印刷のプレビュー (6 列のカット格子)。 */
export function PrintCutPreview({
  rows,
  cutSize,
  printFrame,
  cutPacking,
  cellWidth,
  imageUrlOf,
  checkColors,
}: {
  /** 印刷色 (色の設定の印刷色)。 */
  checkColors?: readonly string[];
  rows: readonly { circle: Circle; color: CheckColor }[];
  cutSize: { width: number; height: number };
  /** 枠の印刷 (1251)。 */
  printFrame: boolean;
  /** カット詰め方向 (1252 / 1253)。 */
  cutPacking: 'horizontal' | 'vertical';
  cellWidth: number;
  imageUrlOf: (circle: Circle) => string;
}): ReactNode {
  // 縦詰めは 4 列にして 1 列を長くする (元実装のカット詰め方向)。
  const columns = cutPacking === 'vertical' ? 4 : 6;
  return (
    <div
      data-testid="preview-print-cut"
      style={{ ...PAGE_STYLE, width: columns * cellWidth + 24, padding: 12 }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, ${cellWidth}px)`,
        }}
      >
        {rows.map(({ circle, color }) => (
          <div
            key={circle.id}
            data-testid="preview-cut-cell"
            style={{
              width: cellWidth,
              height: (cellWidth * cutSize.height) / cutSize.width,
              position: 'relative',
              background: '#ffffff',
              border: printFrame ? '1px solid #808080' : undefined,
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <img
              src={imageUrlOf(circle)}
              alt=""
              style={{ width: '100%', height: '100%', display: 'block' }}
            />
            <span
              data-testid="preview-cut-color"
              data-color={color}
              style={{
                position: 'absolute',
                left: '3.5%',
                top: '2.4%',
                width: '22.5%',
                height: '15.8%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: Math.max(7, Math.round(cellWidth / 12)),
                fontWeight: 700,
                background: checkColorHex(color, checkColors),
                color: '#ffffff',
              }}
            >
              {`${circle.spaceNo}${circle.spaceNoSub === 1 ? 'b' : 'a'}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** マップ印刷 / 白地図印刷のプレビュー (会場図 + チェックした机の塗り)。 */
export function PrintMapPreview({
  map,
  imageUrl,
  layouts,
  rows,
  deskSize,
  blank,
  genreDensity,
  genreColorOf,
  checkColors,
  sketch,
  rotateSketch,
  colorLegend,
  packing,
  landscape,
}: {
  /** 印刷色 (色の設定の印刷色)。 */
  checkColors?: readonly string[];
  map: MapInfo | undefined;
  imageUrl: string;
  /** 表示中の地図の机 (xpos / ypos の座標つき)。 */
  layouts: readonly LayoutInfo[];
  rows: readonly { circle: Circle; color: CheckColor }[];
  /** 机の大きさ (ComiketInfo の mapSizeW / mapSizeH)。 */
  deskSize: { width: number; height: number };
  /** 白地図印刷 (166) は位置を塗らない。 */
  blank: boolean;
  /** ジャンルを重ねて印刷 (1352 / 1451) の濃さ 0〜100。 */
  genreDensity: number;
  /** サークルのジャンル色。 */
  genreColorOf: (circle: Circle) => string;
  /** 略図マップの印刷 (1356 / 1456)。 */
  sketch?: boolean;
  /** 略図を地図表示に合わせて回転 (1357 / 1457)。 */
  rotateSketch?: boolean;
  /** チェック色一覧の印刷 (1349)。 */
  colorLegend?: boolean;
  /** 地図詰めの方向 (1359 / 1459)。 */
  packing?: 'leftBottom' | 'rightBottom' | 'center' | 'leftTop' | 'rightTop';
  /** 用紙の向き (レイアウト 1345 の縦横)。 */
  landscape?: boolean;
}): ReactNode {
  const width = map?.w ?? 800;
  const height = map?.h ?? 460;
  // 用紙 (A4 比) に地図を収めて、詰め方向の位置に置く。原寸より大きくはしない。
  const paper = landscape === false ? { width: 504, height: 713 } : { width: 713, height: 504 };
  const margin = 8;
  const fit = Math.min((paper.width - margin * 2) / width, (paper.height - margin * 2) / height, 1);
  const mapWidth = width * fit;
  const mapHeight = height * fit;
  const offset = (() => {
    switch (packing) {
      case 'rightBottom':
        return { x: paper.width - margin - mapWidth, y: paper.height - margin - mapHeight };
      case 'center':
        return { x: (paper.width - mapWidth) / 2, y: (paper.height - mapHeight) / 2 };
      case 'leftTop':
        return { x: margin, y: margin };
      case 'rightTop':
        return { x: paper.width - margin - mapWidth, y: margin };
      default:
        return { x: margin, y: paper.height - margin - mapHeight };
    }
  })();

  // 記号の机 (blockId + spaceNo) → 座標。
  const deskOf = new Map(layouts.map((layout) => [`${layout.blockId}-${layout.spaceNo}`, layout]));
  const seats = rows.map(({ circle, color }) => ({
    layout: deskOf.get(`${circle.blockId}-${circle.spaceNo}`),
    color,
    circle,
  }));
  // チェック色一覧に出す色 (印刷範囲に出てくる色だけ)。
  const legendColors = [...new Set(rows.map(({ color }) => color))].sort((a, b) => a - b);

  const seatRects = seats.map(({ layout, color, circle }) => {
    if (layout === undefined || blank) return null;
    const half = deskSize.width / 2;
    const x = circle.spaceNoSub === 1 ? layout.xpos + half : layout.xpos;
    return (
      <g key={circle.id}>
        {genreDensity > 0 ? (
          <rect
            x={layout.xpos}
            y={layout.ypos}
            width={deskSize.width}
            height={deskSize.height}
            fill={genreColorOf(circle)}
            fillOpacity={genreDensity / 100}
            data-testid="preview-map-genre"
          />
        ) : null}
        <rect
          data-testid="preview-map-seat"
          data-seat={circle.spaceNoSub === 1 ? 'b' : 'a'}
          x={x}
          y={layout.ypos}
          width={half}
          height={deskSize.height}
          fill={checkColorHex(color, checkColors)}
          style={{ mixBlendMode: 'multiply', opacity: 0.7 }}
        />
      </g>
    );
  });

  return (
    <div
      data-testid="preview-print-map"
      data-packing={packing ?? 'leftBottom'}
      style={{ ...PAGE_STYLE, width: paper.width, height: paper.height, padding: 0, position: 'relative' }}
    >
      <div
        data-testid="preview-map-page"
        style={{ position: 'absolute', left: offset.x, top: offset.y, width: mapWidth, height: mapHeight }}
      >
        <img src={imageUrl} alt="" style={{ width: mapWidth, height: mapHeight, display: 'block' }} />
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={mapWidth}
          height={mapHeight}
          style={{ position: 'absolute', left: 0, top: 0 }}
        >
          {seatRects}
        </svg>
      </div>

      {/* 略図マップ (右上)。回転を入れると地図の向きに合わせて 90 度回す。 */}
      {sketch ? (
        <div
          data-testid="preview-map-sketch"
          data-rotated={rotateSketch ? 'true' : 'false'}
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            width: rotateSketch ? 60 : 84,
            height: rotateSketch ? 84 : 60,
            border: '1px solid #808080',
            background: '#ffffff',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            width={rotateSketch ? 60 : 84}
            height={rotateSketch ? 84 : 60}
            style={{ transform: rotateSketch ? 'rotate(90deg)' : undefined }}
            preserveAspectRatio="xMidYMid meet"
          >
            <image href={imageUrl} width={width} height={height} />
            {seatRects}
          </svg>
        </div>
      ) : null}

      {/* チェック色一覧 (左下)。 */}
      {colorLegend && legendColors.length > 0 ? (
        <div
          data-testid="preview-map-legend"
          style={{
            position: 'absolute',
            left: 8,
            bottom: 8,
            border: '1px solid #808080',
            background: '#ffffff',
            padding: 4,
            display: 'grid',
            gap: 2,
            fontSize: 10,
            color: '#000000',
          }}
        >
          {legendColors.map((color) => (
            <span key={color} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 12,
                  height: 12,
                  border: '1px solid #808080',
                  background: checkColorHex(color, checkColors),
                }}
              />
              {`色 ${color}`}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}


/** 印刷色の見本 (色1〜9)。 */
export function printColorLegend(colors: readonly string[]): ReactNode {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {CHECK_COLOR_IDS.map((color) => (
        <img
          key={color}
          data-testid="preview-color-swatch"
          src={checkSwatchIcon(colors[color - 1] ?? checkColorHex(color))}
          alt={`色${color}`}
          title={`色${color}`}
          style={{ width: 14, height: 14 }}
        />
      ))}
    </div>
  );
}
