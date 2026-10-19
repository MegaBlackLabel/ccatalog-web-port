import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Taskbar, Win98Provider } from '@megablacklabel/react98retro';
import '@megablacklabel/react98retro/style.css';
import './styles/app.css';
import { useCatalog } from './app/use-catalog';
import { loadPersistedState, savePersistedState } from './app/persistence';
import { WEEKDAY_NAMES, WEEKDAY_SHORT } from './domain/weekday';
import type { CheckColor, ChecklistEntry } from './app/catalog-state';
import { MENU_COMMANDS } from './ui/menu/menu-defs';
import { CHECKLIST_MENU_COMMANDS, WINDOW_MENU_COMMANDS } from './ui/menu/to-menu-bar';
import { TOOLBAR_COMMANDS } from './ui/main/toolbar-commands';
import { fitZoom, type FitBox, type FitMode } from './ui/main/fit-zoom';
import { MainWindow } from './ui/main/MainWindow';
import type { CutViewOperation } from './ui/main/CircleCutView';
import { SearchWindow } from './ui/search/SearchWindow';
import { ListWindow } from './ui/list/ListWindow';
import { DetailWindow } from './ui/detail/DetailWindow';
import { ChecklistWindow, type ChecklistRow } from './ui/checklist/ChecklistWindow';
import { CheckColorDialog } from './ui/checklist/CheckColorDialog';
import { MapWindow, type MapWindowEntry, type MapWindowSeat } from './ui/map/MapWindow';
import { AboutDialog } from './ui/dialog/AboutDialog';
import { CoverDialog } from './ui/dialog/CoverDialog';
import { HelpWindow, type HelpPane } from './ui/help/HelpWindow';
import { GotoPageDialog } from './ui/dialog/GotoPageDialog';
import { MemoDialog } from './ui/dialog/MemoDialog';
import { PreferencesDialog } from './ui/dialog/PreferencesDialog';
import { GoogleSearchDialog } from './ui/dialog/GoogleSearchDialog';
import { PageSetupDialog } from './ui/dialog/PageSetupDialog';
import { ListDialog, type ListDialogItem } from './ui/dialog/ListDialog';
import { ExportResultDialog } from './ui/dialog/ExportResultDialog';
import { BookmarkAddDialog } from './ui/bookmark/BookmarkAddDialog';
import { BookmarkOrganizeDialog } from './ui/bookmark/BookmarkOrganizeDialog';
import { DEFAULT_PRINT_LIST_SETTINGS, type PrintListSettings } from './ui/print/PrintListDialog';
import { DEFAULT_PRINT_CUT_SETTINGS, type PrintCutSettings } from './ui/print/PrintCutDialog';
import { DEFAULT_PRINT_MAP_SETTINGS, type PrintMapSettings } from './ui/print/PrintMapDialog';
import { PrintDialog } from './ui/print/PrintDialog';
import { PrintSettingsDialog, PRINT_SETTINGS_TABS, type PrintSettingsTabId } from './ui/print/PrintSettingsDialog';
import {
  orderPrintRows,
  PrintCutPreview,
  PrintListPreview,
  PrintMapPreview,
  printTargetCircles,
  type PrintPreviewTarget,
} from './ui/print/print-preview-content';
import { genreColor } from './ui/map/genre-colors';
import { PrintPreviewWindow } from './ui/print/PrintPreviewWindow';
import { PrintProgressDialog } from './ui/print/PrintProgressDialog';
import {
  ImageFileOutputDialog,
  type ImageOutputSettings,
} from './ui/print/ImageFileOutputDialog';
import { ImageOutputHelpDialog } from './ui/print/ImageOutputHelpDialog';
import { parsePageSpec } from './ui/print/page-spec';
import { RoundSwitchDialog } from './ui/data/RoundSwitchDialog';
import { CircleDataDialog } from './ui/data/CircleDataDialog';
import { ImageDataDialog } from './ui/data/ImageDataDialog';
import { DatabaseMergeDialog } from './ui/data/DatabaseMergeDialog';
import { MemoMergeDialog } from './ui/data/MemoMergeDialog';
import { LoadCircleConfirmDialog } from './ui/data/LoadCircleConfirmDialog';
import { DuplicateCheckDialog } from './ui/data/DuplicateCheckDialog';
import { SerialInputDialog } from './ui/app-dialog/SerialInputDialog';
import { CircleMsAuthDialog } from './ui/app-dialog/CircleMsAuthDialog';
import { StartupConfirmDialog } from './ui/app-dialog/StartupConfirmDialog';
import { SendInfoDialog } from './ui/app-dialog/SendInfoDialog';
import type { Circle } from './domain/types';
import { DEFAULT_GOOGLE_SEARCH_SETTINGS, DEFAULT_PAGE_SETUP } from './domain/app-settings';
import { buildGoogleQuery } from './domain/google-search';
import {
  parseChecklistCsv,
  toChecklistCsv,
  type ChecklistCsvRow,
  type ParsedChecklistRow,
} from './domain/checklist-csv';
import { downloadText } from './ui/file-io';
import { CHECK_COLOR_COMMAND_BASE, TOOLBAR_BARS, type ToolbarBarId } from './ui/menu/to-menu-bar';
import { assetUrl } from './ui/asset-url';
import { DIALOG_LAYER_STYLE, DIALOG_LIFT_STYLE } from './ui/dialog-layer';
import { checkColorPalette } from './ui/check-colors';

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;

/** チェックリストのタブ (元実装の参加日 + 抽選漏れ)。 */
const CHECKLIST_DAYS = [1, 2, 3, 4, 0];

/**
 * 見た目とスクロールを確認するためのダミー登録 (日付ごとの件数)。
 * 実物のチェックリストは空で始まり、ユーザーがカットをダブルクリック / Return で登録する。
 * ここだけは割り切りで、カタログ読込後にこの数だけ自動登録する。
 * 1 日目は初期表示のタブなので、ウィンドウの高さ (390px) を超えて確実に縦スクロールが出る 20 件。
 */
const DEMO_CHECKLIST_COUNTS: Record<number, number> = { 1: 20, 2: 14, 3: 14, 4: 14, 0: 3 };

/** ダミー登録に順に割り当てるチェック色 (1〜9 を一巡させて、色分けが見えるようにする)。 */
const DEMO_CHECKLIST_COLORS: readonly CheckColor[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * ダミー登録する (サークル ID, チェック色) の組。各日の末尾から選ぶのは、
 * 初期表示のページ先頭のカット (すぐダブルクリックを試せる位置) を未チェックのまま残すため。
 * 読込元 (JSON フィクスチャ / 実データ) によらず、circles の並びだけで決まる。
 */
function demoChecklistEntries(circles: readonly Circle[]): ChecklistEntry[] {
  const entries: ChecklistEntry[] = [];
  for (const day of CHECKLIST_DAYS) {
    const count = DEMO_CHECKLIST_COUNTS[day] ?? 0;
    for (const circle of circles.filter((circle) => circle.day === day).slice(-count)) {
      entries.push({
        circleId: circle.id,
        color: DEMO_CHECKLIST_COLORS[entries.length % DEMO_CHECKLIST_COLORS.length],
      });
    }
  }
  return entries;
}

type WindowBox = { x: number; y: number; width: number; height: number };
type LayoutName = 'main' | 'detail' | 'checklist' | 'list' | 'map' | 'search';

/**
 * ナビゲート (元実装の ページ移動 > 前に戻る / 次に進む) の履歴 1 項目。
 * 表示中のページと選択サークルの組。
 */
type NavView = { pageNo: number; selectedId: number | null };

/** 履歴の上限 (元実装はもっと短いが、Web 版は操作が軽いので多めに持つ)。 */
const HISTORY_LIMIT = 100;

/**
 * ウィンドウの初期配置。ユーザー提供の取り込み画像 (1966x940) のウィンドウ枠を 1px 単位で
 * 実測した値をそのまま持つ (左にサークルカット / 右上にサークル詳細と会場マップ /
 * 右下にチェックリスト)。画面が画像より小さいときは**縦横同じ比率**で縮める
 * (横だけ・縦だけ縮めると配置が崩れる)。大きい画面では画像の実寸のまま置く
 * (ウィンドウの中身は 105x150 のカットなど実寸で組んであるので、拡大しても余白が増えるだけ)。
 */
const LAYOUT_IMAGE = { width: 1966, height: 940 };

/** 取り込み画像でのウィンドウの位置と大きさ (枠の外側)。 */
const LAYOUT_BOX: Record<LayoutName, WindowBox> = {
  main: { x: 4, y: 11, width: 657, height: 925 },
  detail: { x: 666, y: 12, width: 496, height: 554 },
  map: { x: 1165, y: 12, width: 796, height: 528 },
  checklist: { x: 662, y: 567, width: 1299, height: 369 },
  // 画像に無い 2 枚 (メニューから開く) は、チェックリストと同じ帯に置く。
  list: { x: 662, y: 567, width: 1299, height: 369 },
  search: { x: 608, y: 128, width: 620, height: 470 },
};

/** タスクバーの高さ (画面下に貼り付く。ウィンドウはこの上に並べる)。 */
const TASKBAR_HEIGHT = 28;

/** 隣り合うウィンドウの隙間 (取り込み画像の実測値と同じ 1px)。 */
const LAYOUT_GAP = 1;

/**
 * ウィンドウの最小の大きさ (各ウィンドウが `style` で持つ minWidth / minHeight と同じ値。
 * これを下回ると中身 (ツールバー 1 行など) が入らない)。
 */
const WINDOW_MIN_SIZE: Record<LayoutName, { width: number; height: number }> = {
  main: { width: 659, height: 240 },
  detail: { width: 500, height: 240 },
  map: { width: 690, height: 300 },
  checklist: { width: 362, height: 200 },
  list: { width: 320, height: 200 },
  search: { width: 320, height: 200 },
};

/**
 * 取り込み画像の配置を、いまの画面に合わせた px にする。
 * 画像より小さい画面では縦横**同じ**比率で縮め (1 を超えて拡大はしない)、
 * 位置は画面の外に出ないように寄せる。最小の大きさは守るので、入りきらない画面では
 * 実物と同じく重なる (並び順は画像のまま)。
 */
function layoutFor(width: number, height: number): Record<LayoutName, WindowBox> {
  const areaWidth = Math.max(320, width);
  const areaHeight = Math.max(240, height - TASKBAR_HEIGHT);
  const scale = Math.min(
    1,
    areaWidth / LAYOUT_IMAGE.width,
    areaHeight / LAYOUT_IMAGE.height,
  );
  const boxes = Object.entries(LAYOUT_BOX).map(([key, source]) => {
    const min = WINDOW_MIN_SIZE[key as LayoutName];
    const box = {
      width: Math.max(min.width, Math.round(source.width * scale)),
      height: Math.max(min.height, Math.round(source.height * scale)),
    };
    return [
      key,
      {
        x: Math.max(8, Math.min(Math.round(source.x * scale), areaWidth - box.width - 8)),
        y: Math.max(8, Math.min(Math.round(source.y * scale), areaHeight - box.height - 8)),
        ...box,
      },
    ];
  });
  const layout = Object.fromEntries(boxes) as Record<LayoutName, WindowBox>;
  // メイン (サークルカット) は画像の 657 より最小幅 659 が広く、x もデスクトップ余白 8 へ
  // 持ち上がるので、画像の座標のままだと右側のウィンドウがメインの下へ潜る。
  // メインの右端 + 1px から右へ並べ直し、画面の右端 8px に収まらない分は幅を詰める。
  const mainRight = layout.main.x + layout.main.width;
  const rightLimit = areaWidth - 8;

  // 上段 (サークル詳細 + 会場マップ) は 2 枚で 1 組。最小の大きさで収まらない画面では
  // 並べ直さず、画像の座標のまま置く (実物と同じく重なる)。
  const detailX = Math.max(layout.detail.x, mainRight + LAYOUT_GAP);
  const detailWidth = Math.min(layout.detail.width, rightLimit - detailX);
  const mapX = Math.max(layout.map.x, detailX + detailWidth + LAYOUT_GAP);
  const mapWidth = Math.min(layout.map.width, rightLimit - mapX);
  if (
    detailWidth >= WINDOW_MIN_SIZE.detail.width &&
    mapWidth >= WINDOW_MIN_SIZE.map.width
  ) {
    layout.detail = { ...layout.detail, x: detailX, width: detailWidth };
    layout.map = { ...layout.map, x: mapX, width: mapWidth };
  }

  // 上段の 2 枚はメインと同じ Y から始める。画像の実測はメイン 11 / 詳細・マップ 12 で
  // 1px 下がっているが、枠の上端を揃える (メインが下側の余白で持ち上がる画面にも追従)。
  layout.detail = { ...layout.detail, y: layout.main.y };
  layout.map = { ...layout.map, y: layout.main.y };

  // 下段 (チェックリスト / サークル一覧) も同じ帯なので同じ扱い。
  for (const key of ['checklist', 'list'] as const) {
    const box = layout[key];
    const x = Math.max(box.x, mainRight + LAYOUT_GAP);
    const width = Math.min(box.width, rightLimit - x);
    layout[key] =
      width >= WINDOW_MIN_SIZE[key].width
        ? { ...box, x, width }
        : // 幅を詰めても最小の大きさに入らない画面では、実物と同じく右端に寄せて重なる。
          { ...box, x: Math.max(8, rightLimit - box.width) };
  }
  return layout;
}

/** メインウィンドウのジャンプ 3 つ (日付 / ホール / インデックス) が送るコマンド ID の先頭。 */
const COMMAND_JUMP_DAY = 34000;
const COMMAND_JUMP_HALL = 34100;
const COMMAND_JUMP_INDEX = 34300;

/** 画面下に貼り付くタスクバー。実物は高さ 28px で、ウィンドウより前面にある。 */
const TASKBAR_STYLE: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  height: 28,
  zIndex: 100,
};

