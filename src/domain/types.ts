/**
 * ccatalog.exe のデータモデル（復号した SQLite2 データベースのスキーマに対応）。
 * 列名・並び順は復号 DB の sqlite_master と .exe 内の DDL リテラルに一致する。
 */

export type Circle = {
  id: number;
  comiketNo: number;
  /** ページ番号。抽選漏れは 0。 */
  pageNo: number;
  /** ページ内カット位置。抽選漏れは 0。 */
  cutIndex: number;
  /** 参加日。抽選漏れは 0。 */
  day: number;
  /** ブロック ID。抽選漏れは 0。 */
  blockId: number;
  /** スペース番号。抽選漏れは 0。 */
  spaceNo: number;
  /** スペース番号補助 (0: a, 1: b)。 */
  spaceNoSub: number;
  genreId: number;
  circleName: string;
  /** 読みがな。DB 上は「半角カナ」で格納されている。 */
  circleKana: string;
  penName: string;
  bookName: string;
  url: string;
  mailAddr: string;
  description: string;
  /** サークルメモ。DB ではなくアプリ側に保存される（元実装は getMemo() 経由）。 */
  memo: string;
  updateId: number;
  updateData: string;
  circlems: string;
  rss: string;
  updateFlag: number;
  twitter: string;
  pixiv: string;
};

export type Genre = {
  id: number;
  name: string;
  code: number;
};

/** 日程 (ComiketDate)。 */
export type DateInfo = {
  /** 日程 ID (初日が 1)。 */
  id: number;
  year: number;
  month: number;
  day: number;
  /** 曜日 (1: 日, 2: 月, … 7: 土)。 */
  weekday: number;
};

/** 地区 (ComiketArea)。1 つの地図の中の印刷範囲を持つ。 */
export type AreaInfo = {
  id: number;
  name: string;
  /** 地区名 (簡素版)。 */
  simpleName: string;
  /** 対応する地図 ID。 */
  mapId: number;
  /** 地図画像上の印刷範囲。壁の地区は 0x0。 */
  x: number;
  y: number;
  w: number;
  h: number;
  allFilename: string;
};

/** ブロック (ComiketBlock)。地区の中の島。 */
export type BlockInfo = {
  id: number;
  /** ブロック名 (「あ」「い」…の 1 文字)。 */
  name: string;
  areaId: number;
};

export type ComiketInfo = {
  comiketNo: number;
  comiketName: string;
  cutSizeW: number;
  cutSizeH: number;
  cutOriginX: number;
  cutOriginY: number;
  cutOffsetX: number;
  cutOffsetY: number;
  mapSizeW: number;
  mapSizeH: number;
  mapOriginX: number;
  mapOriginY: number;
};

/** 会場マップ上の机 1 つ分の配置情報。 */
export type LayoutInfo = {
  blockId: number;
  spaceNo: number;
  /** マップ画像上の座標。 */
  xpos: number;
  ypos: number;
  /** 机の向き (0: 正, 90: 逆)。 */
  layout: number;
  mapId: number;
};

/** 地図の種類 (ホール単位)。 */
export type MapInfo = {
  id: number;
  name: string;
  /** マップ画像のファイル名 (拡張子なし)。 */
  filename: string;
  /** マップ画像の原寸 (ComiketMap の印刷範囲の幅)。 */
  w: number;
  /** マップ画像の原寸 (ComiketMap の印刷範囲の高さ)。 */
  h: number;
  allFilename?: string;
};

/** 1 回分のコミケのデータ一式。 */
export type CatalogData = {
  info: ComiketInfo;
  /** 日程 (ComiketDate)。 */
  dates: DateInfo[];
  /** 地区 (ComiketArea)。 */
  areas: AreaInfo[];
  /** ブロック (ComiketBlock)。 */
  blocks: BlockInfo[];
  genres: Genre[];
  circles: Circle[];
  layouts: LayoutInfo[];
  maps: MapInfo[];
};
