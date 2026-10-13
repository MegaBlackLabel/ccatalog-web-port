import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Win98Provider } from '@megablacklabel/react98retro';
import '@megablacklabel/react98retro/style.css';
import './styles/app.css';
import { useCatalog } from './app/use-catalog';
import type { CheckColor, ChecklistEntry } from './app/catalog-state';
import { MENU_COMMANDS } from './ui/menu/menu-defs';
import { WINDOW_MENU_COMMANDS } from './ui/menu/to-menu-bar';
import { MainWindow } from './ui/main/MainWindow';
import { SearchWindow } from './ui/search/SearchWindow';
import { ListWindow } from './ui/list/ListWindow';
import { DetailWindow } from './ui/detail/DetailWindow';
import { ChecklistWindow, type ChecklistRow } from './ui/checklist/ChecklistWindow';
import { CheckColorDialog } from './ui/checklist/CheckColorDialog';
import { MapWindow, type MapWindowEntry, type MapWindowSeat } from './ui/map/MapWindow';
import { AboutDialog } from './ui/dialog/AboutDialog';
import { GotoPageDialog } from './ui/dialog/GotoPageDialog';
import { MemoDialog } from './ui/dialog/MemoDialog';
import { PreferencesDialog } from './ui/dialog/PreferencesDialog';
import { GoogleSearchDialog } from './ui/dialog/GoogleSearchDialog';
import { PageSetupDialog } from './ui/dialog/PageSetupDialog';
import { ListDialog, type ListDialogItem } from './ui/dialog/ListDialog';
import { ExportResultDialog } from './ui/dialog/ExportResultDialog';
import { BookmarkAddDialog } from './ui/bookmark/BookmarkAddDialog';
import { BookmarkOrganizeDialog } from './ui/bookmark/BookmarkOrganizeDialog';
import { PrintListDialog, DEFAULT_PRINT_LIST_SETTINGS, type PrintListSettings } from './ui/print/PrintListDialog';
import { PrintCutDialog, DEFAULT_PRINT_CUT_SETTINGS, type PrintCutSettings } from './ui/print/PrintCutDialog';
import { PrintMapDialog, DEFAULT_PRINT_MAP_SETTINGS, type PrintMapSettings } from './ui/print/PrintMapDialog';
import { PrintDialog } from './ui/print/PrintDialog';
import { PrintPreviewWindow } from './ui/print/PrintPreviewWindow';
import { PrintProgressDialog } from './ui/print/PrintProgressDialog';
import { ImageFileOutputDialog, type ImageFormat } from './ui/print/ImageFileOutputDialog';
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
import type { Circle, MapInfo } from './domain/types';
import { KANA_ROWS, OTHER_KANA_ROW, kanaRowOf } from './domain/kana';
import { assetUrl } from './ui/asset-url';

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;

/** ダミーのサークルカット画像 (public/cuts/<id>.png)。 */
const cutImageUrl = (circle: { id: number }) => assetUrl(`/cuts/${circle.id}.png`);

/** 会場マップのダミー画像 (public/maps/<filename>.png)。 */
const mapImageUrl = (map: MapInfo | undefined) => (map ? assetUrl(`/maps/${map.filename}.png`) : '');

const CHECKLIST_DAYS = [1, 2, 3, 4, 0];
/** 元実装の「色の設定」で付けられる色名。空なら「色N」で表示される。 */
const COLOR_NAMES = ['', '', '', '', '', '', '', '', ''];

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
 * ウィンドウの初期配置。元実装の初期レイアウト (左にサークルカット / 右上にサークル詳細 /
 * 右下にチェックリスト) を基準に、画面が広いときは主要ウィンドウが重ならないように並べる
 * (地図だけは実物と同じ幅 690px を優先するので、右端でサークル詳細と少し重なる)。
 *
 * main 900x629 / checklist 900x396 は元アプリのウィンドウ実寸をそのまま使う。
 * 座標はライブラリのデスクトップ余白 8px を基準にし、隣り合うウィンドウの間を 8px 空ける
 * (Window の getResponsiveSize が x/y を 8 未満から 8 に持ち上げるため、0 起点だと重なる)。
 */
