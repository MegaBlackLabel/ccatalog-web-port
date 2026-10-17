/**
 * アプリ側の設定値。元実装では INI に保存されているもの
 * (動作オプション = RT_DIALOG 150、Google 検索設定 = 212、用紙サイズ・余白 = 203)。
 * 初期値は元実装の既定値ではなく「Web 版の素直な初期状態」を置いている。
 */

export type ScrollMode = 'adobe' | 'ie' | 'drag';

/** 動作オプション (ダイアログ 150)。プロパティ名の後ろは元のコントロール ID。 */
export type AppSettings = {
  /** 画面の掴みスクロールの方式 (1023 Adobe / 1025 IE / 1027 ドラッグのみ)。 */
  scrollMode: ScrollMode;
  /** リターンキーでチェック時に次のサークルへ移動 (1021)。 */
  enterMovesCursor: boolean;
  /** テンキーでチェック時に次のサークルへ移動 (1029)。 */
  tenkeyMovesCursor: boolean;
  /** ブロックが変わったらサークル一覧も追従 (1022)。 */
  listFollowsBlock: boolean;
  /** 選択カーソルをマウスカーソルに追従 (1024)。 */
  cursorFollowsMouse: boolean;
  /** ページ変更時に左上のカットへカーソルを合わせる (1710)。 */
  cursorToTopLeftOnPageChange: boolean;
  /** シングルクリックでチェック (1026)。 */
  singleClickChecks: boolean;
  /** チェックリスト読み込み時にサークル名を厳密に照合 (1028)。 */
  strictCircleNameCheck: boolean;
  /** 起動時に前回のチェックリストを読み込む (1664)。 */
  loadLastChecklistOnStart: boolean;
  /** 起動時に表紙画像を表示 (1711)。 */
  showCoverOnStart: boolean;
  /** 読み込み時にサークルメモを上書き (1712)。 */
  overwriteMemoOnLoad: boolean;
  /** 読み込み時にチェック色情報を上書き (1713)。 */
  overwriteColorOnLoad: boolean;
  /** 個別窓のアイコン化を連動 (1714)。 */
  linkWindowIconify: boolean;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  scrollMode: 'adobe',
  enterMovesCursor: true,
  tenkeyMovesCursor: false,
  listFollowsBlock: false,
  cursorFollowsMouse: false,
  cursorToTopLeftOnPageChange: false,
  singleClickChecks: false,
  strictCircleNameCheck: false,
  loadLastChecklistOnStart: false,
  showCoverOnStart: false,
  overwriteMemoOnLoad: false,
  overwriteColorOnLoad: false,
  linkWindowIconify: false,
};

/** Google 検索の対象項目 (ダイアログ 212 のコンボ 1693 / 1694)。 */
export type GoogleSearchField = 'circleName' | 'circleKana' | 'penName' | 'bookName';

/** Google 検索の条件設定 (ダイアログ 212)。 */
export type GoogleSearchSettings = {
  /** both = 両方を含む / either = いずれかを含む / custom = カスタム設定。 */
  mode: 'both' | 'either' | 'custom';
  /** custom の項目 1 (1693)。 */
  field1: GoogleSearchField;
  /** custom の項目 2 (1694)。 */
  field2: GoogleSearchField;
  /** custom の条件 (1695)。true = 両方を含む (AND)。 */
  andMode: boolean;
};

export const DEFAULT_GOOGLE_SEARCH_SETTINGS: GoogleSearchSettings = {
  mode: 'both',
  field1: 'circleName',
  field2: 'penName',
  andMode: true,
};

/** 用紙サイズ・余白の設定 (ダイアログ 203 / cpr.ini の [DOCUMENT])。 */
export type PageSetup = {
  /** 用紙 (コンボ 1643)。'A4' や 'はがき' など (元: プリンタ ドライバの紙名)。 */
  paper: string;
  /** 幅 (1638) mm。 */
  paperWidth: number;
  /** 高さ (1644) mm。 */
  paperHeight: number;
  /** 左の余白 (1653) mm。 */
  marginLeft: number;
  /** 右の余白 (1654) mm。 */
  marginRight: number;
  /** 上の余白 (1651) mm。 */
  marginTop: number;
  /** 下の余白 (1652) mm。 */
  marginBottom: number;
  /** 縦横比を保つ (1650)。入れると幅 / 高さの変更にもう一方が追随する。 */
  keepAspect: boolean;
};

export const DEFAULT_PAGE_SETUP: PageSetup = {
  paper: 'A4',
  paperWidth: 210,
  paperHeight: 297,
  // 実測 (ユーザー提供の実機キャプチャ) の値を既定にする。
  marginLeft: 20,
  marginRight: 20,
  marginTop: 28.3,
  marginBottom: 28.3,
  keepAspect: true,
};

/**
 * ブックマーク (しおり)。元実装はページ番号と名前を保存し、
 * 整理ダイアログでグループ分け・名前変更・削除ができる。
 */
export type Bookmark = {
  id: number;
  name: string;
  pageNo: number;
  /** 空文字は未分類。 */
  group: string;
};

/**
 * 画像データパス (動作設定の「画像データパス」ページ。元ダイアログ 191 パス設定)。
 * 元実装は画像データのフォルダを指定するが、Web 版は画像の取得元 URL の前置きにする。
 */
