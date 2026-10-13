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

/** Google 検索の条件設定 (ダイアログ 212)。 */
export type GoogleSearchSettings = {
  /** both = 両方を含む / either = いずれかを含む / custom = カスタム設定。 */
  mode: 'both' | 'either' | 'custom';
  /** custom のときの検索対象項目。 */
  fields: {
    circleName: boolean;
    penName: boolean;
    bookName: boolean;
    circleKana: boolean;
  };
  /** custom のときの条件 (true = AND)。 */
  andMode: boolean;
};

export const DEFAULT_GOOGLE_SEARCH_SETTINGS: GoogleSearchSettings = {
  mode: 'both',
  fields: { circleName: true, penName: true, bookName: false, circleKana: false },
  andMode: true,
};

/** 用紙サイズ・余白の設定 (ダイアログ 203 / cpr.ini の [DOCUMENT])。 */
export type PageSetup = {
  dpi: number;
  /** mm */
  paperWidth: number;
  /** mm */
  paperHeight: number;
  marginX: number;
  marginY: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_PAGE_SETUP: PageSetup = {
  dpi: 300,
  paperWidth: 210,
  paperHeight: 297,
  marginX: 0,
  marginY: 0,
  offsetX: 0,
  offsetY: 0,
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
