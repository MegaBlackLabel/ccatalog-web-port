export type PackToolbarRowsOptions = {
    /** 段の中の項目の間隔 (px)。CSS 変数 `--win98-toolbar-gap` と同じ値にする。既定 1 */
    gap?: number;
    /** 次の項目と離さない項目 (ラベルとコントロールなど)。index ごとの真偽 */
    keepWithNext?: readonly boolean[];
};
/**
 * 計測した幅を、段の幅に入る範囲で左から詰める。
 *
 * 実物のドッキング ツールバーと同じく 1 項目まるごと次の段へ回し、途中で切らない。
 * `keepWithNext` の項目は、次の項目が同じ段に入らないときは段の末尾に残さず次の段の先頭にする。
 */
export declare function packToolbarRows(widths: readonly number[], available: number, { gap, keepWithNext }?: PackToolbarRowsOptions): number[][];
export type UseToolbarRowsOptions = {
    /** 段に並べる項目の数 */
    count: number;
    /** 段の中の項目の間隔 (px)。既定 1 (`--win98-toolbar-gap` と同じ) */
    gap?: number;
    /** 段 (帯) 自身が左右に持つ余白 (px)。使える幅から差し引く。既定 0 (`ToolbarRow` は余白を持たない) */
    paddingX?: number;
    /** 次の項目と離さない項目 (ラベルとコントロールなど)。index ごとの真偽 */
    keepWithNext?: readonly boolean[];
    /**
     * 項目の幅の測り方。既定は `element.getBoundingClientRect().width`。
     * 項目が区切り線を自分の前に持つ場合など、要素の幅に足して詰めたいときに差し替える。
     */
    measure?: (element: HTMLElement, index: number) => number;
};
export type UseToolbarRowsResult = {
    /** 幅を測る帯の要素に付ける ref */
    stripRef: (element: HTMLElement | null) => void;
    /** 項目ごとの ref。`ref={(el) => { itemRefs.current[index] = el; }}` の形で付ける */
    itemRefs: React.RefObject<(HTMLElement | null)[]>;
    /** 段分け (項目 index の配列の配列)。計測できるまでは 1 段 */
    rows: number[][];
};
/**
 * ツールバーを段に折り返すための計測と詰め。
 *
 * 帯の幅と各項目の幅を測り、`packToolbarRows` で段に詰める。ウィンドウのリサイズ、
 * フォントの読み込み、項目の増減で詰め直す。`ResizeObserver` が無い環境
 * (SSR・古いブラウザ) では計測せず 1 段のまま返す。
 *
 * 使い方:
 * ```tsx
 * const { stripRef, itemRefs, rows } = useToolbarRows({ count: items.length, gap: 2 });
 * <ToolbarBand
 *   ref={stripRef}
 *   rows={rows.map((row) => (
 *     <Toolbar key={row[0]} variant="band" items={row.map((i) => items[i])} />
 *   ))}
 * />
 * ```
 */
export declare function useToolbarRows({ count, gap, paddingX, keepWithNext, measure, }: UseToolbarRowsOptions): UseToolbarRowsResult;