const LAYOUT_WIDE: Record<LayoutName, WindowBox> = {
  // 1920x1080 の画面に主要な 5 枚を並べる寸法。地図は実物と同じ 690x542 (MapWindow の
  // 最小幅) なので、1920px 幅では右端でサークル詳細と少し重なる (実物の初期配置も
  // カット/一覧/地図が重なっている)。x はデスクトップの右端 8px 内側に合わせる。
  main: { x: 8, y: 8, width: 856, height: 600 },
  detail: { x: 872, y: 8, width: 500, height: 600 },
  map: { x: 1222, y: 8, width: 690, height: 560 },
  checklist: { x: 8, y: 616, width: 782, height: 390 },
  list: { x: 798, y: 616, width: 714, height: 390 },
  search: { x: 608, y: 128, width: 620, height: 470 },
};

/**
 * 1366x768 級の画面用。4 画面まで並べ、地図と検索は必要なときに開く。
 * (実測でも元アプリの初期表示は カット+詳細 の 2 枚だけ。広い画面では見やすさを優先して増やす)
 */
const LAYOUT_COMPACT: Record<LayoutName, WindowBox> = {
  main: { x: 8, y: 8, width: 716, height: 440 },
  detail: { x: 736, y: 8, width: 512, height: 600 },
  checklist: { x: 8, y: 452, width: 784, height: 310 },
  list: { x: 804, y: 452, width: 460, height: 310 },
  // 狭い画面では 5 枚は重なる (実物もカット/一覧/地図が重なっている)。地図は動かして使う。
  map: { x: 120, y: 120, width: 700, height: 500 },
  search: { x: 520, y: 70, width: 620, height: 470 },
};

/** メインウィンドウのジャンプ 3 つ (日付 / ホール / インデックス) が送るコマンド ID の先頭。 */
const COMMAND_JUMP_DAY = 34000;
const COMMAND_JUMP_HALL = 34100;
const COMMAND_JUMP_INDEX = 34300;

/** `ComiketDate.weekday` の表記 (実物 DB は 1=日 … 7=土)。元実装のコンボは「金曜日」を出す。 */
const WEEKDAY_NAMES = ['', '日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'] as const;

/** 起動シーケンス (元実装: 起動確認 → シリアル番号 → 情報送信)。 */
type StartupStep = 'confirm' | 'serial' | 'sendInfo' | 'done';

/** 同時に開けるモーダルは 1 つ。元実装の WM_COMMAND ID からここへ振り分ける。 */
type DialogKey =
  | 'preferences'
  | 'googleSearch'
  | 'pageSetup'
  | 'printMenu'
  | 'dataMenu'
  | 'printList'
  | 'printCut'
  | 'printMap'
  | 'printBlankMap'
  | 'printDialog'
  | 'printPreview'
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

/** 印刷詳細設定 (32823) の下位メニュー。元実装は種類ごとのダイアログを開く。 */
const PRINT_MENU_ITEMS: ListDialogItem[] = [
  { id: 'printList', label: 'サークルリスト印刷', detail: '一覧を列レイアウトで印刷' },
  { id: 'printCut', label: 'サークルカット印刷', detail: 'カット画像を並べて印刷' },
  { id: 'printMap', label: 'マップ印刷', detail: '会場マップにサークル位置を重ねて印刷' },
  { id: 'printBlankMap', label: '白地図印刷', detail: 'サークル位置を塗らない白地図' },
  { id: 'pageSetup', label: '用紙サイズ・余白の設定' },
  { id: 'imageOutput', label: '画像ファイル出力' },
];

/** データベースの初期化 (32858) から開く、データ統合まわりのダイアログ。 */
const DATA_MENU_ITEMS: ListDialogItem[] = [
  { id: 'databaseMerge', label: '古いデータベースの統合', detail: '旧版の DB を取り込む' },
  { id: 'memoMerge', label: 'サークルメモの統合', detail: 'チェックリストのメモを統合する' },
];

