import { Fragment, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import {
  Dropdown,
  Groove,
  StatusBar,
  StatusBarField,
  TextBox,
  Toolbar,
  ToolbarBand,
  ToolbarRow,
  Window,
} from '@megablacklabel/react98retro';
import type { ToolbarItemDef } from '@megablacklabel/react98retro';
import type { CheckColor } from '../../app/catalog-state';
import { checkColorHex } from '../check-colors';
import { TOOLBAR_ICONS } from '../main/toolbar-icons';
import { assetUrl } from '../asset-url';
import { genreColor } from './genre-colors';
import {
  TOOLBAR_CONTENT_HEIGHT,
  TOOLBAR_ITEM_GAP,
  TOOLBAR_PADDING_X,
  TOOLBAR_SEPARATOR_STYLE,
} from '../main/toolbar-groove';
import type { Circle, ComiketInfo, LayoutInfo, MapInfo } from '../../domain/types';

/** 会場マップ上の 1 マス (机 1 つ分)。 */
/** 机の半分 (席) の状態。実物は 1 つの机に a 席 (左) と b 席 (右) が並ぶ。 */
export type MapWindowSeat = {
  /** その席のサークル (空席は null)。 */
  circle: Circle | null;
  /** その席のチェック色 (未チェックは null)。 */
  color: CheckColor | null;
};

export type MapWindowEntry = {
  /** 机の配置 (xpos / ypos / layout / mapId / blockId / spaceNo)。 */
  layout: LayoutInfo;
  /** 机の左半分 (a 席)。 */
  seatA: MapWindowSeat;
  /** 机の右半分 (b 席)。 */
  seatB: MapWindowSeat;
};

export type MapWindowProps = {
  /** 机のサイズ (mapSizeW / mapSizeH) を持つカタログ情報。無いときは 110x60 で描く。 */
  info: ComiketInfo | null;
  /** 地図 (ホール) 一覧。 */
  maps: readonly MapInfo[];
  activeMapId: number;
  onActiveMapChange: (mapId: number) => void;
  /** activeMapId の机だけを渡す (各机は a 席 / b 席の 2 つ)。 */
  entries: readonly MapWindowEntry[];
  /** 例: '/maps/W12.png' (SVG が無いときのフォールバック)。 */
  imageUrl: string;
  /** 表示倍率 (0.25〜3)。 */
  zoom: number;
  onZoomChange: (zoom: number) => void;
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onOpenDetail: (id: number) => void;
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  /** ツールバーが 1 行に収まる最小幅。 */
  minWidth?: number;
};

/** 地図情報が無いときのマップ画像の原寸 (実物の地図 1 = 西12 の印刷サイズと同じ)。 */
const DEFAULT_MAP_WIDTH = 1000;
const DEFAULT_MAP_HEIGHT = 800;

/** 机 1 つ分の既定サイズ (カタログ情報が無いとき)。 */
const DEFAULT_DESK_WIDTH = 110;
const DEFAULT_DESK_HEIGHT = 60;

/** 表示倍率は元実装のズームボックスと同じ 25%〜300%、+/- は 25% 刻み。 */
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

/** 実物のツールバー (実測: 解析/ui_capture/windows.tsv) の各コントロール。
 *  ComboBox 32799 = 100x20 (値「金曜日 西12」) / Edit 32800 = 36x18 (値「100%」) /
 *  Static「 ジャンル表示」= 76x18 / ComboBox 32833 = 54x20 (値「なし」)。
 *  地図 ComboBox と拡大率 Edit の間、Edit と「ジャンル表示」の間は実測で 29px 空いており、
 *  ピクセル解析 (img6-mapwin.txt) ではその中に 16px 幅のアイコン状のマークが見える。
 *  元実装がここにズームのボタンを置いていたとみて、サークルカットウィンドウ (MainWindow の
 *  表示ツールバー) と同じ並び [ズームアウト][拡大率][ズームイン][幅][高さ][元のサイズ]
 *  [アンチエイリアス] を、同じ TOOLBAR_ICONS のアイコンでその位置に置く。
 *  アイコンボタンはライブラリの Toolbar のボタン (22x22) に揃える。 */
const COMBO_MAX_WIDTH = 200;

/**
 * ウィンドウの最小幅。実物 (ヘルプのスクリーンショット `解析/chm_out/IMAGES/WINDOW4.PNG`) の
 * 会場マップ ウィンドウは 690x542 で、ツールバーは 1 行に収まっている。
 * 実測のコントロール幅 (windows.tsv の子コントロール: 地図 100 / 拡大率 36 /
 * ジャンル表示 76 / ジャンル 54) とアイコンボタン 6 個、区切り線 4 本、gap を積んでも
 * 600 弱なので、実物と同じ 690 を最小幅にする (ブラウザ側のフォント差も吸収できる)。
 */
const MIN_WINDOW_WIDTH = 690;

/**
 * 「ジャンル表示」の選択肢 (元実装の ComboBox 32833)。ヘルプ (1WINDOW/5MAP.HTM) に
 * 「なし〜100% の範囲で選択できます」とあり、実測の既定値は「なし」なので 25% 刻みにする。
 * 値は濃さ (%、0 = なし) で、机の上にジャンル色をこの濃さで重ねる。
 */
const GENRE_DENSITY_OPTIONS: readonly number[] = [0, 25, 50, 75, 100];

/** 「ジャンル表示」の選択肢のラベル (0 は「なし」)。 */
function genreDensityLabel(density: number): string {
  return density === 0 ? 'なし' : `${density}%`;
}

/** ツールバー 1 段の、このウィンドウ固有の見た目。帯 (外周の溝) と段の並びは
 *  ライブラリの `ToolbarBand` / `ToolbarRow` が持つので、ここは段の左右の余白・
 *  項目の間隔・折り返さないこと (入りきらない分は横スクロール) だけを決める。
 *  実物は 1 本の ToolbarWindow32 で、中に ComboBox とアイコンボタンが入る。
 *  Web 版はライブラリの Toolbar に任意のノード (拡大率の Edit) を挟めないので、
 *  サークルカットウィンドウ (MainWindow) と同じく Toolbar を 2 本に分けて Edit を挟み、
 *  グリップは app.css で消して 1 本の行に見せる。
 *  並び: 地図 → ズームアウト → 拡大率 → ズームイン → 幅 → 高さ → 元のサイズ →
 *  アンチエイリアス → ジャンル表示 → ジャンル。
 *  帯の高さはサークル詳細 / チェックリスト と同じ 25px (溝 3px + ボタン 22x22。外側の
 *  1px (上辺の上の #808080 と下辺の下の #000000) は帯の外へ描く)。実測の 30px は
 *  ボタン 22px の上下に余白が 2px ずつ乗っていたためで、その余白は入れない
 *  (中のライブラリ Toolbar も TOOLBAR_INLINE_STYLE で 22px に詰める)。 */
const TOOLBAR_ROW_LOCAL: CSSProperties = {
  padding: `0 ${TOOLBAR_PADDING_X}px`,
  gap: TOOLBAR_ITEM_GAP,
  flexWrap: 'nowrap',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
};

/**
 * ツールバーの中に置くライブラリの Toolbar を帯 (25px) に収める。ライブラリの既定は
 * padding 1px 2px なので、アイコン ボタン 22x22 の上下に 1px ずつ乗って 24px になる。
 * 上下の余白だけ外して 22px にし、帯の内側 (溝の内側) にそのまま収める。左右の 2px は残す。
 */
const TOOLBAR_INLINE_STYLE: CSSProperties = {
  height: TOOLBAR_CONTENT_HEIGHT,
  padding: `0 ${TOOLBAR_PADDING_X}px`,
  boxSizing: 'border-box',
};

/** ツールバー内の ComboBox 共通の形。実測の幅は最小幅で持ち、長い名前は広がって見える。 */
const COMBO_STYLE: CSSProperties = {
  width: 'auto',
  maxWidth: COMBO_MAX_WIDTH,
  height: 20,
  flex: '0 0 auto',
};

/** 地図 ComboBox (実測 100x20)。 */
const MAP_COMBO_STYLE: CSSProperties = { ...COMBO_STYLE, minWidth: 100 };

/** ジャンルの濃さ (ジャンル表示) の ComboBox。実測 54x20 だが「100%」が入る幅にする。 */
const GENRE_COMBO_STYLE: CSSProperties = { ...COMBO_STYLE, minWidth: 64 };

/** 「ジャンル表示」の見出し (実物は Static 76x18)。押せる見た目にはしない。 */
const GENRE_LABEL_STYLE: CSSProperties = { flex: '0 0 auto' };

/**
 * 拡大率の Edit。実測は 36x18 だが、実物 (WINDOW4.PNG) の見た目は「100%」の文字 (26px) の
 * 左右に 4〜5px の余白がある。98.css のエディットは左右に 4px ずつの padding を持つので、
 * 36px だと余白が 2px しか残らない。実物と同じ余白を確保できる 44px にする。
 */
const ZOOM_INPUT_STYLE: CSSProperties = { width: 44, flex: '0 0 auto' };


const BOARD_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'auto',
  background: '#808080',
  border: '1px solid #404040',
  boxSizing: 'border-box',
};