/** 起動シーケンス (元実装: 起動確認 → シリアル番号 → 情報送信)。 */
type StartupStep = 'confirm' | 'serial' | 'sendInfo' | 'done';

/** アイコン化 (最小化) できる子ウィンドウ (メインは閉じられないので対象外)。 */
type ChildWindow = 'detail' | 'list' | 'checklist' | 'map';

/** 同時に開けるモーダルは 1 つ。元実装の WM_COMMAND ID からここへ振り分ける。 */
type DialogKey =
  | 'checkColor'
  | 'preferences'
  | 'googleSearch'
  | 'pageSetup'
  | 'dataMenu'
  | 'printSettings'
  | 'printDialog'
  | 'printProgress'
  | 'imageOutput'
  | 'exportResult'
  | 'bookmarkAdd'
  | 'bookmarkOrganize'
  | 'roundSwitch'
  | 'circleData'
  | 'imageData'
  | 'databaseMerge'
  | 'memoMerge'
  | 'loadCircleConfirm'
  | 'duplicateCheck'
  | 'circleMsAuth'
  | null;

/** データベースの初期化 (32858) から開く、データ統合まわりのダイアログ。 */
const DATA_MENU_ITEMS: ListDialogItem[] = [
  { id: 'databaseMerge', label: '古いデータベースの統合', detail: '旧版の DB を取り込む' },
  { id: 'memoMerge', label: 'サークルメモの統合', detail: 'チェックリストのメモを統合する' },
];

const COMMAND_PAGE_PREV = MENU_COMMANDS.pagePrev;
const COMMAND_PAGE_NEXT = MENU_COMMANDS.pageNext;

/**
 * 元実装の WM_COMMAND のうち、menu-defs.ts の MENU_COMMANDS に入れていないもの
 * (ファイル / 表示 / ページ移動 / チェックリスト / 検索 / ヘルプの残り)。
 * menu-defs.ts は生成物なので、アプリ側で意味を持つ ID はここに置く。
 */
const EXTRA_COMMANDS = {
  saveChecklistV1: 32843,
  exportPrintSettings: 32852,
  importPrintSettings: 32853,
  exportAppSettings: 32854,
  importAppSettings: 32855,
  openWebPage: 32859,
  nextBlock: 32864,
  prevBlock: 32865,
  highResolution: 32867,
  listCuts: 32868,
  openTwitter: 32872,
  openPixiv: 32873,
  helpContents: 32815,
  helpSearch: 32816,
  helpKeyword: 32817,
  supportPage: 32844,
} as const;

/** 「サークルのWEBページ / TWITTER / Pixiv を開く」が使うカタログの列。 */
const CIRCLE_LINK_FIELDS: Record<number, 'url' | 'twitter' | 'pixiv'> = {
  [EXTRA_COMMANDS.openWebPage]: 'url',
  [EXTRA_COMMANDS.openTwitter]: 'twitter',
  [EXTRA_COMMANDS.openPixiv]: 'pixiv',
};

/** ヘルプのメニュー ID → 開き方。 */
const HELP_MODES: Record<number, HelpPane> = {
  [EXTRA_COMMANDS.helpContents]: 'contents',
  [EXTRA_COMMANDS.helpSearch]: 'search',
  [EXTRA_COMMANDS.helpKeyword]: 'keyword',
};

/** サポートページ (元実装の「サポートページ」)。 */
const SUPPORT_URL = 'https://github.com/MegaBlackLabel/ccatalog-web-port';

/**
 * 起動シーケンス (起動確認 → シリアル番号入力 → 情報送信の確認) は既定で出さない
 * (ユーザー指示。`<App startup />` で実機と同じシーケンスを出せる)。
 */