const COMMAND_PAGE_PREV = MENU_COMMANDS.pagePrev;
const COMMAND_PAGE_NEXT = MENU_COMMANDS.pageNext;

export default function App({ startup = true }: { startup?: boolean } = {}) {
  const { state, dispatch } = useCatalog();

  // 1920x1080 以上なら主要 5 ウィンドウを重ねずに並べる (LAYOUT_WIDE の全体 1912x1006)。
  const [wideLayout] = useState(() => window.innerWidth >= 1920 && window.innerHeight >= 1040);
  const layout = wideLayout ? LAYOUT_WIDE : LAYOUT_COMPACT;

  const [searchOpen, setSearchOpen] = useState(false);
  // 実装済みのウィンドウは最初から全部出す (ユーザー指示)。狭い画面では重なるが動かせる。
  const [listOpen, setListOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(true);
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [mapOpen, setMapOpen] = useState(true);
  const [keepSearchOpen, setKeepSearchOpen] = useState(true);
  const [pageNo, setPageNo] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [mapZoom, setMapZoom] = useState(0.5);
  const [activeMapId, setActiveMapId] = useState(1);
  const [activeDay, setActiveDay] = useState(1);
  const [checklistLocked, setChecklistLocked] = useState(false);
  /** サークル一覧のリストロック (1WINDOW/6LIST.HTM: 順番入れ替え・ソートのロック)。 */
  const [listLocked, setListLocked] = useState(false);
  const [checklistSelection, setChecklistSelection] = useState<number[]>([]);
  const [memoTarget, setMemoTarget] = useState<number | null>(null);
  const [colorTarget, setColorTarget] = useState<number[] | null>(null);
  const [gotoPageOpen, setGotoPageOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKey>(null);
  const [message, setMessage] = useState('');
  const [startupStep, setStartupStep] = useState<StartupStep>(startup ? 'confirm' : 'done');
  const [progress, setProgress] = useState(0);

  // 印刷まわりの設定はダイアログが持つ型のままアプリ側で保持する
  const [printListSettings, setPrintListSettings] = useState<PrintListSettings>(DEFAULT_PRINT_LIST_SETTINGS);
  const [printCutSettings, setPrintCutSettings] = useState<PrintCutSettings>(DEFAULT_PRINT_CUT_SETTINGS);
  const [printMapSettings, setPrintMapSettings] = useState<PrintMapSettings>(DEFAULT_PRINT_MAP_SETTINGS);
  const [preview, setPreview] = useState({ title: 'プレビュー', pageCount: 1, pageNo: 1, zoom: 1 });
  const [imageOutput, setImageOutput] = useState({
    format: 'bmp' as ImageFormat,
    directory: 'C:\\dummy\\output',
    pageFrom: 1,
    pageTo: 1,
  });

  const catalog = state.catalog;
  const circles = useMemo(() => catalog?.circles ?? [], [catalog]);
  const genres = catalog?.genres ?? [];
  const maps = catalog?.maps ?? [];
  const layouts = catalog?.layouts ?? [];

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
  const selectedCircle: Circle | null =
    state.selectedId === null ? null : circlesById.get(state.selectedId) ?? null;

  // 詳細ウィンドウの情報欄の先頭行 (実物は太字の配置情報)。日程は catalog.dates の weekday から
  // ジャンプ コンボと同じ表記で作り、スペースは実物の表記「地区 + ブロック + 番号 + a|b」
  // (例 東G30b) にする。抽選漏れ (day 0) はスペースが無いので渡さない。
  const detailPosition = useMemo(() => {
    if (selectedCircle === null || selectedCircle.day === 0) return { dayLabel: '', areaLabel: '' };
    const date = (catalog?.dates ?? []).find((entry) => entry.id === selectedCircle.day);
    const block = (catalog?.blocks ?? []).find((entry) => entry.id === selectedCircle.blockId);
    const area = block
      ? (catalog?.areas ?? []).find((entry) => entry.id === block.areaId)
      : undefined;
    return {
      dayLabel: date ? WEEKDAY_NAMES[date.weekday] ?? '' : '',
      areaLabel: `${area?.name ?? ''}${block?.name ?? ''}${selectedCircle.spaceNo}${
        selectedCircle.spaceNoSub === 1 ? 'b' : 'a'
      }`,
    };
  }, [catalog, selectedCircle]);

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

  // 起動直後は先頭のサークルを選択する。元実装はカットビューに常にカーソルが 1 つあり、
  // サークル詳細ウィンドウにその中身が出ている (未選択状態は存在しない)。
  useEffect(() => {
    if (state.selectedId !== null || circles.length === 0) return;
    focusCircle(circles[0].id);
  }, [circles, state.selectedId, focusCircle]);

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
      indexes: [...KANA_ROWS.map((row) => row.label), OTHER_KANA_ROW].map((label, index) => ({
        label,
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

  /** インデックスジャンプ: 現在の日付で、指定のかな行の先頭へ。 */
  const jumpToIndex = useCallback(
    (index: number, day: number) => {
      const label = [...KANA_ROWS.map((row) => row.label), OTHER_KANA_ROW][index];
      if (!label) return;
      jumpToCircle(circles.find((circle) => circle.day === day && kanaRowOf(circle.circleKana) === label));
    },
    [circles, jumpToCircle],
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
    setZoom((value) => {
      const index = ZOOM_STEPS.findIndex((step) => step >= value - 1e-6);
      const next = ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, index + delta))];
      return next ?? value;
    });
  }, []);

  const handleToggleCheck = useCallback(() => {
    if (state.selectedId === null) return;
    dispatch({ type: 'checklist/toggle', id: state.selectedId, color: 0 });
  }, [dispatch, state.selectedId]);

  const openPreview = useCallback((title: string, pageCount: number) => {
    setPreview({ title, pageCount, pageNo: 1, zoom: 1 });
    setDialog('printPreview');
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
      switch (command) {
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
        case MENU_COMMANDS.actualSize:
          setZoom(1);
          break;
        case MENU_COMMANDS.googleSearch: {
          if (selectedCircle === null) {
            setMessage('サークルを選択してください');
            break;
          }
          const query = [selectedCircle.circleName, selectedCircle.penName].filter(Boolean).join(' ');
          window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank', 'noreferrer');
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
          setDialog('printMenu');
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
          setMessage('データの更新はこの足場では未実装です（ダミーデータを使用）');
          break;
        case MENU_COMMANDS.openChecklist:
          setDialog('memoMerge');
          break;
        case MENU_COMMANDS.appendChecklist:
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
          setColorTarget([...checklistSelection]);
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
          setMessage('子ウィンドウを前面に表示は未実装です');
          break;
        case WINDOW_MENU_COMMANDS.resetPositions:
          setPageNo(null);
          setZoom(1);
          setMapZoom(0.5);
          setMessage('表示位置を初期状態に戻しました');
          break;
        default:
          setMessage(`コマンド ${command} はこの足場では未実装です`);
      }
    },
    [
      checklistSelection,
      currentPage,
      jumpToDay,
      jumpToHall,
      jumpToIndex,
      lastPage,
      pageCircles,
      selectedCircle,
      state.selectedId,
      zoomBy,
    ],
  );

  const handleOpenDetail = useCallback(
    (id: number) => {
      focusCircle(id);
      dispatch({ type: 'checklist/toggle', id, color: 0 });
    },
    [dispatch, focusCircle],
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

  const openPrintSettings = useCallback(
    (id: string) => {
      if (id === 'printList') setDialog('printList');
      else if (id === 'printCut') setDialog('printCut');
      else if (id === 'printMap') setDialog('printMap');
      else if (id === 'printBlankMap') {
        setPrintMapSettings((value) => ({ ...value, blank: true }));
        setDialog('printBlankMap');
      } else if (id === 'pageSetup') setDialog('pageSetup');
      else if (id === 'imageOutput') setDialog('imageOutput');
    },
    [],
  );

  const status = [
    state.status,
    `ページ ${currentPage}`,
    `ズーム ${Math.round(zoom * 100)}%`,
    `チェック ${checkedIds.size} 件`,
    message,
  ]
    .filter(Boolean)
    .join(' / ');

  // タイトルバーは元実装と同じ「アプリ名 - チェックリストのドキュメント名」。
  // 検索のヒット件数はサークル一覧ウィンドウのステータスバーに出す (実測 title: "コミックマーケット カタロム - 新規チェックリスト")。
  const windowTitle = 'コミックマーケット カタロム - 新規チェックリスト';

  return (
    <Win98Provider className="desktop">
      <MainWindow
        title={windowTitle}
        initialX={layout.main.x}
        initialY={layout.main.y}
        width={layout.main.width}
        height={layout.main.height}
        info={catalog?.info ?? null}
        circles={pageCircles}
        pageNo={currentPage}
        selectedId={state.selectedId}
        status={status}
        checkedIds={checkedIds}
        colorById={colorById}
        imageUrl={cutImageUrl}
        onCommand={handleCommand}
        onSelect={(id) => dispatch({ type: 'circle/select', id })}
        onOpenDetail={handleOpenDetail}
        onPageChange={setPageNo}
        lastPage={lastPage}
        jumpOptions={jumpOptions}
        zoom={Math.round(zoom * 100)}
        onZoomChange={(percent) => setZoom(percent / 100)}
        onClose={() => setMessage('メインウィンドウは閉じられません')}
      />

      {detailOpen && (
        <DetailWindow
          initialX={layout.detail.x}
          initialY={layout.detail.y}
          width={layout.detail.width}
          height={layout.detail.height}
          circle={selectedCircle}
          genreName={selectedCircle ? genreNames[selectedCircle.genreId] ?? '' : ''}
          dayLabel={detailPosition.dayLabel}
          areaLabel={detailPosition.areaLabel}
          checked={state.selectedId !== null && checkedIds.has(state.selectedId)}
          checkColor={colorById.get(state.selectedId ?? -1) ?? 0}
          memo={state.selectedId === null ? '' : memoOf(state.selectedId)}
          onToggleCheck={handleToggleCheck}
          onSetColor={(color) =>
            state.selectedId !== null &&
            dispatch({ type: 'checklist/setColor', ids: [state.selectedId], color })
          }
          onMemoChange={(memo) =>
            state.selectedId !== null && dispatch({ type: 'memo/set', id: state.selectedId, memo })
          }
          onGoogleSearch={() => handleCommand(MENU_COMMANDS.googleSearch)}
          onClose={() => setDetailOpen(false)}
        />
      )}

      {checklistOpen && (
        <ChecklistWindow
          initialX={layout.checklist.x}
          initialY={layout.checklist.y}
          width={layout.checklist.width}
          height={layout.checklist.height}
          rows={checklistRows}
          days={CHECKLIST_DAYS}
          activeDay={activeDay}
          counts={checklistCounts}
          colorNames={COLOR_NAMES}
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
        />
      )}

      {mapOpen && (
        <MapWindow
          initialX={layout.map.x}
          initialY={layout.map.y}
          width={layout.map.width}
          height={layout.map.height}
          info={catalog?.info ?? null}
          maps={maps}
          activeMapId={activeMap?.id ?? 1}
          onActiveMapChange={setActiveMapId}
          entries={mapEntries}
          imageUrl={mapImageUrl(activeMap)}
          zoom={mapZoom}
          onZoomChange={(value) => setMapZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)))}
          selectedId={state.selectedId}
          onSelect={(id) => dispatch({ type: 'circle/select', id })}
          onOpenDetail={focusCircle}
          onClose={() => setMapOpen(false)}
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
          selectedId={state.selectedId}
          status={state.status}
          onSelect={(id) => dispatch({ type: 'circle/select', id })}
          onOpenDetail={focusCircle}
          onSearch={runQuickSearch}
          onOpenSearch={() => setSearchOpen(true)}
          locked={listLocked}
          onToggleLock={() => setListLocked((value) => !value)}
          colorNames={COLOR_NAMES}
          onSetColor={(ids, color) => dispatch({ type: 'checklist/setColor', ids, color })}
          onRemove={(ids) => dispatch({ type: 'checklist/remove', ids })}
          onClose={() => setListOpen(false)}
        />
      )}

      {searchOpen && (
        <SearchWindow
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

      {colorTarget !== null && (
        <CheckColorDialog
          colorNames={COLOR_NAMES}
          current={colorById.get(colorTarget[0] ?? -1) ?? 0}
          onSelect={(color: CheckColor) => {
            dispatch({ type: 'checklist/setColor', ids: colorTarget, color });
            setColorTarget(null);
          }}
          onClose={() => setColorTarget(null)}
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

      {dialog === 'preferences' && (
        <PreferencesDialog
          settings={state.settings}
          onChange={(patch) => dispatch({ type: 'settings/set', patch })}
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
          onChange={(patch) => dispatch({ type: 'pageSetup/set', patch })}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'printMenu' && (
        <ListDialog
          title="印刷詳細設定"
          items={PRINT_MENU_ITEMS}
          onSelect={openPrintSettings}
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

      {dialog === 'printList' && (
        <PrintListDialog
          settings={printListSettings}
          onChange={(patch) => setPrintListSettings((value) => ({ ...value, ...patch }))}
          onPreview={() => openPreview('プレビュー - サークルリスト', Math.max(1, lastPage - firstPage + 1))}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'printCut' && (
        <PrintCutDialog
          settings={printCutSettings}
          onChange={(patch) => setPrintCutSettings((value) => ({ ...value, ...patch }))}
          onPreview={() => openPreview('プレビュー - サークルカット', Math.max(1, lastPage - firstPage + 1))}
          onClose={() => setDialog(null)}
        />
      )}

      {(dialog === 'printMap' || dialog === 'printBlankMap') && (
        <PrintMapDialog
          settings={{ ...printMapSettings, blank: dialog === 'printBlankMap' }}
          onChange={(patch) => setPrintMapSettings((value) => ({ ...value, ...patch }))}
          onPreview={() => openPreview('プレビュー - 会場マップ', maps.length)}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'printDialog' && (
        <PrintDialog
          documentName={windowTitle}
          onPrint={(printer) => {
            setMessage(`${printer} へ印刷します`);
            setDialog('printList');
          }}
          onClose={() => setDialog(null)}
        />
      )}

      {dialog === 'printPreview' && (
        <PrintPreviewWindow
          title={preview.title}
          pageCount={preview.pageCount}
          pageNo={preview.pageNo}
          imageUrl={mapImageUrl(activeMap)}
          zoom={preview.zoom}
          onZoomChange={(value) => setPreview((current) => ({ ...current, zoom: value }))}
          onPageChange={(page) =>
            setPreview((current) => ({
              ...current,
              pageNo: Math.min(current.pageCount, Math.max(1, page)),
            }))
          }
          onPrint={() => setDialog('printProgress')}
          onClose={() => setDialog(null)}
        />
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
        <ImageFileOutputDialog
          format={imageOutput.format}
          directory={imageOutput.directory}
          pageFrom={imageOutput.pageFrom}
          pageTo={imageOutput.pageTo}
          maxPage={lastPage}
          onChange={(patch) => setImageOutput((value) => ({ ...value, ...patch }))}
          onOutput={() => {
            setDialog(null);
            setMessage(`${imageOutput.directory} へ画像を出力しました（ダミー）`);
          }}
          onClose={() => setDialog(null)}
        />
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
            setMessage('チェックリストを読み込みました（ダミー）');
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
    </Win98Provider>
  );
}
