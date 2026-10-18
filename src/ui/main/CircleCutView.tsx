import { useEffect, useRef, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import type { CheckColor } from '../../app/catalog-state';
import type { ScrollMode } from '../../domain/app-settings';
import { cutSpaceLabel, CutSpaceBox } from './cut-space';
import type { FitBox } from './fit-zoom';
import type { Circle } from '../../domain/types';

export type CircleCutViewProps = {
  /** 現在のページのサークル。 */
  circles: readonly Circle[];
  /**
   * 格子の直上に出す配置情報 (実物は「9日（金）西2壁 あ36〜あ53」)。
   * アプリがページの先頭 / 末尾のサークルから組み立てて渡す。空なら帯を出さない。
   */
  heading?: string;
  /**
   * 配置情報の帯の寄せ。奇数ページは右寄せ、偶数ページは左寄せ (既定) にする。
   * 帯の白はカット格子と同じ幅のままで、寄せるのは中身の文字だけ。
   */
  headingAlign?: 'left' | 'right';
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
  /**
   * セル 1 枚の幅 (拡大率を掛けた実寸)。指定すると格子はこの幅の px 固定になり、
   * 入りきらない分はスクロールで見せる (元実装の「元のサイズ / 拡大率指定 / 高さに合わせる」)。
   * null / 未指定なら CSS の 1fr で幅に合わせる (今の既定 = 「幅に合わせる」)。
   */
  cellWidth?: number | null;
  /** カットビューの表示領域。アプリ側が「幅 / 高さ / 全体」に合わせる拡大率を計算するのに使う。 */
  onViewBoxChange?: (box: FitBox) => void;
  /**
   * 動作オプション (ダイアログ 150) のうち、カットビューの操作に関わるもの。
   * 省略時は既定 (シングルクリックでチェックしない / マウスに追従しない / リターンキーで次へ)。
   */
  operation?: CutViewOperation;
  /**
   * リターンキー / テンキーでチェックしたあとに呼ぶ。アプリ側が次のサークルへカーソルを移す
   * (動作設定 1021 / 1029「チェック時、カーソルを自動で次のサークルに移動」)。
   */
  onMoveNext?: (circle: Circle) => void;
  /** アンチエイリアス (表示メニュー 32792)。オフはカット画像をドット等倍で描く。 */
  antiAlias?: boolean;
  /** 「色の設定」の表示色 (動作設定)。未指定なら実物から実測した色。 */
  checkColors?: readonly string[];
};

/** カットビューの操作に関わる動作オプション (ダイアログ 150 の一部)。 */
export type CutViewOperation = {
  /** シングルクリックでチェックする (1026)。 */
  singleClickChecks: boolean;
  /** 選択カーソルをマウスカーソルに追従する (1024)。 */
  cursorFollowsMouse: boolean;
  /** リターンキーでチェック時、カーソルを次のサークルに移動 (1021)。 */
  enterMovesCursor: boolean;
  /** テンキーでチェック時、カーソルを次のサークルに移動 (1029)。 */
  tenkeyMovesCursor: boolean;
  /** 掴みスクロールの方式 (1023 Adobe / 1025 IE / 1027 ドラッグのみ)。 */
  scrollMode: ScrollMode;
};

export const DEFAULT_CUT_VIEW_OPERATION: CutViewOperation = {
  singleClickChecks: false,
  cursorFollowsMouse: false,
  enterMovesCursor: true,
  tenkeyMovesCursor: false,
  scrollMode: 'adobe',
};

/** カット 1 枚の既定サイズ (カタログ情報が無いとき)。 */
/**
 * カット 1 枚の表示サイズ。実物のカット画像 (`C096CUTL.CCZ` の 105x150。
 * 高解像度版は 211x300) と同じ実寸で並べる。実測 (`1-untitled.png` 相当の
 * カットウィンドウのスクリーンショット) でも 1 枚が 106x149 で、これは 105x150 と一致する。
 *
 * `ComiketInfo.cutSizeW/H` (178x253) は使わない。あれは C86 のヘルプでは
 * 「サークルカットをページ画像から切り抜くための情報」で、表示サイズではない。
 */
const DEFAULT_CUT_WIDTH = 105;
const DEFAULT_CUT_HEIGHT = 150;

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

/**
 * 格子の直上に出す配置情報の帯。実物は「9日（金）西2壁 あ36〜あ53」を
 * カット格子と同じ幅の白い帯に大きな文字で出す (実測: 帯の高さ 39px /
 * 文字の高さ 31px。ウィンドウ実寸のスクリーンショットから)。文字は画像ではなく
 * アプリがフォントで描く。余白は最小限にして、背景の白を格子の幅に合わせる。
 */
const HEADING_STYLE: CSSProperties = {
  background: '#ffffff',
  color: '#000000',
  fontSize: 31,
  lineHeight: 1,
  height: 39,
  display: 'flex',
  alignItems: 'center',
  padding: '0 2px',
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  userSelect: 'none',
};

const EMPTY_STYLE: CSSProperties = {
  ...VIEW_STYLE,
  color: '#f0f0f0',
  fontSize: 12,
};

/**
 * 拡大率を指定したとき (「元のサイズ / 拡大率指定 / 高さに合わせる / 全体を表示」) の見た目。
 * 幅に合わせるのと違い、格子が表示領域より広くなることがあるので横スクロールも出す。
 */
const SCROLL_VIEW_STYLE: CSSProperties = {
  ...VIEW_STYLE,
  overflowX: 'auto',
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
};

/**
 * 選択中のカットに重ねる水色のオーバーレイ。実物は選択したカットが水色に染まって
 * 見える (画像の上に半透明の水色を重ねる)。カット画像はセル全面を覆うので、
 * 背景色ではなく画像の上の層で表す。
 */
const SELECTED_OVERLAY_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(96, 176, 255, 0.4)',
  pointerEvents: 'none',
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
  heading = '',
  headingAlign = 'left',
  selectedId,
  checkedIds,
  colorById,
  onSelect,
  onOpenDetail,
  onHoverCircle,
  imageUrl,
  cellWidth,
  onViewBoxChange,
  operation = DEFAULT_CUT_VIEW_OPERATION,
  onMoveNext,
  antiAlias = true,
  checkColors,
}: CircleCutViewProps) {
  // カットの表示サイズは実物のカット画像の実寸 (105x150) を使う。
  // ComiketInfo の cutSizeW/H (178x253) はページ画像からの切り抜き領域で、表示サイズではない。
  const cutWidth = DEFAULT_CUT_WIDTH;
  const cutHeight = DEFAULT_CUT_HEIGHT;

  // 格子の原寸 (6 列 x 6 行 + 余白)。セルは 1fr なので、原寸は「これ以上広げない」上限。
  const gridWidth = GRID_COLUMNS * cutWidth + (GRID_COLUMNS - 1) * CELL_GAP + VIEW_PADDING * 2;

  // 拡大率を指定したときのセル幅。null なら CSS の 1fr で幅に合わせる (既定)。
  const fixedCellWidth = cellWidth ?? null;

  const viewRef = useRef<HTMLDivElement>(null);
  // カタログ読込前は「カットがありません」の枝を描くので ref が付かない。
  // カットが現れた時点でもう一度測れるよう、枝が変わる値 (hasCuts) も依存に入れる。
  const hasCuts = circles.length > 0;

  // 表示領域の大きさをアプリへ知らせる (「幅 / 高さ / 全体」に合わせる拡大率の計算元)。
  useEffect(() => {
    const element = viewRef.current;
    if (element === null || onViewBoxChange === undefined) return;
    const report = () => {
      const rect = element.getBoundingClientRect();
      onViewBoxChange({ width: rect.width, height: rect.height });
    };
    report();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(report);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onViewBoxChange, hasCuts]);

  // 掴みスクロール (動作設定 1023 Adobe / 1025 IE / 1027 ドラッグのみ)。
  // 方式ごとに「掴める操作」が違う: Adobe = スペースキー + 左ドラッグ、IE = 中ボタンドラッグ、
  // ドラッグのみ = 左ドラッグ。掴んでいる間はマウスの移動ぶんだけ逆にスクロールする。
  const grabStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const spaceHeld = useRef(false);

  useEffect(() => {
    if (operation.scrollMode !== 'adobe') return;
    const down = (event: KeyboardEvent) => {
      if (event.code === 'Space') spaceHeld.current = true;
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === 'Space') spaceHeld.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [operation.scrollMode]);

  const startGrab = (event: ReactMouseEvent<HTMLDivElement>) => {
    const grabbable =
      operation.scrollMode === 'drag'
        ? event.button === 0
        : operation.scrollMode === 'ie'
          ? event.button === 1
          : event.button === 0 && spaceHeld.current;
    if (!grabbable) return;
    const element = event.currentTarget;
    grabStart.current = {
      x: event.clientX,
      y: event.clientY,
      left: element.scrollLeft,
      top: element.scrollTop,
    };
    event.preventDefault();
  };

  const moveGrab = (event: ReactMouseEvent<HTMLDivElement>) => {
    const start = grabStart.current;
    if (start === null) return;
    event.currentTarget.scrollLeft = start.left - (event.clientX - start.x);
    event.currentTarget.scrollTop = start.top - (event.clientY - start.y);
  };

  const endGrab = () => {
    grabStart.current = null;
  };

  if (circles.length === 0) {
    return (
      <div data-testid="cut-view" className="cut-view" style={EMPTY_STYLE}>
        サークルカットがありません
      </div>
    );
  }

  return (
    <div
      ref={viewRef}
      data-testid="cut-view"
      className="cut-view"
      style={fixedCellWidth === null ? VIEW_STYLE : SCROLL_VIEW_STYLE}
      onMouseDown={startGrab}
      onMouseMove={moveGrab}
      onMouseUp={endGrab}
      onMouseLeave={endGrab}
      onClick={(event) => {
        // カット以外 (背景や格子の隙間) のクリックは選択解除にする。
        if (!(event.target as HTMLElement).closest('.cut-cell')) onSelect(null);
      }}
    >
      {heading ? (
        <div
          data-testid="cut-heading"
          style={{
            ...HEADING_STYLE,
            // 帯の白はカット格子と同じ幅にする (実物は 6 列ぶんの幅で、右の余白には伸びない)。
            // 拡大率を指定していても文字の幅で途切れさせない。
            width: fixedCellWidth === null ? '100%' : gridWidth,
            maxWidth: gridWidth,
            // 奇数ページは右寄せ、偶数ページは左寄せ (寄せるのは中身の文字だけ)。
            justifyContent: headingAlign === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          {heading}
        </div>
      ) : null}
      <div
        style={{
          display: 'grid',
          // 幅いっぱいを 6 等分し、セルは cutSizeW/H の比率を保つ。
          // 幅が足りなければセルが縮み、高さが足りなければ縦スクロールバーが出る。
          // 拡大率を指定したときは実寸 px の列にして、はみ出した分をスクロールで見せる。
          gridTemplateColumns:
            fixedCellWidth === null
              ? `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`
              : `repeat(${GRID_COLUMNS}, ${fixedCellWidth}px)`,
          gap: CELL_GAP,
          padding: VIEW_PADDING,
          boxSizing: 'border-box',
          width: fixedCellWidth === null ? '100%' : 'max-content',
          // 実物の 100% 表示 (178x253) より大きくは広げない。
          ...(fixedCellWidth === null ? { maxWidth: gridWidth } : null),
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
                onMouseEnter={() => {
                  onHoverCircle?.(circle);
                  // 動作設定 1024: 選択カーソルをマウスカーソルに追従する。
                  if (operation.cursorFollowsMouse) onSelect(circle.id);
                }}
                onMouseLeave={() => onHoverCircle?.(null)}
                onFocus={() => onHoverCircle?.(circle)}
                onBlur={() => onHoverCircle?.(null)}
                onClick={() => {
                  onSelect(circle.id);
                  // 動作設定 1026: シングルクリックでチェックする。
                  if (operation.singleClickChecks) onOpenDetail(circle.id);
                }}
                onDoubleClick={() => onOpenDetail(circle.id)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return;
                  onOpenDetail(circle.id);
                  // 動作設定 1021 / 1029: チェックしたらカーソルを次のサークルへ移す。
                  const moves =
                    event.code === 'NumpadEnter'
                      ? operation.tenkeyMovesCursor
                      : operation.enterMovesCursor;
                  if (moves) onMoveNext?.(circle);
                }}
              >
                {source ? (
                  <img
                    className="cut-cell__image"
                    src={source}
                    alt=""
                    style={{ ...IMAGE_STYLE, imageRendering: antiAlias ? 'auto' : 'pixelated' }}
                  />
                ) : null}
                {/*
                  スペース番号は実物と同じく左上のボックスの中に描く (チェック済みは色を塗る)。
                  実物がボックスを持つのは a のサークルだけ (実測: a のセルには見出し帯の左に
                  区切り線があり、b のセルには無い)。b のサークルは番号も枠も出さない。
                */}
                {circle.spaceNoSub === 0 ? (
                  <CutSpaceBox
                    className="cut-cell__space"
                    space={space}
                    color={isChecked ? checkColor : undefined}
                    colors={checkColors}
                  />
                ) : null}
                {/* 選択中はカットの上に水色のオーバーレイを重ねる (実物と同じ)。 */}
                {isSelected ? (
                  <span className="cut-cell__overlay" style={SELECTED_OVERLAY_STYLE} />
                ) : null}
              </div>
            );
          })}
      </div>
    </div>
  );
}