export default function App({ startup = false }: { startup?: boolean } = {}) {
  const { state, dispatch } = useCatalog();

  // ウィンドウの配置は取り込み画像の割合から (起動時の画面の大きさで決める)。
  // 「ウィンドウ位置を初期化」で作り直すため、key を替えて Window をマウントし直す。
  const [layoutKey, setLayoutKey] = useState(0);
  const [layout, setLayout] = useState(() => layoutFor(window.innerWidth, window.innerHeight));

  const [searchOpen, setSearchOpen] = useState(false);
  // 既定で出すのは取り込み画像と同じ 4 枚 (カット / 詳細 / マップ / チェックリスト)。
  // サークル一覧と検索は「ウィンドウ」メニューから開く。
  const [listOpen, setListOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(true);
  const [keepSearchOpen, setKeepSearchOpen] = useState(true);
  const [pageNo, setPageNo] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  /**
   * 拡大率の決め方。'free' は「元のサイズ / 拡大率指定」で zoom をそのまま使う。
   * それ以外はカットビューの表示領域から計算する (元実装の 幅 / 高さ / 全体に合わせる)。
   * 既定は「幅に合わせる」(カットビューは 6 列の 1fr でセルを縮める)。
   */
  // 起動時は実物と同じ 100% (等倍) で出す。メニューの「幅 / 高さ / 全体に合わせる」で切り替わる。
  const [zoomFit, setZoomFit] = useState<FitMode | 'free'>('free');
  /** カットビューの表示領域 (CircleCutView が計測して知らせる)。 */
  const [cutBox, setCutBox] = useState<FitBox>({ width: 0, height: 0 });
  const [mapZoom, setMapZoom] = useState(0.5);
  const [activeMapId, setActiveMapId] = useState(1);
  const [activeDay, setActiveDay] = useState(1);
  const [checklistLocked, setChecklistLocked] = useState(false);
  /** サークル一覧のリストロック (1WINDOW/6LIST.HTM: 順番入れ替え・ソートのロック)。 */
  const [listLocked, setListLocked] = useState(false);
  const [checklistSelection, setChecklistSelection] = useState<number[]>([]);
  const [memoTarget, setMemoTarget] = useState<number | null>(null);
  const [gotoPageOpen, setGotoPageOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  /** 表紙 (動作設定 1711「起動時に表紙画像を表示する」)。 */
  const [coverOpen, setCoverOpen] = useState(false);
  /** 標準のチェック色 (チェックリスト > 標準のチェック色)。0 は標準色。 */
  const [defaultCheckColor, setDefaultCheckColor] = useState<CheckColor>(0);
  /** 表示メニューのトグル (アンチエイリアス / 高解像度表示 / リスト中のカット表示)。 */
  const [antiAlias, setAntiAlias] = useState(true);
  const [highResolution, setHighResolution] = useState(true);
  const [showListCuts, setShowListCuts] = useState(false);
  /** 表示中のドッキング ツールバー (表示 > ツールバー)。 */
  // 実物のツールバーは 5 本 (基本 / ページ移動 / 表示 / チェック / ナビゲート) が
  // 2 段で並ぶ。ナビゲートバーの「戻る / 進む」も既定で出す。
  const [visibleBars, setVisibleBars] = useState<ToolbarBarId[]>(
    TOOLBAR_BARS.map((bar) => bar.id),
  );
  /** ヘルプ (目次 / 検索 / キーワード)。null なら閉じている。 */
  const [helpPane, setHelpPane] = useState<HelpPane | null>(null);
  /** チェックリストの読み込みダイアログの適用先 (開く = 入れ替え / 追加読み込み = 追記)。 */
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');
  const [dialog, setDialog] = useState<DialogKey>(null);
  const [message, setMessage] = useState('');
  const [startupStep, setStartupStep] = useState<StartupStep>(startup ? 'confirm' : 'done');
  const [progress, setProgress] = useState(0);

  // 印刷まわりの設定はダイアログが持つ型のままアプリ側で保持する
  const [printListSettings, setPrintListSettings] = useState<PrintListSettings>(DEFAULT_PRINT_LIST_SETTINGS);
  const [printCutSettings, setPrintCutSettings] = useState<PrintCutSettings>(DEFAULT_PRINT_CUT_SETTINGS);
  const [printMapSettings, setPrintMapSettings] = useState<PrintMapSettings>(DEFAULT_PRINT_MAP_SETTINGS);
  /** 印刷詳細設定で開いているタブ (元実装は形式ごとのダイアログ)。 */
  const [printTab, setPrintTab] = useState<PrintSettingsTabId>('list');
  /** 印刷詳細設定の上に出す用紙サイズ・余白の設定 (元ダイアログ 203)。 */
  const [pageSetupOpen, setPageSetupOpen] = useState(false);
  /** 印刷ダイアログ (1538) の上に重ねる印刷詳細設定 (163〜166)。 */
  const [printSettingsOpen, setPrintSettingsOpen] = useState(false);
  const [preview, setPreview] = useState<{
    title: string;
    pageCount: number;
    pageNo: number;
    zoom: number;
    /** 印刷形式ごとのプレビュー (画像の代わりに組む 1 ページ)。 */
    print?: {
      kind: PrintSettingsTabId;
      rows: readonly { circle: Circle; color: CheckColor }[];
    };
  }>({ title: 'プレビュー', pageCount: 1, pageNo: 1, zoom: 1 });
  /** プレビューは開いているダイアログの上に重ねる (別ウィンドウとして出す)。 */
  const [previewOpen, setPreviewOpen] = useState(false);
  /**
   * 画像ファイル出力 (ダイアログ 197) の設定。既定は元実装の初期状態に合わせる
   * (出力範囲はすべて / 長辺のサイズ 0 = 原寸 / BMP / サークルリスト印刷)。
   */
  const [imageOutput, setImageOutput] = useState<ImageOutputSettings>({
    directory: 'C:\\dummy\\output',
    baseName: 'ccatalog',
    format: 'bmp',
    longSide: 0,
    highResolution: false,
    allPages: true,
    pageSpec: '1',
    outputFormat: 'list',
    noGdiPlus: false,
  });
  /** 画像ファイル出力の「詳細設定」で開く、出力形式ごとの詳細ダイアログ。 */
  const [imageDetailsOpen, setImageDetailsOpen] = useState(false);
  /** 画像ファイル出力の「説明」で開く説明ダイアログ。 */
  const [imageHelpOpen, setImageHelpOpen] = useState(false);

  const catalog = state.catalog;
  const circles = useMemo(() => catalog?.circles ?? [], [catalog]);
  const genres = catalog?.genres ?? [];
  const maps = catalog?.maps ?? [];
  const layouts = catalog?.layouts ?? [];

  /** 動作設定の「色の設定」の名称 (色1〜9)。空文字は「色N」で表示される。 */
  const checkColorNames = Array.from({ length: 9 }, (_, index) => state.checkColors.names[index] ?? '');

  /** 「色の設定」の表示色 (9 色)。各ウィンドウの色ボタンと見本に使う。 */
  const displayCheckColors = checkColorPalette(state.checkColors.display);

  /** 「色の設定」の印刷色 (9 色)。未設定なら表示色。印刷プレビューの見本に使う。 */
  const printCheckColors =
    state.checkColors.print.length > 0
      ? checkColorPalette(state.checkColors.print)
      : displayCheckColors;

  /**
   * 画像の URL。「画像データパス」(動作設定 191) で「指定場所から読み込む」にしているときは
   * その場所を前置きし、自動検索 (既定) ならアプリ同梱の画像 (assetUrl) を使う。
   */
  const imageOf = (path: string) => {
    const base = state.imagePath.autoSearch ? '' : state.imagePath.basePath.trim().replace(/\/+$/, '');
    return base.length === 0 ? assetUrl(path) : `${base}${path}`;
  };

  const circlesById = useMemo(() => new Map(circles.map((circle) => [circle.id, circle])), [circles]);
  const genreNames = useMemo(
    () => Object.fromEntries(genres.map((genre) => [genre.id, genre.name])) as Record<number, string>,
    [genres],
  );
  const checkedIds = useMemo(() => new Set(state.checklist.map((entry) => entry.circleId)), [state.checklist]);
  const colorById = useMemo(
    () => new Map(state.checklist.map((entry) => [entry.circleId, entry.color])),
    [state.checklist],
  );
  /** サークルのホール (地区) 名。印刷範囲のホール チェックと同じ表記。 */
  const hallOf = useCallback(
    (circle: Circle) => {
      const block = (catalog?.blocks ?? []).find((entry) => entry.id === circle.blockId);
      return (catalog?.areas ?? []).find((area) => area.id === block?.areaId)?.name ?? '';
    },
    [catalog],
  );

  /** 印刷の日付欄の表記 (抽選漏れは 0)。 */
  const dayLabelOf = useCallback(
    (circle: Circle) => {
      if (circle.day === 0) return '抽選漏れ';
      const date = (catalog?.dates ?? []).find((entry) => entry.id === circle.day);
      return (date && WEEKDAY_NAMES[date.weekday]) || `${circle.day}日目`;
    },
    [catalog],
  );

  const memoOf = useCallback(
    (id: number) => state.memos[id] ?? circlesById.get(id)?.memo ?? '',
    [state.memos, circlesById],
  );

  const firstPage = useMemo(
    () => circles.reduce((min, circle) => (circle.pageNo < min ? circle.pageNo : min), Number.MAX_SAFE_INTEGER),
    [circles],
  );
  const lastPage = useMemo(
    () => circles.reduce((max, circle) => (circle.pageNo > max ? circle.pageNo : max), 0),
    [circles],
  );
  const currentPage = pageNo ?? (Number.isFinite(firstPage) ? firstPage : 1);
  const pageCircles = useMemo(
    () => circles.filter((circle) => circle.pageNo === currentPage),
    [circles, currentPage],
  );

  /**
   * カット 1 枚の表示サイズ。実物のカット画像の実寸 (低解像度 105x150 / 高解像度 211x300)
   * を使う。ComiketInfo の cutSizeW/H (178x253) はページ画像からの切り抜き領域で、
   * 表示サイズではない (実測: カットウィンドウの 1 枚は 106x149)。
   */
  const cutSize = { width: 105, height: 150 };
  /** カットビューの行数 (6 列。ページの枚数で決まる)。 */
  const cutRows = Math.max(1, Math.ceil(pageCircles.length / 6));

  /**
   * カット格子の直上に出す配置情報。実物は「9日（金）西2壁 あ36〜あ53」で、
   * 画像ではなくアプリがページの先頭 / 末尾のサークルから組み立てて描く
   * (日付は ComiketDate の月日と曜日、会場は block → area の名前、範囲は
   *  先頭と末尾の「ブロック名 + スペース番号」)。
   */
  const cutHeading = useMemo(() => {
    const first = pageCircles[0];
    const last = pageCircles[pageCircles.length - 1];
    if (!first || !last) return '';
    const date = (catalog?.dates ?? []).find((entry) => entry.id === first.day);
    const weekday = date ? `（${WEEKDAY_SHORT[date.weekday]}）` : '';
    const blockOf = (circle: Circle) =>
      (catalog?.blocks ?? []).find((entry) => entry.id === circle.blockId);
    const label = (circle: Circle) => `${blockOf(circle)?.name ?? ''}${circle.spaceNo}`;
    // 会場はページ先頭のサークルのブロック → 地区の名前 (実物の「西2壁」)。
    const area = (catalog?.areas ?? []).find((entry) => entry.id === blockOf(first)?.areaId)?.name ?? '';
    // 実物の表記は「9日（金）西2壁 あ36〜あ53」で、日付 + （曜日）と会場の間に空白を入れない
    // (空白を入れるのは会場と配置範囲の間だけ)。
    return [`${date?.day ?? first.day}日${weekday}${area}`, `${label(first)}〜${label(last)}`]
      .filter(Boolean)
      .join(' ');
  }, [catalog, pageCircles]);

  /**
   * 配置情報の帯の寄せ。実物は見開きの左右に合わせて、奇数ページは右寄せ、
   * 偶数ページは左寄せにする (帯の白はカット格子と同じ幅のままで、寄せるのは文字だけ)。
   */
  const cutHeadingAlign: 'left' | 'right' = currentPage % 2 === 0 ? 'left' : 'right';

  // 「幅 / 高さ / 全体に合わせる」を選んでいるときは、表示領域と行数から拡大率を求め直す
  // (ウィンドウの大きさが変わっても追随する)。'free' のときは zoom をそのまま使う。
  useEffect(() => {
    if (zoomFit === 'free') return;
    setZoom(fitZoom(zoomFit, cutBox, cutSize, 6, cutRows));
  }, [zoomFit, cutBox, cutSize.width, cutSize.height, cutRows]);

  // カットビューのセル幅。幅に合わせるときだけ CSS の 1fr に任せる (null)。
  const cellWidth = zoomFit === 'width' ? null : cutSize.width * zoom;

  /** 動作設定 (ダイアログ 150) のうち、カットビューの操作に関わるもの。 */
  const cutViewOperation: CutViewOperation = {
    singleClickChecks: state.settings.singleClickChecks,
    cursorFollowsMouse: state.settings.cursorFollowsMouse,
    enterMovesCursor: state.settings.enterMovesCursor,
    tenkeyMovesCursor: state.settings.tenkeyMovesCursor,
    scrollMode: state.settings.scrollMode,
  };

  /** 表示メニューでオンになっているトグル (メニューにチェック印を付ける)。 */
  const checkedCommandIds = [
    ...(antiAlias ? [TOOLBAR_COMMANDS.antiAlias] : []),
    ...(highResolution ? [EXTRA_COMMANDS.highResolution] : []),
    ...(showListCuts ? [EXTRA_COMMANDS.listCuts] : []),
  ];

  // 動作設定 1710: ページ変更時に常に左上のサークルカットにカーソルを合わせる。
  useEffect(() => {
    if (!state.settings.cursorToTopLeftOnPageChange) return;
    const first = pageCircles[0];
    if (first === undefined || first.id === state.selectedId) return;
    dispatch({ type: 'circle/select', id: first.id });
  }, [
    currentPage,
    pageCircles,
    state.settings.cursorToTopLeftOnPageChange,
    state.selectedId,
    dispatch,
  ]);

  const selectedCircle: Circle | null =
    state.selectedId === null ? null : circlesById.get(state.selectedId) ?? null;

  /**
   * サークル詳細ウィンドウに出すサークル。カットビューで選択が外れたときも、直前まで
   * 選んでいたサークルの情報を出し続ける (実機はカットのカーソルが外れても詳細が残る)。
   */
  const lastSelectedId = useRef<number | null>(null);
  useEffect(() => {
    if (state.selectedId !== null) lastSelectedId.current = state.selectedId;
  }, [state.selectedId]);
  const detailCircleId = state.selectedId ?? lastSelectedId.current;
  const detailCircle: Circle | null =
    detailCircleId === null ? null : circlesById.get(detailCircleId) ?? null;

  /** 動作設定 1022: 選択サークルの日付 / ブロックにサークル一覧を追従させる。 */
  const listFollow =
    state.settings.listFollowsBlock && selectedCircle !== null
      ? { day: selectedCircle.day, blockId: selectedCircle.blockId }
      : null;

  // 詳細ウィンドウの情報欄の先頭行 (実物は太字の配置情報)。日程は catalog.dates の weekday から
  // ジャンプ コンボと同じ表記で作り、スペースは実物の表記「地区 + ブロック + 番号 + a|b」
  // (例 東G30b) にする。抽選漏れ (day 0) はスペースが無いので渡さない。
  const detailPosition = useMemo(() => {
    if (detailCircle === null || detailCircle.day === 0) return { dayLabel: '', areaLabel: '' };
    const date = (catalog?.dates ?? []).find((entry) => entry.id === detailCircle.day);
    const block = (catalog?.blocks ?? []).find((entry) => entry.id === detailCircle.blockId);
    const area = block
      ? (catalog?.areas ?? []).find((entry) => entry.id === block.areaId)
      : undefined;
    return {
      dayLabel: date ? WEEKDAY_NAMES[date.weekday] ?? '' : '',
      areaLabel: `${area?.name ?? ''}${block?.name ?? ''}${detailCircle.spaceNo}${
        detailCircle.spaceNoSub === 1 ? 'b' : 'a'
      }`,
    };
  }, [catalog, detailCircle]);

  /** サークル詳細に出すサークルのチェックを切り替える (未選択でも直前のサークルに効く)。 */
  const toggleDetailCheck = useCallback(() => {
    if (detailCircleId === null) return;
    dispatch({ type: 'checklist/toggle', id: detailCircleId, color: defaultCheckColor });
  }, [defaultCheckColor, detailCircleId, dispatch]);

  /** Google 検索を開く (検索条件 212 のとおりに検索語を組み立てる)。null は選択なし。 */
  const openGoogleSearch = useCallback(
    (circle: Circle | null) => {
      if (circle === null) {
        setMessage('サークルを選択してください');
        return;
      }
      const query = buildGoogleQuery(circle, state.googleSearch);
      if (query.length === 0) {
        setMessage('検索する項目が選ばれていません');
        return;
      }
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        '_blank',
        'noreferrer',
      );
    },
    [state.googleSearch],
  );

  const checklistRows: ChecklistRow[] = useMemo(
    () =>
      state.checklist
        .map((entry) => {
          const circle = circlesById.get(entry.circleId);
          return circle === undefined ? null : { entry, circle, genreName: genreNames[circle.genreId] ?? '' };
        })
        .filter((row): row is ChecklistRow => row !== null)
        .filter((row) => row.circle.day === activeDay),
    [state.checklist, circlesById, genreNames, activeDay],
  );
  const checklistCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const day of CHECKLIST_DAYS) counts[day] = 0;
    for (const entry of state.checklist) {
      const day = circlesById.get(entry.circleId)?.day;
      if (day !== undefined) counts[day] = (counts[day] ?? 0) + 1;
    }
    return counts;
  }, [state.checklist, circlesById]);

  const mapEntries: MapWindowEntry[] = useMemo(
    () =>
      layouts
        .filter((layout) => layout.mapId === activeMapId)
        .map((layout) => {
          // 実物は 1 つの机に a 席 (spaceNoSub 0) と b 席 (spaceNoSub 1) が並ぶ。
          const seat = (sub: number): MapWindowSeat => {
            const circle =
              circles.find(
                (candidate) =>
                  candidate.blockId === layout.blockId &&
                  candidate.spaceNo === layout.spaceNo &&
                  candidate.spaceNoSub === sub,
              ) ?? null;
            return { circle, color: circle === null ? null : colorById.get(circle.id) ?? null };
          };
          return { layout, seatA: seat(0), seatB: seat(1) };
        }),
    [layouts, activeMapId, circles, colorById],
  );
  const activeMap = maps.find((map) => map.id === activeMapId) ?? maps[0];

  const focusCircle = useCallback(
    (id: number) => {
      dispatch({ type: 'circle/select', id });
      const circle = circlesById.get(id);
      if (circle) setPageNo(circle.pageNo);
    },
    [circlesById, dispatch],
  );

  // ナビゲート (元実装の ページ移動 > 前に戻る / 次に進む)。ページと選択サークルが
  // 変わるたびに直前の表示を履歴へ積み、戻る / 進む で行き来できるようにする。
  const pastViews = useRef<NavView[]>([]);
  const futureViews = useRef<NavView[]>([]);
  const lastView = useRef<NavView>({ pageNo: currentPage, selectedId: state.selectedId });

  useEffect(() => {
    const view: NavView = { pageNo: currentPage, selectedId: state.selectedId };
    const previous = lastView.current;
    if (previous.pageNo === view.pageNo && previous.selectedId === view.selectedId) return;
    pastViews.current = [...pastViews.current, previous].slice(-HISTORY_LIMIT);
    futureViews.current = [];
    lastView.current = view;
  }, [currentPage, state.selectedId]);

  // 履歴から戻すときは lastView を先に進めて、この移動を履歴に積まないようにする。
  const applyView = useCallback(
    (view: NavView) => {
      lastView.current = view;
      setPageNo(view.pageNo);
      dispatch({ type: 'circle/select', id: view.selectedId });
    },
    [dispatch],
  );

  const goBack = useCallback(() => {
    const previous = pastViews.current[pastViews.current.length - 1];
    if (previous === undefined) {
      setMessage('これ以上戻れません');
      return;
    }
    pastViews.current = pastViews.current.slice(0, -1);
    futureViews.current = [
      ...futureViews.current,
      { pageNo: currentPage, selectedId: state.selectedId },
    ];
    applyView(previous);
  }, [applyView, currentPage, state.selectedId]);

  const goForward = useCallback(() => {
    const next = futureViews.current[futureViews.current.length - 1];
    if (next === undefined) {
      setMessage('これ以上進めません');
      return;
    }
    futureViews.current = futureViews.current.slice(0, -1);
    pastViews.current = [
      ...pastViews.current,
      { pageNo: currentPage, selectedId: state.selectedId },
    ];
    applyView(next);
  }, [applyView, currentPage, state.selectedId]);

  /** 動作設定 1021 / 1029: チェックしたサークルの次のカットへカーソルを移す。 */
  const focusNextCircle = useCallback(
    (circle: Circle) => {
      const index = pageCircles.findIndex((candidate) => candidate.id === circle.id);
      const next = pageCircles[index + 1];
      if (next !== undefined) {
        focusCircle(next.id);
        return;
      }
      // ページの末尾なら次のページの先頭へ (元実装もページをまたいで進む)。
      const nextPageCircle = circles.find((candidate) => candidate.pageNo > currentPage);
      if (nextPageCircle === undefined) return;
      setPageNo(nextPageCircle.pageNo);
      dispatch({ type: 'circle/select', id: nextPageCircle.id });
    },
    [pageCircles, circles, currentPage, focusCircle, dispatch],
  );

  /**
   * アイコン化 (子ウィンドウの最小化)。動作設定 1714「個別窓のアイコン化を連動する」が
   * 入っていると、1 つたたむと子ウィンドウをまとめてたたむ。戻すのは「ウィンドウ」メニュー。
   */
  const iconify = useCallback(
    (key: ChildWindow) => {
      const close: Record<ChildWindow, () => void> = {
        detail: () => setDetailOpen(false),
        list: () => setListOpen(false),
        checklist: () => setChecklistOpen(false),
        map: () => setMapOpen(false),
      };
      if (state.settings.linkWindowIconify) {
        Object.values(close).forEach((closeWindow) => closeWindow());
        setMessage('子ウィンドウをまとめてアイコン化しました');
        return;
      }
      close[key]();
    },
    [state.settings.linkWindowIconify],
  );

  // 動作設定 1711「起動時に表紙画像を表示する」。設定を入れた時点でも出して、その場で確認できる。
  useEffect(() => {
    if (state.settings.showCoverOnStart) setCoverOpen(true);
  }, [state.settings.showCoverOnStart]);

  // 元実装の INI / チェックリストファイル相当。起動時に前回の状態を戻す。
  useEffect(() => {
    const saved = loadPersistedState();
    if (saved === null) return;
    const { checklist, memos, ...rest } = saved;
    // 動作設定 1664「起動時に前回使用したチェックリストを自動的に読み込む」が入っていなければ、
    // チェックリストとメモは戻さない (設定・検索条件・ブックマークは常に戻す)。
    dispatch({
      type: 'state/restore',
      patch: saved.settings?.loadLastChecklistOnStart === true ? { ...rest, checklist, memos } : rest,
    });
  }, [dispatch]);

  // 変更のたびに保存する (元実装の INI / チェックリストファイルへの書き込みに相当)。
  useEffect(() => {
    if (state.catalog === null) return;
    savePersistedState({
      checklist: state.checklist,
      memos: state.memos,
      settings: state.settings,
      imagePath: state.imagePath,
      listDisplay: state.listDisplay,
      checkColors: state.checkColors,
      googleSearch: state.googleSearch,
      pageSetup: state.pageSetup,
      bookmarks: state.bookmarks,
    });
  }, [
    state.bookmarks,
    state.catalog,
    state.checkColors,
    state.checklist,
    state.googleSearch,
    state.imagePath,
    state.listDisplay,
    state.memos,
    state.pageSetup,
    state.settings,
  ]);

  /** チェックリスト 1 行を CSV の値にする。 */
  const csvRowOf = useCallback(
    (entry: ChecklistEntry): ChecklistCsvRow | null => {
      const circle = circlesById.get(entry.circleId);
      if (circle === undefined) return null;
      return {
        entry,
        circle,
        genreName: genreNames[circle.genreId] ?? '',
        space: `${circle.spaceNo}${circle.spaceNoSub === 1 ? 'b' : 'a'}`,
        dayLabel: circle.day === 0 ? '抽選漏れ' : `${circle.day}日目`,
        colorLabel: entry.color === 0 ? '標準色' : `色${entry.color}`,
        memo: memoOf(circle.id),
      };
    },
    [circlesById, genreNames, memoOf],
  );

  /** チェックリストを CSV テキストにする。 */
  const csvOf = useCallback(
    (entries: readonly ChecklistEntry[], version: 1 | 2): string =>
      toChecklistCsv(
        entries.flatMap((entry) => {
          const csvRow = csvRowOf(entry);
          return csvRow === null ? [] : [csvRow];
        }),
        version,
      ),
    [csvRowOf],
  );

  /** チェックリストを CSV で保存する (元実装の 保存 / 名前を付けて保存 / Ver1形式で保存)。 */
  const saveChecklist = useCallback(
    (version: 1 | 2, filename?: string) => {
      downloadText(filename ?? `ccatalog-checklist-v${version}.csv`, csvOf(state.checklist, version));
      setMessage(`チェックリスト ${state.checklist.length} 件を保存しました`);
    },
    [csvOf, state.checklist],
  );

  /**
   * CSV テキストをチェックリストへ取り込む (元実装の 開く / 追加読み込み / ペースト)。
   * 読み込み時の動作設定 (1028 厳密照合 / 1712 メモ上書き / 1713 色上書き) に従う。
   */
  const importChecklist = useCallback(
    (text: string, mode: 'replace' | 'append') => {
      const matched: { circle: Circle; row: ParsedChecklistRow }[] = [];
      for (const row of parseChecklistCsv(text)) {
        const circle = circles.find((candidate) =>
          state.settings.strictCircleNameCheck
            ? candidate.circleName === row.circleName &&
              (row.circleKana.length === 0 || candidate.circleKana === row.circleKana)
            : candidate.circleName === row.circleName ||
              candidate.circleName.includes(row.circleName) ||
              (row.circleKana.length > 0 && candidate.circleKana === row.circleKana),
        );
        if (circle !== undefined) matched.push({ circle, row });
      }
      if (matched.length === 0) {
        setMessage('読み込めるサークルがありませんでした');
        return;
      }
      const registered = new Map(state.checklist.map((entry) => [entry.circleId, entry.color]));
      const imported: ChecklistEntry[] = matched.map(({ circle, row }) => ({
        circleId: circle.id,
        // 1713「読み込み時にチェック色情報を上書きする」が入っていなければ登録済みの色を残す。
        color:
          state.settings.overwriteColorOnLoad || !registered.has(circle.id)
            ? row.color
            : (registered.get(circle.id) as CheckColor),
      }));
      const entries =
        mode === 'replace'
          ? imported
          : [...state.checklist, ...imported.filter((entry) => !registered.has(entry.circleId))];
      dispatch({ type: 'checklist/replace', entries });
      for (const { circle, row } of matched) {
        if (row.memo.length === 0) continue;
        // 1712「読み込み時にサークルメモを上書きする」が入っていなければ既存のメモを残す。
        if (!state.settings.overwriteMemoOnLoad && memoOf(circle.id).length > 0) continue;
        dispatch({ type: 'memo/set', id: circle.id, memo: row.memo });
      }
      setMessage(`${imported.length} 件を読み込みました`);
    },
    [circles, memoOf, state.checklist, state.settings],
  );

  /** Web 版のダミー読み込みデータ (ファイル選択の代わりに同梱カタログから CSV を作る)。 */
  const dummyChecklistCsv = useCallback(
    () =>
      csvOf(
        circles
          .filter((circle) => circle.day > 0)
          .slice(0, 3)
          .map((circle) => ({ circleId: circle.id, color: state.checklist[0]?.color ?? 1 })),
        2,
      ),
    [circles, csvOf, state.checklist],
  );

  /** サークルの WEBページ / TWITTER / Pixiv を開く (ダミーデータの登録値を使う)。 */
  const openCircleLink = useCallback(
    (field: 'url' | 'twitter' | 'pixiv', label: string) => {
      if (selectedCircle === null) {
        setMessage('サークルを選択してください');
        return;
      }
      const value = selectedCircle[field].trim();
      if (value.length === 0) {
        setMessage(`${label} は登録されていません`);
        return;
      }
      const url =
        field === 'twitter'
          ? `https://twitter.com/${value.replace(/^@/, '')}`
          : field === 'pixiv'
            ? `https://www.pixiv.net/users/${value}`
            : value;
      window.open(url, '_blank', 'noreferrer');
    },
    [selectedCircle],
  );

  /** 選択サークルをクリップボードへコピーする (1707)。ペースト (1708) と往復できる CSV。 */
  const copySelectedCircle = useCallback(() => {
    if (state.selectedId === null) {
      setMessage('サークルを選択してください');
      return;
    }
    if (navigator.clipboard === undefined) {
      setMessage('この環境ではクリップボードを使えません');
      return;
    }
    const entry =
      state.checklist.find((candidate) => candidate.circleId === state.selectedId) ??
      { circleId: state.selectedId, color: defaultCheckColor };
    navigator.clipboard.writeText(csvOf([entry], 2)).then(
      () => setMessage('選択サークルをコピーしました'),
      () => setMessage('クリップボードにコピーできませんでした'),
    );
  }, [csvOf, defaultCheckColor, state.checklist, state.selectedId]);

  /** クリップボードのチェックリストを追記する (1708)。 */
  const pasteCircles = useCallback(() => {
    if (navigator.clipboard === undefined) {
      setMessage('この環境ではクリップボードを使えません');
      return;
    }
    navigator.clipboard.readText().then(
      (text) => importChecklist(text, 'append'),
      () => setMessage('クリップボードを読み取れませんでした'),
    );
  }, [importChecklist]);

  /** 設定のエクスポート (元実装の INI 出力。Web 版は JSON で書き出す)。 */
  const exportSettings = useCallback(
    (kind: 'app' | 'print') => {
      const value =
        kind === 'app'
          ? { settings: state.settings, googleSearch: state.googleSearch }
          : state.pageSetup;
      downloadText(`ccatalog-${kind}-settings.json`, JSON.stringify(value, null, 2), 'application/json');
      setMessage('設定をエクスポートしました');
    },
    [state.googleSearch, state.pageSetup, state.settings],
  );

  /** 設定のインポート (元実装の INI 入力。Web 版は既定値に戻して取り込む = ダミー)。 */
  const importSettings = useCallback(
    (kind: 'app' | 'print') => {
      if (kind === 'app') {
        dispatch({ type: 'settings/reset' });
        dispatch({ type: 'googleSearch/set', patch: DEFAULT_GOOGLE_SEARCH_SETTINGS });
      } else {
        dispatch({ type: 'pageSetup/set', patch: DEFAULT_PAGE_SETUP });
      }
      setMessage('設定を初期値に戻して読み込みました（ダミー）');
    },
    [dispatch],
  );

  /** 起動直後にカーソルを 1 つ置いたか (元実装はどのカットにもカーソルの無い状態で開かない)。 */
  const cursorSeeded = useRef(false);

  // 起動直後だけ先頭のサークルを選択する。元実装はカットビューにカーソルが 1 つある状態で開くが、
  // カット以外をクリックすると選択は外れ、そのまま (勝手に選び直さない)。
  useEffect(() => {
    if (cursorSeeded.current || circles.length === 0) return;
    cursorSeeded.current = true;
    focusCircle(circles[0].id);
  }, [circles, focusCircle]);

  /** ダミー登録を入れ終えたか (ユーザーが全件解除しても入れ直さない)。 */
  const demoSeeded = useRef(false);

  /**
   * 見た目とスクロールの確認用のダミー登録。カタログ読込後、チェックリストが空のときに
   * 一度だけ入れる (実物は空スタートで、登録はカットのダブルクリック / Return)。
   * 読込元が JSON フィクスチャでも実データでも、circles から決定的に選ぶだけで同じように動く。
   */
  useEffect(() => {
    if (demoSeeded.current || circles.length === 0 || state.checklist.length > 0) return;
    demoSeeded.current = true;
    // 未登録なら追加になる (checklist/toggle は登録済みのときだけ外す)。
    for (const entry of demoChecklistEntries(circles)) {
      dispatch({ type: 'checklist/toggle', id: entry.circleId, color: entry.color });
    }
  }, [circles, state.checklist.length, dispatch]);

  // ブロック+スペース → 地図 ID (実物は ComiketLayout が (comiketNo, blockId, spaceNo) で持つ)。
  const mapIdByPlace = useMemo(() => {
    const table = new Map<string, number>();
    for (const layout of layouts) table.set(`${layout.blockId}-${layout.spaceNo}`, layout.mapId);
    return table;
  }, [layouts]);

  // ジャンプ操作ツールバーの 3 つのドロップダウン (元実装はツールバー内に埋め込まれた ComboBox)。
  // ラベルもコマンド ID もアプリ側が決めて渡す。
  const jumpOptions = useMemo(
    () => ({
      days: (catalog?.dates ?? []).map((date, index) => ({
        label: WEEKDAY_NAMES[date.weekday] ?? `${date.id}日目`,
        command: COMMAND_JUMP_DAY + index,
      })),
      halls: (catalog?.areas ?? []).map((area, index) => ({
        label: area.name,
        command: COMMAND_JUMP_HALL + index,
      })),
      // インデックスジャンプは実物と同じブロック名 (「あ」〜「れ」→「Ａ」〜「Ｒ」→
      // 「ア」〜「リ」の 100 個)。サークル一覧の 3 つ目のセレクトと同じ並び。
      indexes: (catalog?.blocks ?? []).map((block, index) => ({
        label: block.name,
        command: COMMAND_JUMP_INDEX + index,
      })),
    }),
    [catalog],
  );

  const jumpToCircle = useCallback(
    (target: Circle | undefined) => {
      if (target) focusCircle(target.id);
    },
    [focusCircle],
  );

  /** ページ移動 > 前のブロック / 次のブロック (今の日付の中で 1 つ進める)。 */
  const jumpBlock = useCallback(
    (delta: number) => {
      const day = selectedCircle?.day ?? pageCircles[0]?.day ?? 1;
      const blocks = [
        ...new Set(circles.filter((circle) => circle.day === day).map((circle) => circle.blockId)),
      ].sort((a, b) => a - b);
      // 基準はカーソルのあるブロック (ページ先頭のブロックではない)。
      const current = selectedCircle?.blockId;
      const next = blocks[(current === undefined ? -1 : blocks.indexOf(current)) + delta];
      if (next === undefined) {
        setMessage('これ以上ブロックがありません');
        return;
      }
      jumpToCircle(circles.find((circle) => circle.day === day && circle.blockId === next));
    },
    [circles, pageCircles, jumpToCircle, selectedCircle],
  );

  /** 日付ジャンプ: 元実装「指定開催日の先頭ページに移動する」。 */
  const jumpToDay = useCallback(
    (index: number) => {
      const date = catalog?.dates?.[index];
      if (!date) return;
      jumpToCircle(circles.find((circle) => circle.day === date.id));
    },
    [catalog, circles, jumpToCircle],
  );

  /** ホールジャンプ: 元実装「現在の日付の、指定会場ホールの先頭ページに移動する」。 */
  const jumpToHall = useCallback(
    (index: number, day: number) => {
      const area = catalog?.areas?.[index];
      if (!area) return;
      jumpToCircle(
        circles.find(
          (circle) =>
            circle.day === day && mapIdByPlace.get(`${circle.blockId}-${circle.spaceNo}`) === area.mapId,
        ),
      );
    },
    [catalog, circles, mapIdByPlace, jumpToCircle],
  );

  /** インデックスジャンプ: 現在の日付で、指定したブロックの先頭へ。 */
  const jumpToIndex = useCallback(
    (index: number, day: number) => {
      const block = catalog?.blocks?.[index];
      if (!block) return;
      jumpToCircle(circles.find((circle) => circle.day === day && circle.blockId === block.id));
    },
    [catalog, circles, jumpToCircle],
  );

  // 検索 / 絞込みの結果が出たら先頭のサークルへカーソルを移す。
  useEffect(() => {
    const first = state.results?.[0];
    if (first) focusCircle(first.id);
  }, [state.results, focusCircle]);

  // 印刷中ダイアログはダミーで進捗を進める (元実装は実際の印刷処理の進捗を出す)。
  useEffect(() => {
    if (dialog !== 'printProgress') return;
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 100) {
          window.clearInterval(timer);
          setDialog(null);
          setMessage('印刷が完了しました');
          return 100;
        }
        return value + 10;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [dialog]);

  const zoomBy = useCallback((delta: number) => {
    // 拡大率を動かすと「元のサイズ / 拡大率指定」に切り替わる (合わせる指定は解除)。
    setZoomFit('free');
    setZoom((value) => {
      const index = ZOOM_STEPS.findIndex((step) => step >= value - 1e-6);
      const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, index + delta))];
      return next ?? value;
    });
  }, []);

  const handleToggleCheck = useCallback(() => {
    if (state.selectedId === null) return;
    // チェックリスト > 標準のチェック色 で選んだ色で登録する。
    dispatch({ type: 'checklist/toggle', id: state.selectedId, color: defaultCheckColor });
  }, [defaultCheckColor, dispatch, state.selectedId]);

  const openPreview = useCallback(
    (
      title: string,
      pageCount: number,
      print?: { kind: PrintSettingsTabId; rows: readonly { circle: Circle; color: CheckColor }[] },
    ) => {
      setPreview({ title, pageCount, pageNo: 1, zoom: 1, print });
      setPreviewOpen(true);
    },
    [],
  );

  /**
   * 印刷詳細設定のタブからプレビューを開く。元実装は形式ごとに用紙 1 枚の見本を出すので、
   * Web 版も印刷範囲のサークルから 1 ページを組み立てる (CHM 4PRINT/5PREVIEW.HTM)。
   */
  const openPrintPreview = useCallback(
    (tab: PrintSettingsTabId) => {
      const label = PRINT_SETTINGS_TABS.find((item) => item.id === tab)?.label ?? '';
      const target: PrintPreviewTarget =
        tab === 'list'
          ? printListSettings.target
          : tab === 'cut'
            ? printCutSettings.target
            : printMapSettings.target;
      const rows = printTargetCircles(state.checklist, (id) => circlesById.get(id), hallOf, target);
      // 1 ページに入る数 (リストはレイアウトの向き、カットは 6 x 6、マップは 1 面)。
      const perPage =
        tab === 'list' ? (printListSettings.layout.startsWith('landscape') ? 24 : 18) : tab === 'cut' ? 36 : 1;
      openPreview(`プレビュー - ${label}`, Math.max(1, Math.ceil(rows.length / perPage)), { kind: tab, rows });
    },
    [
      circlesById,
      hallOf,
      openPreview,
      printCutSettings.target,
      printListSettings.layout,
      printListSettings.target,
      printMapSettings.target,
      state.checklist,
    ],
  );

  /**
   * 印刷詳細設定 (163〜166) の props。メニューの「ファイル > 印刷詳細設定」からは単独で、
   * 印刷ダイアログ (1538) の「詳細設定(N)...」からはその上に重ねて出す (閉じるだけが違う)。
   */
  const printSettingsProps = {
    initialTab: printTab,
    listSettings: printListSettings,
    cutSettings: printCutSettings,
    mapSettings: printMapSettings,
    onListChange: (patch: Partial<PrintListSettings>) =>
      setPrintListSettings((value) => ({ ...value, ...patch })),
    onCutChange: (patch: Partial<PrintCutSettings>) =>
      setPrintCutSettings((value) => ({ ...value, ...patch })),
    onMapChange: (patch: Partial<PrintMapSettings>) =>
      setPrintMapSettings((value) => ({ ...value, ...patch })),
    onPreview: openPrintPreview,
  };

  /**
   * ウィンドウ位置を初期状態に戻す (ウィンドウ メニュー 60006)。取り込み画像と同じ 4 枚を
   * 初期配置で出し直し、それ以外のウィンドウとダイアログは閉じる。ライブラリの Window は
   * 初期位置をマウント時にしか読まないので、配置を計算し直して key を替え、作り直す。
   */
  const resetWindows = useCallback(() => {
    setLayout(layoutFor(window.innerWidth, window.innerHeight));
    setLayoutKey((key) => key + 1);
    setDetailOpen(true);
    setChecklistOpen(true);
    setMapOpen(true);
    setListOpen(false);
    setSearchOpen(false);
    setPreviewOpen(false);
    setPageSetupOpen(false);
    setPrintSettingsOpen(false);
    setImageDetailsOpen(false);
    setImageHelpOpen(false);
    setGotoPageOpen(false);
    setAboutOpen(false);
    setCoverOpen(false);
    setMemoTarget(null);
    setHelpPane(null);
    setDialog(null);
  }, []);

  const handleCommand = useCallback(
    (command: number) => {
      // ジャンプ操作ツールバーの 3 つは元実装のメニュー ID 帯の外にあるため、アプリ側で割り当てた。
      const jumpDay = pageCircles[0]?.day ?? 1;
      if (command >= COMMAND_JUMP_DAY && command < COMMAND_JUMP_DAY + 10) {
        jumpToDay(command - COMMAND_JUMP_DAY);
        return;
      }
      if (command >= COMMAND_JUMP_HALL && command < COMMAND_JUMP_HALL + 20) {
        jumpToHall(command - COMMAND_JUMP_HALL, jumpDay);
        return;
      }
      if (command >= COMMAND_JUMP_INDEX && command < COMMAND_JUMP_INDEX + 20) {
        jumpToIndex(command - COMMAND_JUMP_INDEX, jumpDay);
        return;
      }
      // チェックリスト: 標準色で追加 (33040)。選択中のサークルを標準のチェック色で登録する
      // (カットのリターンキーと同じ動き)。
      if (command === TOOLBAR_COMMANDS.checkAddStandardColor) {
        handleToggleCheck();
        return;
      }
      // チェックツールバー: 色1〜色9 (指定色でチェックに追加 / 色変更) と、チェックリストから外す。
      const color = command - TOOLBAR_COMMANDS.checkColorBase;
      if (color >= 1 && color <= 9) {
        if (state.selectedId === null) {
          setMessage('サークルを選択してください');
          return;
        }
        dispatch({ type: 'checklist/setColor', ids: [state.selectedId], color: color as CheckColor });
        setMessage(`色${color} でチェックしました`);
        return;
      }
      if (command === TOOLBAR_COMMANDS.checkRemove) {
        if (state.selectedId === null) {
          setMessage('サークルを選択してください');
          return;
        }
        dispatch({ type: 'checklist/remove', ids: [state.selectedId] });
        setMessage('チェックリストから外しました');
        return;
      }
      // チェックリスト > 標準のチェック色 (元実装は実行時に色 1〜9 を並べる)。
      const menuColor = command - CHECK_COLOR_COMMAND_BASE;
      if (menuColor >= 1 && menuColor <= 9) {
        setDefaultCheckColor(menuColor as CheckColor);
        setMessage(`標準のチェック色を色${menuColor} にしました`);
        return;
      }
      switch (command) {
        // ファイル: チェックリストの新規作成 / 保存 (CSV)
        case MENU_COMMANDS.newChecklist:
          dispatch({ type: 'checklist/replace', entries: [] });
          setMessage('新しいチェックリストにしました');
          break;
        case MENU_COMMANDS.saveChecklist:
          saveChecklist(2);
          break;
        case MENU_COMMANDS.saveChecklistAs:
          saveChecklist(2, `ccatalog-checklist-${new Date().toISOString().slice(0, 10)}.csv`);
          break;
        case EXTRA_COMMANDS.saveChecklistV1:
          saveChecklist(1);
          break;
        case EXTRA_COMMANDS.exportPrintSettings:
          exportSettings('print');
          break;
        case EXTRA_COMMANDS.importPrintSettings:
          importSettings('print');
          break;
        case EXTRA_COMMANDS.exportAppSettings:
          exportSettings('app');
          break;
        case EXTRA_COMMANDS.importAppSettings:
          importSettings('app');
          break;
        case MENU_COMMANDS.exit:
          window.close();
          setMessage('アプリケーションを終了しました');
          break;
        // 表示: アンチエイリアス / 高解像度表示 / リスト中のカット表示 (メニューのチェック印と連動)
        case TOOLBAR_COMMANDS.antiAlias:
          setAntiAlias((value) => !value);
          break;
        case EXTRA_COMMANDS.highResolution:
          setHighResolution((value) => !value);
          break;
        case EXTRA_COMMANDS.listCuts:
          setShowListCuts((value) => !value);
          break;
        // ページ移動: 前のブロック / 次のブロック
        case EXTRA_COMMANDS.prevBlock:
          jumpBlock(-1);
          break;
        case EXTRA_COMMANDS.nextBlock:
          jumpBlock(1);
          break;
        // チェックリスト: メモの消去 / クリップボード
        case CHECKLIST_MENU_COMMANDS.clearUncheckedMemos:
          dispatch({
            type: 'memo/clearUnchecked',
            keepIds: state.checklist.map((entry) => entry.circleId),
          });
          setMessage('チェックしていないサークルのメモを消去しました');
          break;
        case CHECKLIST_MENU_COMMANDS.clearAllMemos:
          dispatch({ type: 'memo/clear' });
          setMessage('全てのメモを消去しました');
          break;
        case CHECKLIST_MENU_COMMANDS.copyCircle:
          copySelectedCircle();
          break;
        case CHECKLIST_MENU_COMMANDS.pasteCircle:
          pasteCircles();
          break;
        // 検索: WEBページ / TWITTER / Pixiv を開く
        case EXTRA_COMMANDS.openWebPage:
        case EXTRA_COMMANDS.openTwitter:
        case EXTRA_COMMANDS.openPixiv: {
          const field = CIRCLE_LINK_FIELDS[command];
          openCircleLink(field, field === 'url' ? 'WEBページ' : field === 'twitter' ? 'TWITTER' : 'Pixiv');
          break;
        }
        // ヘルプ: 目次 / 検索 / キーワード / サポートページ
        case EXTRA_COMMANDS.helpContents:
        case EXTRA_COMMANDS.helpSearch:
        case EXTRA_COMMANDS.helpKeyword:
          setHelpPane(HELP_MODES[command]);
          break;
        case EXTRA_COMMANDS.supportPage:
          window.open(SUPPORT_URL, '_blank', 'noreferrer');
          break;
        case MENU_COMMANDS.search:
        case MENU_COMMANDS.searchQuick:
          setSearchOpen(true);
          break;
        case COMMAND_PAGE_PREV:
          setPageNo(Math.max(1, currentPage - 1));
          break;
        case COMMAND_PAGE_NEXT:
          setPageNo(currentPage + 1);
          break;
        case MENU_COMMANDS.gotoPage:
          setGotoPageOpen(true);
          break;
        case MENU_COMMANDS.zoomIn:
          zoomBy(1);
          break;
        case MENU_COMMANDS.zoomOut:
          zoomBy(-1);
          break;
        case MENU_COMMANDS.fitWidth:
          setZoomFit('width');
          break;
        case MENU_COMMANDS.fitHeight:
          setZoomFit('height');
          break;
        case MENU_COMMANDS.fitAll:
          setZoomFit('all');
          break;
        case MENU_COMMANDS.actualSize:
          setZoomFit('free');
          setZoom(1);
          break;
        case MENU_COMMANDS.back:
          goBack();
          break;
        case MENU_COMMANDS.forward:
          goForward();
          break;
        case MENU_COMMANDS.googleSearch: {
          // 検索メニューは選択中のサークル、サークル詳細のボタンは詳細に出ているサークル
          // (未選択なら直前のサークル) を検索する。
          openGoogleSearch(selectedCircle);
          break;
        }
        case MENU_COMMANDS.memoEdit:
          if (state.selectedId === null) setMessage('サークルを選択してください');
          else setMemoTarget(state.selectedId);
          break;
        case MENU_COMMANDS.about:
          setAboutOpen(true);
          break;
        // ファイル
        case MENU_COMMANDS.preferences:
          setDialog('preferences');
          break;
        case MENU_COMMANDS.print:
          setDialog('printDialog');
          break;
        case MENU_COMMANDS.printDetails:
          // 印刷詳細設定。元実装は形式ごとのダイアログだが、Web 版はタブ付き 1 枚で出す。
          setPrintTab('list');
          setDialog('printSettings');
          break;
        case MENU_COMMANDS.imageOutput:
          setImageOutput((value) => ({ ...value, pageTo: Math.max(1, lastPage) }));
          setDialog('imageOutput');
          break;
        case MENU_COMMANDS.switchComiket:
          setDialog('roundSwitch');
          break;
        case MENU_COMMANDS.circleData:
          setDialog('circleData');
          break;
        case MENU_COMMANDS.imageData:
          setDialog('imageData');
          break;
        case MENU_COMMANDS.databaseInit:
          setDialog('dataMenu');
          break;
        case MENU_COMMANDS.netUpdate:
        case MENU_COMMANDS.fileUpdate:
          setMessage('データの更新を確認しました（ダミー）');
          break;
        case MENU_COMMANDS.openChecklist:
          setImportMode('replace');
          setDialog('memoMerge');
          break;
        case MENU_COMMANDS.appendChecklist:
          setImportMode('append');
          setDialog('duplicateCheck');
          break;
        case MENU_COMMANDS.importCircleMs:
          setDialog('circleMsAuth');
          break;
        case MENU_COMMANDS.exportCircleMs:
          setDialog('exportResult');
          break;
        // ブックマーク / 検索設定
        case MENU_COMMANDS.bookmarkAdd:
          setDialog('bookmarkAdd');
          break;
        case MENU_COMMANDS.bookmarkOrganize:
          setDialog('bookmarkOrganize');
          break;
        case MENU_COMMANDS.googleSearchConfig:
          setDialog('googleSearch');
          break;
        case 61227:
          // チェック色の編集 (元ダイアログ 149)。色そのものを編集する。
          setDialog('checkColor');
          break;
        // ウィンドウメニュー (元実装は表示中の子ウィンドウから動的に作る)
        case WINDOW_MENU_COMMANDS.detail:
          setDetailOpen((open) => !open);
          break;
        case WINDOW_MENU_COMMANDS.list:
          setListOpen((open) => !open);
          break;
        case WINDOW_MENU_COMMANDS.checklist:
          setChecklistOpen((open) => !open);
          break;
        case WINDOW_MENU_COMMANDS.map:
          setMapOpen((open) => !open);
          break;
        case WINDOW_MENU_COMMANDS.bringToFront:
          setDetailOpen(true);
          setListOpen(true);
          setChecklistOpen(true);
          setMapOpen(true);
          setMessage('子ウィンドウを表示しました');
          break;
        case WINDOW_MENU_COMMANDS.resetPositions:
          resetWindows();
          setPageNo(null);
          setZoom(1);
          setMapZoom(0.5);
          setMessage('ウィンドウ位置を初期状態に戻しました');
          break;
        default: {
          // 表示 > ツールバー (32839〜32847) はドッキング ツールバー 5 本の表示 ON / OFF。
          const bar = TOOLBAR_BARS.find((candidate) => candidate.menuCommand === command);
          if (bar !== undefined) {
            setVisibleBars((bars) =>
              bars.includes(bar.id) ? bars.filter((id) => id !== bar.id) : [...bars, bar.id],
            );
            return;
          }
          setMessage(`コマンド ${command} はこの足場では未実装です`);
        }
      }
    },
    [
      checklistSelection,
      copySelectedCircle,
      currentPage,
      handleToggleCheck,
      dummyChecklistCsv,
      exportSettings,
      goBack,
      goForward,
      importChecklist,
      importSettings,
      jumpBlock,
      jumpToDay,
      jumpToHall,
      jumpToIndex,
      lastPage,
      openCircleLink,
      openGoogleSearch,
      resetWindows,
      pageCircles,
      pasteCircles,
      saveChecklist,
      selectedCircle,
      state.checklist,
      state.googleSearch,
      state.selectedId,
      zoomBy,
    ],
  );

  const handleOpenDetail = useCallback(
    (id: number) => {
      focusCircle(id);
      // 標準のチェック色で登録する (チェックリスト > 標準のチェック色)。
      dispatch({ type: 'checklist/toggle', id, color: defaultCheckColor });
    },
    [defaultCheckColor, dispatch, focusCircle],
  );

  const runSearch = useCallback(() => {
    dispatch({ type: 'search/run' });
    setListOpen(true);
    if (!keepSearchOpen) setSearchOpen(false);
  }, [dispatch, keepSearchOpen]);

  const narrowSearch = useCallback(() => {
    dispatch({ type: 'search/narrow' });
    setListOpen(true);
    if (!keepSearchOpen) setSearchOpen(false);
  }, [dispatch, keepSearchOpen]);

  /**
   * 簡易検索 (一覧ウィンドウのキーワード + リターンキー)。キーワード以外の条件は
   * 最後に検索したときのもの (state.condition) をそのまま引き継ぐ。
   */
  const runQuickSearch = useCallback(
    (keywords: string) => {
      dispatch({ type: 'search/conditionChanged', patch: { keywords } });
      dispatch({ type: 'search/run' });
    },
    [dispatch],
  );

  // プレビュー面に出す 1 ページ (印刷形式ごと)。画像ではなく実データで組む。
  // サークルリスト印刷の見出しは、実物と同じ「コミックマーケット96 1日目 （金）」。
  const previewListTitle =
    preview.print?.kind !== 'list' || preview.print.rows.length === 0
      ? ''
      : (() => {
          const circle = preview.print.rows[0].circle;
          const date = (catalog?.dates ?? []).find((entry) => entry.id === circle.day);
          const weekday = date === undefined ? '' : `（${WEEKDAY_SHORT[date.weekday]}）`;
          return `${catalog?.info.comiketName ?? ''} ${circle.day}日目 ${weekday}`.trim();
        })();

  const previewContent: ReactNode =
    preview.print === undefined ? undefined : preview.print.kind === 'list' ? (
      <PrintListPreview
        rows={orderPrintRows(preview.print.rows, printListSettings.pageBreakOrder)}
        items={printListSettings.items}
        title={previewListTitle}
        dayLabelOf={dayLabelOf}
        genreNameOf={(circle) => genreNames[circle.genreId] ?? ''}
        printSequenceNumber={printListSettings.printSequenceNumber}
        layout={printListSettings.layout}
        pageNo={preview.pageNo}
        pageCount={preview.pageCount}
        checkColors={printCheckColors}
      />
    ) : preview.print.kind === 'cut' ? (
      <PrintCutPreview
        rows={preview.print.rows}
        cutSize={cutSize}
        printFrame={printCutSettings.printFrame}
        cutPacking={printCutSettings.cutPacking}
        cellWidth={cutSize.width * 0.5}
        imageUrlOf={(circle) => imageOf(`/cuts/${circle.id}.png`)}
        checkColors={printCheckColors}
      />
    ) : (
      <PrintMapPreview
        map={activeMap}
        imageUrl={activeMap ? assetUrl(`/maps/${activeMap.filename}.svg`) : ''}
        layouts={layouts.filter((layout) => layout.mapId === activeMapId)}
        rows={preview.print.rows}
        deskSize={{ width: catalog?.info.mapSizeW || 10, height: catalog?.info.mapSizeH || 10 }}
        blank={preview.print.kind === 'blankMap'}
        genreDensity={printMapSettings.overlayGenre ? printMapSettings.overlayDensity : 0}
        genreColorOf={(circle) => genreColor(circle.genreId)}
        checkColors={printCheckColors}
        sketch={printMapSettings.printSketchMap}
        rotateSketch={printMapSettings.rotateSketchMap}
        colorLegend={printMapSettings.printColorLegend}
        packing={printMapSettings.mapPacking}
        landscape={printMapSettings.layout.startsWith('landscape')}
      />
    );

  // タイトルバーは元実装と同じ「アプリ名 - チェックリストのドキュメント名」。
  // 検索のヒット件数はサークル一覧ウィンドウのステータスバーに出す (実測 title: "コミックマーケット カタロム - 新規チェックリスト")。
  const windowTitle = 'コミックマーケット カタロム - 新規チェックリスト';

  return (
    <Win98Provider className="desktop">
      <MainWindow
        key={`main-${layoutKey}`}
        title={windowTitle}
        initialX={layout.main.x}
        initialY={layout.main.y}
        width={layout.main.width}
        height={layout.main.height}
        circles={pageCircles}
        cutHeading={cutHeading}
        cutHeadingAlign={cutHeadingAlign}
        message={message}
        pageNo={currentPage}
        selectedId={state.selectedId}
        checkedIds={checkedIds}
        colorById={colorById}
        imageUrl={(circle) => imageOf(`/cuts/${circle.id}.png`)}
        onCommand={handleCommand}
        onSelect={(id) => dispatch({ type: 'circle/select', id })}
        onOpenDetail={handleOpenDetail}
        onPageChange={setPageNo}
        lastPage={lastPage}
        jumpOptions={jumpOptions}
        zoom={Math.round(zoom * 100)}
        cellWidth={cellWidth}
        onViewBoxChange={setCutBox}
        operation={cutViewOperation}
        onMoveNext={focusNextCircle}
        visibleBars={visibleBars}
        checkedCommands={checkedCommandIds}
        checkColor={defaultCheckColor}
        antiAlias={antiAlias}
        onAntiAliasChange={setAntiAlias}
        checkColors={displayCheckColors}
        onZoomChange={(percent) => {
          // 拡大率を直接指定したら「合わせる」は解除 (元実装のツールバー内 Edit)。
          setZoomFit('free');
          setZoom(percent / 100);
        }}
        onClose={() => setMessage('メインウィンドウは閉じられません')}
      />

      {detailOpen && (
        <DetailWindow
          key={`detail-${layoutKey}`}
          initialX={layout.detail.x}
          initialY={layout.detail.y}
          width={layout.detail.width}
          height={layout.detail.height}
          circle={detailCircle}
          genreName={detailCircle ? genreNames[detailCircle.genreId] ?? '' : ''}
          dayLabel={detailPosition.dayLabel}
          areaLabel={detailPosition.areaLabel}
          checked={detailCircleId !== null && checkedIds.has(detailCircleId)}
          checkColor={colorById.get(detailCircleId ?? -1) ?? 0}
          memo={detailCircleId === null ? '' : memoOf(detailCircleId)}
          onToggleCheck={toggleDetailCheck}
          onSetColor={(color) =>
            detailCircleId !== null &&
            dispatch({ type: 'checklist/setColor', ids: [detailCircleId], color })
          }
          onMemoChange={(memo) =>
            detailCircleId !== null && dispatch({ type: 'memo/set', id: detailCircleId, memo })
          }
          onGoogleSearch={() => openGoogleSearch(detailCircle)}
          onGoogleSearchSettings={() => setDialog('googleSearch')}
          onClose={() => setDetailOpen(false)}
          onMinimize={() => iconify('detail')}
          checkColors={displayCheckColors}
        />
      )}

      {checklistOpen && (
        <ChecklistWindow
          key={`checklist-${layoutKey}`}
          initialX={layout.checklist.x}
          initialY={layout.checklist.y}
          width={layout.checklist.width}
          height={layout.checklist.height}
          rows={checklistRows}
          days={CHECKLIST_DAYS}
          activeDay={activeDay}
          counts={checklistCounts}
          colorNames={checkColorNames}
          locked={checklistLocked}
          selectedIds={checklistSelection}
          onActiveDayChange={setActiveDay}
          onSelectionChange={setChecklistSelection}
          onToggleLock={() => setChecklistLocked((locked) => !locked)}
          onSetColor={(ids, color) => dispatch({ type: 'checklist/setColor', ids, color })}
          onRemove={(ids) => dispatch({ type: 'checklist/remove', ids })}
          onOrderBy={(column) => dispatch({ type: 'checklist/orderBy', column })}
          onOpenDetail={focusCircle}
          onClose={() => setChecklistOpen(false)}
          onMinimize={() => iconify('checklist')}
          checkColors={displayCheckColors}
          visibleColumns={state.listDisplay.checklist}
          onFetchRss={() => setMessage('サークルのRSS情報を取得しました（ダミー）')}
        />
      )}

      {mapOpen && (
        <MapWindow
          key={`map-${layoutKey}`}
          initialX={layout.map.x}
          initialY={layout.map.y}
          width={layout.map.width}
          height={layout.map.height}
          info={catalog?.info ?? null}
          maps={maps}
          activeMapId={activeMap?.id ?? 1}
          onActiveMapChange={setActiveMapId}
          entries={mapEntries}
          imageUrl={activeMap ? imageOf(`/maps/${activeMap.filename}.png`) : ''}
          zoom={mapZoom}
          onZoomChange={(value) => setMapZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)))}
          selectedId={state.selectedId}
          onSelect={(id) => dispatch({ type: 'circle/select', id })}
          onOpenDetail={focusCircle}
          onClose={() => setMapOpen(false)}
          onMinimize={() => iconify('map')}
          checkColors={displayCheckColors}
          highResolution={highResolution}
        />
      )}

      {listOpen && (
        <ListWindow
          initialX={layout.list.x}
          initialY={layout.list.y}
          width={layout.list.width}
          height={layout.list.height}
          circles={circles}
          results={state.results}
          genres={genres}
          blocks={catalog?.blocks ?? []}
          dates={catalog?.dates ?? []}
          selectedId={state.selectedId}
          status={state.status}
          onSelect={(id) => dispatch({ type: 'circle/select', id })}
          onOpenDetail={focusCircle}
          onSearch={runQuickSearch}
          onOpenSearch={() => setSearchOpen(true)}
          locked={listLocked}
          onToggleLock={() => setListLocked((value) => !value)}
          colorNames={checkColorNames}
          onSetColor={(ids, color) => dispatch({ type: 'checklist/setColor', ids, color })}
          onRemove={(ids) => dispatch({ type: 'checklist/remove', ids })}
          onClose={() => setListOpen(false)}
          onMinimize={() => iconify('list')}
          checkColors={displayCheckColors}
          visibleColumns={state.listDisplay.list}
          followDay={listFollow?.day ?? null}
          followBlockId={listFollow?.blockId ?? null}
          showCuts={showListCuts}
        />
      )}

      {/*
        ダイアログ類の重ね順。ライブラリのウィンドウ管理は「新しく開いた窓は、今アクティブな窓より
        1 つ後ろに置く」(useWindowManager.register) ので、メインウィンドウのメニューから開いた
        ダイアログはメインウィンドウの後ろに隠れてしまう。ダイアログを 1 つの重ね順にまとめて
        前面に出す (位置指定 + z-index で作った重ね順の中では fixed の子はその中に描かれる)。
      */}
      <div style={DIALOG_LAYER_STYLE}>
      {searchOpen && (
        <SearchWindow
          key={`search-${layoutKey}`}
          initialX={layout.search.x}
          initialY={layout.search.y}
          width={layout.search.width}
          height={layout.search.height}
          condition={state.condition}
          genres={genres}
          canNarrow={state.results !== null}
          canUndoNarrow={state.narrowedFrom !== null}
          keepOpen={keepSearchOpen}
          onKeepOpenChange={setKeepSearchOpen}
          onConditionChange={(patch) => dispatch({ type: 'search/conditionChanged', patch })}
          onSearch={runSearch}
          onNarrow={narrowSearch}
          onUndoNarrow={() => dispatch({ type: 'search/undoNarrow' })}
          onReset={() => dispatch({ type: 'search/reset' })}
          onClose={() => setSearchOpen(false)}
        />
      )}

      {memoTarget !== null && (
        <MemoDialog
          title="メモの編集"
          value={memoOf(memoTarget)}
          initialX={300}
          initialY={220}
          onSave={(memo) => {
            dispatch({ type: 'memo/set', id: memoTarget, memo });
            setMemoTarget(null);
          }}
          onClose={() => setMemoTarget(null)}
        />
      )}

      {dialog === 'checkColor' && (
        <CheckColorDialog
          checkColors={state.checkColors}
          onChange={(patch) => dispatch({ type: 'checkColors/set', patch })}
          onClose={() => setDialog(null)}
        />
      )}

      {gotoPageOpen && (
        <GotoPageDialog
          pageNo={currentPage}
          minPage={Number.isFinite(firstPage) ? firstPage : 1}
          maxPage={lastPage}
          onGoto={(page) => {
            setPageNo(page);
            setGotoPageOpen(false);
          }}
          onClose={() => setGotoPageOpen(false)}
        />
      )}

      {aboutOpen && (
        <AboutDialog
          info={catalog?.info ?? null}
          genreCount={genres.length}
          circleCount={circles.length}
          onClose={() => setAboutOpen(false)}
        />
      )}

      {coverOpen && (
        <CoverDialog
          catalogName={catalog?.info.comiketName ?? 'コミックマーケット96（ダミー）'}
          onClose={() => setCoverOpen(false)}
        />
      )}

      {helpPane !== null && (
        // 印刷ダイアログ (1538) の「詳細説明」からも開くため、ダイアログの上に重ねる。
        <div style={DIALOG_LIFT_STYLE}>
          <HelpWindow pane={helpPane} onClose={() => setHelpPane(null)} />
        </div>
      )}

      {dialog === 'preferences' && (
        <PreferencesDialog
          settings={state.settings}
          imagePath={state.imagePath}
          listDisplay={state.listDisplay}
          checkColors={state.checkColors}
          onChange={(patch) => dispatch({ type: 'settings/set', patch })}
          onImagePathChange={(patch) => dispatch({ type: 'imagePath/set', patch })}
          onListDisplayChange={(patch) => dispatch({ type: 'listDisplay/set', patch })}
          onCheckColorsChange={(patch) => dispatch({ type: 'checkColors/set', patch })}
          onReset={() => dispatch({ type: 'settings/reset' })}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'googleSearch' && (
        <GoogleSearchDialog
          settings={state.googleSearch}
          onChange={(patch) => dispatch({ type: 'googleSearch/set', patch })}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'pageSetup' && (
        <PageSetupDialog
          setup={state.pageSetup}
          onChange={(setup) => dispatch({ type: 'pageSetup/set', patch: setup })}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'dataMenu' && (
        <ListDialog
          title="データベースの初期化"
          items={DATA_MENU_ITEMS}
          onSelect={(id) => setDialog(id === 'databaseMerge' ? 'databaseMerge' : 'memoMerge')}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'printSettings' && (
        <PrintSettingsDialog {...printSettingsProps} onClose={() => setDialog(null)} />
      )}

      {dialog === 'printDialog' && (
        <>
          <PrintDialog
            maxPage={lastPage}
            onPrint={(options) => {
              setMessage(`${options.printer} へ印刷します`);
              // 実物と同じく、OK のあとは印刷形式ごとの詳細設定 (163〜166) を出す。
              setPrintTab(options.format);
              setDialog('printSettings');
            }}
            // 実物と同じく、用紙・余白の設定 (203) は印刷ダイアログから開く。
            onPageSetup={() => setPageSetupOpen(true)}
            // 詳細設定 (1051)。メニューの「印刷詳細設定」と同じダイアログを選んだ形式のタブで重ねる。
            onDetails={(format) => {
              setPrintTab(format);
              setPrintSettingsOpen(true);
            }}
            // 詳細説明 (1642)。実物はヘルプ (CHM) を開くので、Web 版はヘルプの目次を出す。
            onHelp={() => setHelpPane('contents')}
            // プレビュー (1052)。選んだ印刷形式のプレビューを開く。
            onPreview={openPrintPreview}
            onClose={() => {
              setPrintSettingsOpen(false);
              setDialog(null);
            }}
          />
          {printSettingsOpen && (
            <div style={DIALOG_LIFT_STYLE}>
              {/* 印刷ダイアログの右隣に出す (画像ファイル出力の詳細設定と同じ置き方)。 */}
              <PrintSettingsDialog
                {...printSettingsProps}
                initialX={820}
                initialY={80}
                onClose={() => setPrintSettingsOpen(false)}
              />
            </div>
          )}
          {pageSetupOpen && (
            <div style={DIALOG_LIFT_STYLE}>
              <PageSetupDialog
                setup={state.pageSetup}
                onChange={(setup) => dispatch({ type: 'pageSetup/set', patch: setup })}
                onClose={() => setPageSetupOpen(false)}
              />
            </div>
          )}
        </>
      )}

      {previewOpen && (
        <div style={DIALOG_LIFT_STYLE}>
        <PrintPreviewWindow
          key={`preview-${layoutKey}`}
          title={preview.title}
          pageCount={preview.pageCount}
          pageNo={preview.pageNo}
          imageUrl={activeMap ? imageOf(`/maps/${activeMap.filename}.png`) : ''}
          content={previewContent}
          zoom={preview.zoom}
          pageSetup={state.pageSetup}
          checkColors={preview.print?.kind === 'blankMap' ? undefined : printCheckColors}
          checkColorNames={checkColorNames}
          fillContent={preview.print?.kind === 'list'}
          onZoomChange={(value) => setPreview((current) => ({ ...current, zoom: value }))}
          onPageChange={(page) =>
            setPreview((current) => ({
              ...current,
              pageNo: Math.min(current.pageCount, Math.max(1, page)),
            }))
          }
          onClose={() => setPreviewOpen(false)}
        />
        </div>
      )}

      {dialog === 'printProgress' && (
        <PrintProgressDialog
          title="印刷中..."
          percent={progress}
          onCancel={() => {
            setDialog(null);
            setMessage('印刷をキャンセルしました');
          }}
        />
      )}

      {dialog === 'imageOutput' && (
        <>
          <ImageFileOutputDialog
            {...imageOutput}
            maxPage={lastPage}
            onChange={(patch) => setImageOutput((value) => ({ ...value, ...patch }))}
            onOutput={() => {
              // 出力範囲は「すべて」なら全ページ、ページ指定なら指定を解釈する (CHM 4PRINT/6BMP.HTM)。
              const pages = imageOutput.allPages
                ? [...Array(Math.max(1, lastPage))].map((_, index) => index + 1)
                : parsePageSpec(imageOutput.pageSpec, lastPage);
              setImageDetailsOpen(false);
              setDialog(null);
              setMessage(
                `${imageOutput.directory} へ ${pages.length} ページを ${imageOutput.format.toUpperCase()} で出力しました（ダミー）`,
              );
            }}
            onPreview={() => {
              setImageDetailsOpen(false);
              setDialog(null);
              openPreview('プレビュー - 画像ファイル出力', Math.max(1, lastPage));
            }}
            onOpenDetails={() => setImageDetailsOpen(true)}
            onHelp={() => setImageHelpOpen(true)}
            onClose={() => {
              setImageDetailsOpen(false);
              setDialog(null);
            }}
          />
          {/* 詳細設定 (1051) は印刷詳細設定 (163〜166) を上に重ねる。出力形式のタブで開く。 */}
          {imageDetailsOpen && (
            <div style={DIALOG_LIFT_STYLE}>
              {/* 印刷ダイアログの詳細設定と同じ置き方 (右隣に重ねる)。 */}
              <PrintSettingsDialog
                {...printSettingsProps}
                initialTab={imageOutput.outputFormat}
                onClose={() => setImageDetailsOpen(false)}
                initialX={820}
                initialY={120}
              />
            </div>
          )}
        </>
      )}

      {imageHelpOpen && (
        <ImageOutputHelpDialog onClose={() => setImageHelpOpen(false)} />
      )}

      {dialog === 'exportResult' && (
        <ExportResultDialog
          failures={['サンプル商会（ダミーで 2 件失敗）', 'テスト工房（ダミーで 1 件失敗）']}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'bookmarkAdd' && (
        <BookmarkAddDialog
          defaultName={`${currentPage} ページ`}
          pageNo={currentPage}
          onAdd={(name) => {
            dispatch({ type: 'bookmarks/add', name, pageNo: currentPage });
            setDialog(null);
            setMessage(`ブックマーク「${name}」を追加しました`);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'bookmarkOrganize' && (
        <BookmarkOrganizeDialog
          bookmarks={state.bookmarks}
          onRename={(id, name) => dispatch({ type: 'bookmarks/rename', id, name })}
          onRemove={(ids) => dispatch({ type: 'bookmarks/remove', ids })}
          onSetGroup={(ids, group) => dispatch({ type: 'bookmarks/setGroup', ids, group })}
          onJump={(page) => {
            setPageNo(page);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'roundSwitch' && (
        <RoundSwitchDialog
          rounds={[
            { comiketNo: 96, name: 'コミックマーケット96（ダミー）', installed: true },
            { comiketNo: 95, name: 'コミックマーケット95（ダミー）', installed: true },
            { comiketNo: 94, name: 'コミックマーケット94（ダミー）', installed: false },
          ]}
          currentComiketNo={catalog?.info.comiketNo ?? 96}
          onSwitch={(comiketNo) => {
            setDialog(null);
            setMessage(`コミックマーケット${comiketNo} に切り替えました（ダミー）`);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'circleData' && (
        <CircleDataDialog
          installed={[
            { comiketNo: 96, name: 'コミックマーケット96（ダミー）', installed: true },
            { comiketNo: 95, name: 'コミックマーケット95（ダミー）', installed: true },
          ]}
          available={[{ comiketNo: 94, name: 'コミックマーケット94（ダミー）', installed: false }]}
          currentComiketNo={catalog?.info.comiketNo ?? 96}
          progress={null}
          onInstall={(comiketNo) => setMessage(`コミックマーケット${comiketNo} のデータをインストールしました（ダミー）`)}
          onRemove={(comiketNo) => setMessage(`コミックマーケット${comiketNo} のデータを削除しました（ダミー）`)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'imageData' && (
        <ImageDataDialog
          installed={[
            { comiketNo: 96, name: 'コミックマーケット96（ダミー）', installed: true },
            { comiketNo: 95, name: 'コミックマーケット95（ダミー）', installed: true },
          ]}
          available={[{ comiketNo: 94, name: 'コミックマーケット94（ダミー）', installed: false }]}
          installedImages={[96, 95]}
          currentComiketNo={catalog?.info.comiketNo ?? 96}
          progress={null}
          onInstall={(comiketNo) => setMessage(`コミックマーケット${comiketNo} の画像データを追加しました（ダミー）`)}
          onRemove={(comiketNo) => setMessage(`コミックマーケット${comiketNo} の画像データを削除しました（ダミー）`)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'databaseMerge' && (
        <DatabaseMergeDialog
          candidates={[{ comiketNo: 95, name: 'コミックマーケット95（ダミー）', circleCount: 120 }]}
          onMerge={(comiketNo) => {
            setDialog(null);
            setMessage(`コミックマーケット${comiketNo} のデータを統合しました（ダミー）`);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'memoMerge' && (
        <MemoMergeDialog
          candidates={[{ comiketNo: 96, memoCount: state.checklist.length, sourceLabel: 'checklist.csv（ダミー）' }]}
          onMerge={(sourceLabel) => {
            setDialog('loadCircleConfirm');
            setMessage(`${sourceLabel} のメモを統合します（ダミー）`);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'loadCircleConfirm' && (
        <LoadCircleConfirmDialog
          items={circles.slice(0, 3).map((circle) => ({
            id: String(circle.id),
            importedName: circle.circleName,
            importedPenName: circle.penName,
            importedColor: '標準色',
            importedMemo: '',
            currentCandidates: [{ id: circle.id, name: circle.circleName, penName: circle.penName }],
            action: 'do' as const,
          }))}
          onChange={() => undefined}
          onApply={() => {
            setDialog(null);
            // Web 版はファイル選択の代わりに、同梱カタログから作った CSV を取り込む。
            importChecklist(dummyChecklistCsv(), importMode);
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'duplicateCheck' && (
        <DuplicateCheckDialog
          duplicates={circles.slice(0, 2).map((circle) => ({
            name: circle.circleName,
            penName: circle.penName,
            count: 2,
          }))}
          onConfirm={() => setDialog('loadCircleConfirm')}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'circleMsAuth' && (
        <CircleMsAuthDialog
          status="idle"
          onStart={() => {
            setDialog('exportResult');
            setMessage('Circle.ms の認証を開始しました（ダミー）');
          }}
          onCancel={() => setDialog(null)}
          onClose={() => setDialog(null)}
        />
      )}

      {startupStep === 'confirm' && (
        <StartupConfirmDialog
          catalogName={catalog?.info.comiketName ?? 'コミックマーケット96（ダミー）'}
          onLaunch={() => setStartupStep('serial')}
          onExit={() => setStartupStep('done')}
        />
      )}

      {startupStep === 'serial' && (
        <SerialInputDialog
          onSubmit={() => setStartupStep('sendInfo')}
          onCancel={() => setStartupStep('done')}
        />
      )}

      {startupStep === 'sendInfo' && (
        <SendInfoDialog
          payload={[
            'OS名: Windows (ダミー)',
            'メモリサイズ: 16 GB (ダミー)',
            'プロセッサ情報: Dummy CPU (ダミー)',
            '画面サイズ: 1500 x 950 (ダミー)',
          ].join('\n')}
          onAnswer={() => setStartupStep('done')}
        />
      )}
      </div>

      {/*
        画面下のタスクバー (実物の Windows 98 のタスクバー)。実物は左端にスタート
        ボタンがあるが、Web 版では置かず (メニューはメインウィンドウ側にある)、
        トレイの時計だけを出す。ウィンドウより前面に置いて、重なっても隠れないようにする。
      */}
      <Taskbar
        data-testid="taskbar"
        style={TASKBAR_STYLE}
        showTray
      />
    </Win98Provider>
  );
}
