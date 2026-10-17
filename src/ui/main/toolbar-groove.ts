import type { CSSProperties } from 'react';

/**
 * ツールバー 1 段の内容の高さ。実物のツールバー ボタン (16x15 のアイコン + 3px の余白)
 * と同じ 22x22 のボタンがそのまま入る高さで、5 ウィンドウ共通。
 * ライブラリの Toolbar を段に置くときは、既定の padding (1px 2px) が上下に 1px ずつ
 * 乗って 24px になるので、上下の余白だけ外してこの高さに詰める。
 */
export const TOOLBAR_CONTENT_HEIGHT = 22;

/** 段の中の左右の余白 (帯の端から最初の項目まで)。 */
export const TOOLBAR_PADDING_X = 2;

/** 段の中の項目 (アイコン ボタン・コンボ・エディット) の間隔。 */
export const TOOLBAR_ITEM_GAP = 4;

/** 実物のツールバー アイコン (RT_BITMAP 130) と同じ 16x15。アイコンの中央に置く。 */
export const TOOLBAR_ICON_STYLE: CSSProperties = { width: 16, height: 15, verticalAlign: 'middle' };

/**
 * 色 1〜9 の色矩形アイコンの大きさ。実物のツールバーの色ボタン (サークルカット /
 * チェックリスト / サークル一覧 / サークル詳細の 4 ウィンドウ) で同じ大きさにする。
 */
export const TOOLBAR_SWATCH_STYLE: CSSProperties = { width: 16, height: 16 };

/**
 * アイコンだけのボタン。実物のツールバー ボタン (16x15 のアイコン + 3px の余白 = 22x22)
 * に合わせる。98.css の button の min-width 75px / min-height 23px と浮き出しを打ち消し、
 * ライブラリの Toolbar のボタンと同じ平らな見た目にする。
 * 文字を持たないぶんの名前は、必ず aria-label と title で付ける。
 */
export const TOOLBAR_ICON_BUTTON_STYLE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
  width: TOOLBAR_CONTENT_HEIGHT,
  height: TOOLBAR_CONTENT_HEIGHT,
  minWidth: 0,
  minHeight: 0,
  padding: 0,
  boxSizing: 'border-box',
  border: '1px solid transparent',
  boxShadow: 'none',
};

/** 押下状態のアイコン ボタン (チェックリストの順番のロック・一覧のソートのロック)。 */
export const TOOLBAR_PRESSED_STYLE: CSSProperties = {
  borderColor: '#808080 #ffffff #ffffff #808080',
};

/**
 * アイコン ボタンの間の区切り線。線そのもの (幅 0 の 1px 暗 + 1px 白) と高さの既定は
 * ライブラリの `Groove` (`orientation="vertical"`) が持つので、ここはその周りだけを
 * 決める: 縮まないこと、高さの基準はライブラリの CSS 変数
 * (`--win98-toolbar-separator-height`、既定 18px)、左右の余白 3px。
 * 実測 (サークル詳細ウィンドウのツールバー x 127..128, y 35..52) の 18px を
 * 5 ウィンドウ共通で使う。
 * `Groove` の CSS は `align-self: stretch` なので、高さを 18px に固定したままだと
 * 段 (22px) の上端に寄る。実測と同じく縦の中央に置くため `alignSelf: 'center'` を
 * 明示する (ライブラリの Toolbar の `.separator` も段の中央に来る)。
 */
export const TOOLBAR_SEPARATOR_STYLE: CSSProperties = {
  flex: '0 0 auto',
  alignSelf: 'center',
  height: 'var(--win98-toolbar-separator-height, 18px)',
  margin: '0 3px',
};

/** 区切り線 1 本の幅 (線 1px + 1px + 左右の余白 3px×2)。段詰めの計測に足す。 */
export const TOOLBAR_SEPARATOR_WIDTH = 8;

/** 色 1〜9 のパレット。実測 (サークル詳細のツールバー x 136..333) の 23px ピッチ = 1px 間隔。 */
export const TOOLBAR_PALETTE_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

/** 文字を持つツールバー ボタンの左右の余白 (実物は 0 だが、押しやすいように広げる)。 */
export const TOOLBAR_TEXT_BUTTON_PADDING_X = 9;

/**
 * 文字を持つツールバー ボタン (「Googleで検索」「設定」「ジャンル表示」)。
 * 実物は 86x20 / 30x20 / 76x18 と小さいが、帯の content (22px) に合わせ、左右 9px の余白を
 * 持つボタンにする。**境界線と浮き出しは 98.css の既定をそのまま使う** (平らにする上書きは
 * しない。実物のこれらのボタンは押しボタンの形をしている)。
 */
export const TOOLBAR_TEXT_BUTTON_STYLE: CSSProperties = {
  flex: '0 0 auto',
  height: TOOLBAR_CONTENT_HEIGHT,
  minHeight: TOOLBAR_CONTENT_HEIGHT,
  minWidth: 0,
  padding: `0 ${TOOLBAR_TEXT_BUTTON_PADDING_X}px`,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
};