export function MapWindow({
  info,
  maps,
  activeMapId,
  onActiveMapChange,
  entries,
  imageUrl,
  zoom,
  onZoomChange,
  selectedId,
  onSelect,
  onOpenDetail,
  onClose,
  initialX = 60,
  initialY = 40,
  width = 900,
  height = 640,
  zIndex,
  minWidth = MIN_WINDOW_WIDTH,
}: MapWindowProps) {
  // 「ジャンル表示」の濃さ (実物の ComboBox 32833、既定値は「なし」= 重ねない)。
  const [genreDensity, setGenreDensity] = useState(0);
  // SVG の読み込みに失敗した地図 (従来の PNG にフォールバックする)。
  const [failedImage, setFailedImage] = useState<string | null>(null);
  // アンチエイリアス (実物の表示ツールバーの押下ボタン、既定は ON)。切ると画像を
  // pixelated で拡大する。倍率には影響しない。
  const [antiAlias, setAntiAlias] = useState(true);
  // 地図の表示領域 (スクロールする枠)。「幅/高さに合わせる」はこの実寸から倍率を出す。
  const boardRef = useRef<HTMLDivElement>(null);
  const activeMap = maps.find((map) => map.id === activeMapId) ?? null;
  // 地図画像は public/maps/<filename>.svg (実物の地図をベクター化したもの)。
  // 用意が無い地図は従来の PNG (imageUrl) にフォールバックする。
  const svgUrl = activeMap === null ? null : assetUrl(`/maps/${activeMap.filename}.svg`);
  const imageSrc = svgUrl !== null && svgUrl !== failedImage ? svgUrl : imageUrl;
  // マップ画像の原寸は地図ごとの印刷範囲 (ComiketMap の w/h)。
  const mapWidth = activeMap?.w ?? DEFAULT_MAP_WIDTH;
  const mapHeight = activeMap?.h ?? DEFAULT_MAP_HEIGHT;
  const deskWidth = info?.mapSizeW || DEFAULT_DESK_WIDTH;
  const deskHeight = info?.mapSizeH || DEFAULT_DESK_HEIGHT;
  const circleCount = entries.reduce(
    (count, entry) => count + (entry.seatA.circle === null ? 0 : 1) + (entry.seatB.circle === null ? 0 : 1),
    0,
  );
  // 表示倍率は 25%〜300% の範囲に収める (元実装のズームボックスの範囲)。
  const clampZoom = (value: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
  // ズームボタンは 25% 刻み。
  const zoomedOut = clampZoom(zoom - ZOOM_STEP);
  const zoomedIn = clampZoom(zoom + ZOOM_STEP);

  // 拡大率の Edit は「150%」「150」どちらでも受ける。数値にならない入力は無視する。
  const handleZoomInput = (event: ChangeEvent<HTMLInputElement>) => {
    const percent = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(percent)) return;
    onZoomChange(clampZoom(percent / 100));
  };

  // 「幅/高さに合わせる」はボードの実寸 (clientWidth / clientHeight は枠とスクロールバーを
  // 含まない) を画像の原寸で割った倍率にする。「元のサイズ」は 100%。
  const handleFitWidth = () => {
    const board = boardRef.current;
    if (board === null || mapWidth <= 0) return;
    onZoomChange(clampZoom(board.clientWidth / mapWidth));
  };
  const handleFitHeight = () => {
    const board = boardRef.current;
    if (board === null || mapHeight <= 0) return;
    onZoomChange(clampZoom(board.clientHeight / mapHeight));
  };

  // 実物の「表示ツールバー」と同じ並びのアイコンボタン (ズームアウト以外)。
  // MainWindow と同じく、拡大率の Edit を挟むため 2 本の Toolbar に分ける。
  // 実物 (WINDOW4.PNG) のグループ分け: ズーム (アウト / 拡大率 / イン) | ジャンル表示 | 表示 | アンチエイリアス。
  const zoomOutItems: ToolbarItemDef[] = [
    {
      type: 'button',
      id: 'zoom-out',
      icon: TOOLBAR_ICONS.zoomOut,
      label: 'ズームアウト',
      tooltip: 'ズームアウト',
      onClick: () => onZoomChange(zoomedOut),
    },
  ];

  const zoomInItems: ToolbarItemDef[] = [
    {
      type: 'button',
      id: 'zoom-in',
      icon: TOOLBAR_ICONS.zoomIn,
      label: 'ズームイン',
      tooltip: 'ズームイン',
      onClick: () => onZoomChange(zoomedIn),
    },
  ];

  const viewItems: ToolbarItemDef[] = [
    {
      type: 'button',
      id: 'fit-width',
      icon: TOOLBAR_ICONS.fitWidth,
      label: '幅に合わせる',
      tooltip: '幅に合わせる',
      onClick: handleFitWidth,
    },
    {
      type: 'button',
      id: 'fit-height',
      icon: TOOLBAR_ICONS.fitHeight,
      label: '高さに合わせる',
      tooltip: '高さに合わせる',
      onClick: handleFitHeight,
    },
    {
      type: 'button',
      id: 'actual-size',
      icon: TOOLBAR_ICONS.actualSize,
      label: '元のサイズ',
      tooltip: '元のサイズ',
      onClick: () => onZoomChange(1),
    },
  ];

  const antiAliasItems: ToolbarItemDef[] = [
    {
      type: 'button',
      id: 'anti-alias',
      icon: TOOLBAR_ICONS.antiAlias,
      label: 'アンチエイリアス',
      tooltip: 'アンチエイリアス',
      pressed: antiAlias,
      onClick: () => setAntiAlias((value) => !value),
    },
  ];

  return (
    <Window
      data-testid="map-window"
      title={`会場マップ - ${activeMap?.name ?? ''}`}
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
      style={{ minWidth }}
      statusBar={
        <StatusBar>
          <StatusBarField>{circleCount} 件のサークルが表示されています</StatusBarField>
        </StatusBar>
      }
    >
      <ToolbarBand
        data-testid="map-toolbar"
        rows={[
          <ToolbarRow key="row" style={TOOLBAR_ROW_LOCAL}>
            {/* 実物 (WINDOW4.PNG) の並び: 地図 | ズームアウト・拡大率・ズームイン |
                ジャンル表示・ジャンル | 幅・高さ・元のサイズ | アンチエイリアス。
                区切り線は各グループの先頭に置く (サークル詳細 / チェックリスト と同じ
                ライブラリの Groove + 共通の寸法)。 */}
            <Dropdown
              aria-label="地図"
              title="地図"
              data-ctrl-id={32799}
              style={MAP_COMBO_STYLE}
              value={String(activeMapId)}
              disabled={maps.length === 0}
              onChange={(event) => onActiveMapChange(Number(event.target.value))}
            >
              {maps.map((map) => (
                <option key={map.id} value={map.id}>
                  {map.name}
                </option>
              ))}
            </Dropdown>
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            {/* 実物は 1 本のツールバーだが、拡大率の Edit を挟むため 2 本に分ける
                (MainWindow の表示ツールバーと同じ。グリップは app.css で消す)。 */}
            <Toolbar aria-label="ズームアウト" style={TOOLBAR_INLINE_STYLE} items={zoomOutItems} />
            <TextBox
              aria-label="拡大率"
              title="拡大率"
              data-ctrl-id={32800}
              data-testid="map-zoom"
              style={ZOOM_INPUT_STYLE}
              value={`${Math.round(zoom * 100)}%`}
              onChange={handleZoomInput}
            />
            <Toolbar aria-label="ズームイン" style={TOOLBAR_INLINE_STYLE} items={zoomInItems} />
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            {/* 実物は Static (76x18) の見出しだけ。押しても働かない (ユーザー指示)。 */}
            <span style={GENRE_LABEL_STYLE}>ジャンル表示</span>
            {/* 実物の ComboBox 32833。なし〜100% を 25% 刻みで選び、その濃さで
                ジャンル色を会場地図に重ねる (ヘルプ 1WINDOW/5MAP.HTM)。 */}
            <Dropdown
              aria-label="ジャンル表示の濃さ"
              title="ジャンル表示 (会場地図に重ねるジャンル情報の濃さ)"
              data-ctrl-id={32833}
              data-testid="map-genre-density"
              style={GENRE_COMBO_STYLE}
              value={String(genreDensity)}
              onChange={(event) => setGenreDensity(Number(event.target.value))}
            >
              {GENRE_DENSITY_OPTIONS.map((density) => (
                <option key={density} value={density}>
                  {genreDensityLabel(density)}
                </option>
              ))}
            </Dropdown>
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            <Toolbar aria-label="表示" style={TOOLBAR_INLINE_STYLE} items={viewItems} />
            {/* アンチエイリアスだけは実物でも区切って置かれている (トグル ボタン)。 */}
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            <Toolbar
              aria-label="アンチエイリアス"
              style={TOOLBAR_INLINE_STYLE}
              items={antiAliasItems}
            />
          </ToolbarRow>,
        ]}
      />
      <div ref={boardRef} data-testid="map-board" style={BOARD_STYLE}>
        <div
          style={{
            position: 'relative',
            width: mapWidth * zoom,
            height: mapHeight * zoom,
          }}
        >
          <img
            data-testid="map-image"
            src={imageSrc}
            alt=""
            draggable={false}
            style={{
              display: 'block',
              width: mapWidth * zoom,
              // アンチエイリアスを切ると輪郭をぼかさず拡大する (既定は ON)。
              imageRendering: antiAlias ? 'auto' : 'pixelated',
            }}
            // SVG が無い地図は従来の PNG にフォールバックする。
            onError={() => {
              if (svgUrl !== null) setFailedImage(svgUrl);
            }}
          />
          {/* チェック色は会場図 (SVG) と同じ座標系の SVG に描く。机の四角の中に収まり、
              半透明 (乗算) なので下のスペース番号が読める。クリック/ダブルクリックは
              席の矩形がそのまま受ける。 */}
          <svg
            data-testid="map-overlay"
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            width={mapWidth * zoom}
            height={mapHeight * zoom}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            {entries.map((entry, index) => {
              const { layout } = entry;
              // 会場図 (SVG) の机の四角は xpos/ypos が左上で、大きさはカタログのマス寸法。
              // 机の向きが 90 のマスは幅と高さを入れ替える。
              const cellWidth = layout.layout === 90 ? deskHeight : deskWidth;
              const cellHeight = layout.layout === 90 ? deskWidth : deskHeight;
              const x0 = layout.xpos;
              const y0 = layout.ypos;
              // a 席は左半分、b 席は右半分。
              const halfWidth = cellWidth / 2;
              const seats: readonly [MapWindowSeat, MapWindowSeat] = [entry.seatA, entry.seatB];
              const selected = seats.some(
                (seat) => seat.circle !== null && seat.circle.id === selectedId,
              );

              return (
                <g
                  key={`${index}-${layout.mapId}-${layout.blockId}-${layout.spaceNo}-${layout.xpos}-${layout.ypos}`}
                  data-testid="map-cell"
                  data-space-no={layout.spaceNo}
                  data-block-id={layout.blockId}
                  data-selected={selected ? 'true' : 'false'}
                >
                  {seats.map((seat, seatIndex) => {
                    const seatX = seatIndex === 0 ? x0 : x0 + halfWidth;
                    const color = seat.color;
                    const seatSelected =
                      seat.circle !== null && seat.circle.id === selectedId;
                    // ジャンル表示の濃さが 0 でなければ、席の下にジャンル色を敷く。
                    const genre =
                      genreDensity > 0 && seat.circle !== null
                        ? {
                            fill: genreColor(seat.circle.genreId),
                            fillOpacity: genreDensity / 100,
                          }
                        : null;
                    return (
                      <Fragment key={seatIndex}>
                        {genre === null ? null : (
                          <rect
                            data-testid="map-genre"
                            aria-hidden="true"
                            x={seatX}
                            y={y0}
                            width={halfWidth}
                            height={cellHeight}
                            stroke="none"
                            pointerEvents="none"
                            {...genre}
                          />
                        )}
                        {/* チェック色は乗算合成 + 少しの透過。下の会場図の線とスペース番号が読める。 */}
                        <rect
                          data-testid="map-seat"
                          data-seat={seatIndex === 0 ? 'a' : 'b'}
                          data-color={color ?? ''}
                          aria-hidden="true"
                          x={seatX}
                          y={y0}
                          width={halfWidth}
                          height={cellHeight}
                          fill={color == null ? 'transparent' : checkColorHex(color)}
                          style={{
                            mixBlendMode: color == null ? undefined : 'multiply',
                            opacity: color == null ? undefined : 0.7,
                            pointerEvents: seat.circle === null ? 'none' : 'auto',
                            cursor: seat.circle === null ? 'default' : 'pointer',
                          }}
                          stroke={seatSelected ? '#000080' : undefined}
                          strokeWidth={seatSelected ? 1 : undefined}
                          onClick={
                            seat.circle === null
                              ? undefined
                              : () => onSelect(seat.circle!.id)
                          }
                          onDoubleClick={
                            seat.circle === null
                              ? undefined
                              : () => onOpenDetail(seat.circle!.id)
                          }
                        />
                      </Fragment>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </Window>
  );
}