export type ImagePathSettings = {
  /** 自動検索する (1612) / 指定場所から読み込む (1613)。 */
  autoSearch: boolean;
  /** 画像データのベースパス (1614)。「PDATA / MDATA があるフォルダ」相当。 */
  basePath: string;
  /** 標準のブラウザを使う (1730) / ブラウザを指定 (1731)。 */
  useDefaultBrowser: boolean;
  /** ブラウザの実行ファイル (1733)。 */
  browserPath: string;
};

export const DEFAULT_IMAGE_PATH_SETTINGS: ImagePathSettings = {
  autoSearch: true,
  basePath: '',
  useDefaultBrowser: true,
  browserPath: '',
};

/** リストに出す列 (動作設定の「リスト表示」ページ。元ダイアログ 210)。 */
export type ListColumnKey =
  | 'color'
  | 'day'
  | 'space'
  | 'genre'
  | 'cut'
  | 'name'
  | 'kana'
  | 'pen'
  | 'book'
  | 'url'
  | 'mail'
  | 'twitter'
  | 'pixiv'
  | 'description'
  | 'memo'
  | 'updateInfo'
  | 'webCatalog'
  | 'updateStatus'
  | 'circleMs';

/**
 * 列の表示名 (ダイアログ 210 のリスト項目)。実物の項目名に合わせる
 * (実物のリストは 参加日 / スペース / ジャンル / サークルカット / サークル名 / 読みがな /
 *  執筆者 / 発行誌 / URL / Mail / Twitter / Pixiv / 補足 / メモ / 更新情報 /
 *  WebCatalog / 更新状態 / Circle.ms の 18 項目)。
 */
export const LIST_COLUMN_LABELS: Record<ListColumnKey, string> = {
  color: 'チェック色',
  day: '参加日',
  space: 'スペース',
  genre: 'ジャンル',
  cut: 'サークルカット',
  name: 'サークル名',
  kana: '読みがな',
  pen: '執筆者',
  book: '発行誌',
  url: 'URL',
  mail: 'Mail',
  twitter: 'Twitter',
  pixiv: 'Pixiv',
  description: '補足',
  memo: 'メモ',
  updateInfo: '更新情報',
  webCatalog: 'WebCatalog',
  updateStatus: '更新状態',
  circleMs: 'Circle.ms',
};

/**
 * ダイアログ 210 のリストに並べる項目の順 (実物の 18 項目 = サークル一覧の列と同じ順)。
 * 表示 / 非表示と並びはこの順を基準にする。
 */
export const LIST_COLUMN_ORDER: readonly ListColumnKey[] = [
  'day',
  'space',
  'genre',
  'cut',
  'name',
  'kana',
  'pen',
  'book',
  'url',
  'mail',
  'twitter',
  'pixiv',
  'description',
  'memo',
  'updateInfo',
  'webCatalog',
  'updateStatus',
  'circleMs',
];

/**
 * リスト表示の設定。項目の並びが表示順 (先頭が左端)。
 * 5LIST.HTM: 「サークル名」は非表示にできず、表示順に関係なく一番左は「チェック色」。
 */
export type ListDisplaySettings = {
  /** チェックリストウィンドウの表示項目。 */
  checklist: ListColumnKey[];
  /** サークル一覧ウィンドウの表示項目。 */
  list: ListColumnKey[];
};

export const DEFAULT_LIST_DISPLAY_SETTINGS: ListDisplaySettings = {
  // チェックリストの既定は実物のウィンドウ (1WINDOW/3CHECK.HTM) の見出しと同じ並び:
  // スペース / サークルカット / サークル名 / 発行誌 / 補足 / メモ / 更新情報 / 更新状態。
  // 先頭の「印刷順」(色 + 連番) は固定列なので、ここには含めない。
  checklist: [
    'space',
    'cut',
    'name',
    'book',
    'description',
    'memo',
    'updateInfo',
    'updateStatus',
  ],
  // サークル一覧は実物のウィンドウ (1WINDOW/6LIST.HTM) の列と同じ 18 列
  // (実物のスクリーンショットから 1 列ずつ読み取った並び)。
  list: [
    'day',
    'space',
    'genre',
    'cut',
    'name',
    'kana',
    'pen',
    'book',
    'url',
    'mail',
    'twitter',
    'pixiv',
    'description',
    'memo',
    'updateInfo',
    'webCatalog',
    'updateStatus',
    'circleMs',
  ],
};

/**
 * 色の設定 (動作設定の「色の設定」ページ。元ダイアログ 149 チェック色)。
 * 空配列は「実物から実測した既定色を使う」(ui/check-colors.ts)。
 */
export type CheckColorSettings = {
  /** 画面上のチェック色 (表示色 1020〜1028)。 */
  display: string[];
  /** 印刷時のチェック色 (印刷色 1029〜1037)。 */
  print: string[];
  /** 色1〜9 の名称 (1636)。空文字は「色N」。 */
  names: string[];
  /** 編集するチェック色 (1702): 標準の設定値 / 現在のチェックリスト。 */
  editTarget: 'standard' | 'current';
};

export const DEFAULT_CHECK_COLOR_SETTINGS: CheckColorSettings = {
  display: [],
  print: [],
  names: [],
  editTarget: 'standard',
};
