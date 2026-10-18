import type { CSSProperties } from 'react';
import { Button, Groove, ToolbarBand, ToolbarRow, Window } from '@megablacklabel/react98retro';
import type { CheckColor } from '../../app/catalog-state';
import { CutSpaceBox, cutSpaceLabel } from '../main/cut-space';
import { assetUrl } from '../asset-url';
import type { Circle } from '../../domain/types';
import { CHECK_COLOR_IDS, checkColorPalette, checkSwatchIcon } from '../check-colors';
// 実物のツールバー アイコン (PE の RT_BITMAP を SVG 化したもの) をそのまま使う。
import { TOOLBAR_ICONS } from '../main/toolbar-icons';
import {
  TOOLBAR_ICON_BUTTON_CLASS,
  TOOLBAR_ICON_BUTTON_STYLE,
  TOOLBAR_ICON_STYLE,
  TOOLBAR_ITEM_GAP,
  TOOLBAR_PADDING_X,
  TOOLBAR_PALETTE_STYLE,
  TOOLBAR_SEPARATOR_STYLE,
  TOOLBAR_TEXT_BUTTON_STYLE,
  TOOLBAR_SWATCH_STYLE,
} from '../main/toolbar-groove';

export type DetailWindowProps = {
  /** 現在選択中のサークル。null は未選択。 */
  circle: Circle | null;
  /** circle.genreId のジャンル名 (未知なら '')。 */
  genreName: string;
  /**
   * 情報欄の先頭行 (実物は太字の配置情報) に出す開催日。App が `catalog.dates` の
   * `weekday` (1=日 … 7=土) から作る (例「土曜日」)。省略時は「n日目」に落とす。
   */
  dayLabel?: string;
  /**
   * 同じ行に出す地区・ブロックとスペース (例「東G30b」)。App が `catalog.areas` /
   * `catalog.blocks` から作る。省略時は「1日目 B 12a」の形に落とす。
   */
  areaLabel?: string;
  /** チェックリストに登録済みか (ツールバー右端の「チェック解除」ボタンの有効/無効)。 */
  checked: boolean;
  /** 現在のメモ (アプリ側ストア)。 */
  memo: string;
  /**
   * チェックリストへの登録 / 解除。ツールバー右端の「チェック解除」(× 印の実測アイコン) が呼ぶ。
   * 登録は色 1〜9 のボタン (onSetColor) で行うので、このボタンは登録済みのときだけ有効。
   */
  /** チェック済みのときのチェック色 (0 = 標準色)。カットの左上のボックスをこの色で塗る。 */
  checkColor: CheckColor;
  onToggleCheck: () => void;
  /** メモを書き換えた (メモ欄は常に編集できる。実物は編集用のダイアログだが、
   *  Web 版はその場で書き換えられるようにしている)。 */
  onMemoChange: (memo: string) => void;
  /** 色 1〜9 のボタン。押した色でチェックリストに登録する。 */
  onSetColor?: (color: CheckColor) => void;
  onGoogleSearch: () => void;
  /** ツールバーの「設定」(元実装の Button 32836)。Google 検索条件の設定 (ダイアログ 212)。 */
  onGoogleSearchSettings: () => void;
  onClose: () => void;
  /** タイトルバーの最小化 (アイコン化)。動作設定 1714「個別窓のアイコン化を連動する」。 */
  onMinimize?: () => void;
  /** 「色の設定」の表示色 (動作設定)。未指定なら実物から実測した色。 */
  checkColors?: readonly string[];
  /** チェック色の表示名 (元実装の「チェック色」欄。省略時は標準色)。 */
  checkColorLabel?: string;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  /** ウィンドウ幅の下限 / 上限。既定サイズでスクロールバーが出ないようにする。 */
  minWidth?: number;
  maxWidth?: number;
  zIndex?: number;
};

/*
 * ここから下の寸法はすべて実物の実測 (`解析/ui_capture/windows.tsv`) の比率。
 * 実物のサークル詳細ウィンドウは 1200x1056、クライアントは 1186x995:
 *   ツールバー (8,31) 1184x24 / カット域 x 7..221 の 214px, y 54..356 の 302px
 *   サークル詳細情報 Edit 33101 (221,57) 970x299 / リンク行 y 357..446 (6 行 x 14px, ピッチ 15px)
 *   サークルメモ Static y 447..461 + Edit 33102 (9,462) 1182x585
 * このアプリの既定サイズは 512x640 なので、帯の高さなどは絶対値ではなく比率で持つ
 * (カット欄だけは画像の実寸の固定値。下の注記を参照)。
 *
 * ツールバーの中身も実物 (`解析/ui_capture/4-サークル詳細.png` の y 31..55 を 1px 単位で
 * 読み取り) に合わせる。左から
 *   「Googleで検索」(x 8..93, 86x20) / 「設定」(x 94..123, 30x20) /
 *   区切り線 (x 127..128, y 35..52) / 色 1〜9 (x 136..333, ピッチ 23px) /
 *   区切り線 (x 342..343) / 「チェック解除」(x 351..366 の 16x15 アイコン)
 * だけが並び、色ボタンは 12x9 の色矩形を 1px の黒枠で囲んだ 14x11。
 * 最後のボタンのアイコンは同じ PNG から 44px すべてが一致した (RT_BITMAP 130 の
 * 「× 印」= `TOOLBAR_ICONS.checkRemove`)。文字ボタン 2 つは実物も文字のまま。
 * ただし文字ボタンは実測 (86x20 / 30x20) では小さすぎるので、帯の内側いっぱいの高さ 22px
 * (ライブラリのツールバー ボタンと同じ)・左右 9px の余白に
 * 広げて押しやすくしてある (幅は文字に合わせて伸ばす)。
 *
 * カット欄は実物と同じ 214px 固定にする。実物のカット域は x 7..221 の 214px
 * (`3-サークル詳細.png` / `analysis/img2-detail.txt` の実測で、アプリ版のカットは
 * この欄いっぱいまで拡大される)。置かれるカット画像の原寸は 178x253 (catalog の
 * cutSizeW/H) なので、欄の中で同じ縦横比のまま 214x304 に拡大する。
 */

/** カット欄の幅。実物のカット域 (x 7..221) と同じ 214px 固定。 */
const CUT_WIDTH = 214;
/** カット欄の高さ。原寸 178x253 を幅 214 に合わせて拡大した 304px (同じ縦横比)。 */
const CUT_HEIGHT = 304;

/** 上部の帯 (カット + サークル詳細情報) の高さ。実測 302/995 = 30%。 */
const MAIN_ROW_HEIGHT = '30%';

/** リンク行の高さと行間。実測 y 357..446 に 6 行 (1 行 14px / ピッチ 15px)。 */
const LINK_ROW_HEIGHT = 14;
const LINK_ROW_GAP = 1;

/** リンクのラベル欄の幅。実測の Static (x 2649..2709 = 60px)。 */
const LINK_LABEL_WIDTH = 60;

/** サークルメモのラベルの高さ。実測の Static「サークルメモ：」(y 447..461)。 */
const MEMO_LABEL_HEIGHT = 14;

/**
 * サークル詳細情報の 1 行の高さ。実物の Edit は 299px に 14 行 (1 行 ~21px) 入るが、
 * 512x640 では帯が 30% = 約 176px なので、14 行が切れずに収まる 12px に詰める。
 */
const INFO_ROW_HEIGHT = 12;

/** 詳細情報の枠と余白 (border 1px + padding 2px の上下)。 */
const INFO_BOX_INSET = 6;

/** 値が登録されていない項目の表示 (元実装の未登録欄と同じ全角ダッシュ)。 */
const NO_VALUE = '—';

/** 実測のリンク行 (Static × 12 = ラベル + 値の 6 組) と href の作り方。 */
type LinkField = {
  readonly key: 'url' | 'mail' | 'webCatalog' | 'twitter' | 'pixiv' | 'circlems';
  readonly label: string;
  readonly value: (circle: Circle) => string;
  /** href を省略した項目は値をそのまま href にする。 */
  readonly href?: (value: string) => string;
};

const LINK_FIELDS: readonly LinkField[] = [
  { key: 'url', label: 'URL', value: (circle) => circle.url },
  { key: 'mail', label: 'Mail', value: (circle) => circle.mailAddr, href: (v) => `mailto:${v}` },
  // 実物は WebCatalog と Circle.ms の 2 行があり、どちらも circlems を使う。
  { key: 'webCatalog', label: 'WebCatalog', value: (circle) => circle.circlems },
  {
    key: 'twitter',
    label: 'Twitter',
    value: (circle) => circle.twitter,
    href: (v) => `https://twitter.com/${v}`,
  },
  {
    key: 'pixiv',
    label: 'Pixiv',
    value: (circle) => circle.pixiv,
    href: (v) => `https://www.pixiv.net/users/${v}`,
  },
  { key: 'circlems', label: 'Circle.ms', value: (circle) => circle.circlems },
];

type InfoRowData = { label: string; value: string };
type LinkRowData = { key: LinkField['key']; label: string; value: string; href: string };

/**
 * ウィンドウの本文 (カット / サークル詳細情報 / リンク / サークルメモ)。
 * ツールバーは本文の外 (`.window-body` の直下の第 1 子) に置くので、ここには入れない。
 * overflow を hidden にしておくことで、既定サイズでスクロールバーが出ない
 * (はみ出す分は切る)。
 * 左右の余白 2px は他のウィンドウの本文と同じ値 (`.window-body` の padding 2px の内側に
 * さらに 2px。チェックリスト / 一覧の表が沈んだ枠のぶんだけ内側に入るのと同じ)。
 */
const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  padding: '4px 2px',
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'hidden',
};

/**
 * ツールバーの文字ボタン (「Googleで検索」「設定」)。実測は 86x20 / 30x20 と小さいが、
 * 帯の内容 (22px) に合わせた平らな文字ボタンにする。定義は 5 ウィンドウ共通
 * (`ui/main/toolbar-groove.ts` の TOOLBAR_TEXT_BUTTON_STYLE) で、ホバー (浮き出し) は
 * app.css が付ける。
 */

/**
 * ツールバー 1 段分の、このウィンドウ固有の見た目。帯 (外周の溝 = 実測 1184x24) と
 * 段の並びはライブラリの `ToolbarBand` / `ToolbarRow` が持つので、ここは段の左右の余白と
 * 項目の間隔だけを決める。他の 4 ウィンドウ (サークルカット / チェックリスト /
 * サークル一覧 / 会場マップ) と同じ値を共通定義から取る。
 */
const TOOLBAR_ROW_LOCAL: CSSProperties = {
  padding: `0 ${TOOLBAR_PADDING_X}px`,
  gap: TOOLBAR_ITEM_GAP,
  whiteSpace: 'nowrap',
};

/** カットとサークル詳細情報の帯 (実測 302/995 = 30%)。 */
const MAIN_ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 2,
  flex: `0 0 ${MAIN_ROW_HEIGHT}`,
  minWidth: 0,
};

/** カット欄 (実物と同じ 214px 固定)。枠も同じ幅にして、画像の右に余白を出さない。 */
const CUT_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: `0 0 ${CUT_WIDTH}px`,
  minWidth: 0,
  overflow: 'hidden',
};

/** カットの枠。実物のカット域 (214x304) そのものにして、上下左右に余白を出さない。 */
const CUT_FRAME_STYLE: CSSProperties = {
  flex: '0 0 auto',
  width: CUT_WIDTH,
  height: CUT_HEIGHT,
  background: '#ffffff',
  // 左上のスペース番号ボックス (チェック色) を重ねる基準。
  position: 'relative',
};

const CUT_IMAGE_STYLE: CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const CUT_BOX_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  background: '#c0c0c0',
  border: '1px solid #808080',
  boxShadow: 'inset 1px 1px 0 #ffffff, inset -1px -1px 0 #404040',
  color: '#404040',
  fontSize: 12,
};

/**
 * サークル詳細情報 (実測は読み取り専用の複数行 Edit 33101)。
 * 白地 + 沈んだ枠の読み取り専用テキストにして、1 行ずつ「ラベル：値」を並べる。
 * スクロールバーは出さないので、はみ出す行は切る (overflow: hidden)。
 */
const INFO_BOX_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minWidth: 0,
  minHeight: 0,
  padding: '2px 4px',
  background: '#ffffff',
  border: '1px solid #808080',
  boxShadow: 'inset 1px 1px 0 #404040',
  overflow: 'hidden',
  lineHeight: `${INFO_ROW_HEIGHT}px`,
};

/**
 * 情報欄の先頭行。実物は開催日とスペースの位置だけを太字で出す (例「土曜日 東G30b」)。
 * 既存の 14 項目はこの行の下に続く。
 */
const POSITION_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flex: '0 0 auto',
  height: INFO_ROW_HEIGHT,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

/** 1 行は折り返さず、長い値は省略記号で切る。 */
const INFO_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flex: '0 0 auto',
  height: INFO_ROW_HEIGHT,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

const INFO_LABEL_STYLE: CSSProperties = {
  flex: '0 0 auto',
};

const INFO_VALUE_STYLE: CSSProperties = {
  flex: '0 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

/** リンク行 (実測 y 357..446 の 6 行)。空の値も行だけは実物どおり出す。 */
const LINKS_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  rowGap: LINK_ROW_GAP,
  flex: '0 0 auto',
  overflow: 'hidden',
};

const LINK_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: LINK_ROW_HEIGHT,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
};

const LINK_LABEL_STYLE: CSSProperties = {
  flex: `0 0 ${LINK_LABEL_WIDTH}px`,
  textAlign: 'left',
};

const LINK_VALUE_STYLE: CSSProperties = {
  flex: '0 1 auto',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const LINK_STYLE: CSSProperties = { color: '#000080' };

const EMPTY_STYLE: CSSProperties = {
  margin: 0,
  color: '#404040',
  fontSize: 12,
  lineHeight: 'normal',
};

/** サークルメモのラベル行 (実測の Static「サークルメモ：」)。 */
const MEMO_LABEL_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 4,
  flex: '0 0 auto',
  minHeight: MEMO_LABEL_HEIGHT,
};

/**
 * サークルメモの入力欄 (実測 Edit 33102 は 1182x585 = クライアント高の 59%)。
 * 残りの高さ全部を使うテキスト領域で、実物の編集ウィンドウを開かずにその場で書き換えられる
 * (ユーザー指示)。見た目は実測どおりの凹んだ白い箱。
 */
const MEMO_INPUT_STYLE: CSSProperties = {
  flex: '1 1 auto',
  minHeight: 0,
  width: '100%',
  resize: 'none',
  padding: 4,
  // アプリ側の共通フォント (12px MS UI Gothic) を継承させる。
  fontFamily: 'inherit',
  fontSize: 12,
  lineHeight: '16px',
  color: '#000000',
  background: '#ffffff',
  border: '1px solid #808080',
  boxShadow: 'inset 1px 1px 0 #404040',
  overflow: 'auto',
};

/** 参加日の表示。抽選漏れは day 0。 */
function formatDay(day: number): string {
  return day === 0 ? '抽選漏れ' : `${day}日目`;
}

/** 配置の表示。元実装と同じ「1日目 B 12a」。blockId 1 は A、2 は B。 */
function formatSpace(circle: Circle): string {
  if (circle.day === 0) return '抽選漏れ';
  const parts = [`${circle.day}日目`];
  if (circle.blockId > 0) parts.push(String.fromCharCode(0x40 + circle.blockId));
  parts.push(`${circle.spaceNo}${circle.spaceNoSub === 1 ? 'b' : 'a'}`);
  return parts.join(' ');
}

/**
 * 情報欄の先頭行 (実物は太字の配置情報。例「土曜日 東G30b」)。
 * App が渡す `dayLabel` / `areaLabel` をそのまま並べ、渡されないときは元実装の表記に落とす。
 * 抽選漏れ (day 0) はスペースが無いので「抽選漏れ」だけにする。
 */
function formatPosition(circle: Circle, dayLabel?: string, areaLabel?: string): string {
  if (circle.day === 0) return '抽選漏れ';
  if (!dayLabel && !areaLabel) return formatSpace(circle);
  return [dayLabel, areaLabel].filter((part) => part !== undefined && part !== '').join(' ');
}

/** 0 は未登録 (抽選漏れ・未採番) なのでダッシュにする。 */
function formatIndex(value: number): string {
  return value === 0 ? NO_VALUE : String(value);
}

/** 空文字は未登録なのでダッシュにする。 */
function formatText(value: string): string {
  return value === '' ? NO_VALUE : value;
}

/** 更新の表示。更新フラグが立っていれば更新日、日付が無ければ「更新あり」。 */
function formatUpdate(circle: Circle): string {
  if (circle.updateFlag === 0) return NO_VALUE;
  return circle.updateData === '' ? '更新あり' : circle.updateData;
}

export function DetailWindow({
  circle,
  genreName,
  dayLabel,
  areaLabel,
  memo,
  checked,
  checkColor,
  onToggleCheck,
  checkColorLabel = '標準色',
  onSetColor,
  onMemoChange,
  onGoogleSearch,
  onGoogleSearchSettings,
  onClose,
  onMinimize,
  checkColors,
  initialX = 560,
  initialY = 60,
  width = 512,
  height = 640,
  minWidth = 500,
  maxWidth = 560,
  zIndex,
}: DetailWindowProps) {
  // 色ボタン (色1〜9) の色。「色の設定」(動作設定) を反映する。
  const palette = checkColorPalette(checkColors);
  // 元実装のサークル詳細情報の並び (DB の列と印刷の区切り名に合わせてある)。
  const infoRows: readonly InfoRowData[] = circle
    ? [
        { label: 'No.', value: String(circle.id) },
        { label: 'サークル名', value: formatText(circle.circleName) },
        { label: '読み', value: formatText(circle.circleKana) },
        { label: '執筆者', value: formatText(circle.penName) },
        { label: '発行誌', value: formatText(circle.bookName) },
        { label: 'ジャンル', value: genreName || String(circle.genreId) },
        { label: '参加日', value: formatDay(circle.day) },
        { label: '位置', value: formatSpace(circle) },
        { label: 'ページ番号', value: formatIndex(circle.pageNo) },
        { label: 'カット番号', value: formatIndex(circle.cutIndex) },
        { label: 'チェック色', value: checkColorLabel },
        { label: '補足', value: formatText(circle.description) },
        { label: '更新', value: formatUpdate(circle) },
        { label: '更新ID', value: formatIndex(circle.updateId) },
      ]
    : [];

  // 実物どおり 6 行を常に出し、値が入っている行だけリンクにする。
  const linkRows: readonly LinkRowData[] = LINK_FIELDS.map((field) => {
    const value = circle ? field.value(circle) : '';
    const href = value === '' ? '' : field.href ? field.href(value) : value;
    return { key: field.key, label: field.label, value, href };
  });

  // 情報欄の先頭行 (実物の太字の配置情報)。抽選漏れは「抽選漏れ」だけ。
  const positionLabel = circle ? formatPosition(circle, dayLabel, areaLabel) : '';

  // 帯の 30% が縮んでも切れないようにする。詳細情報の行 (先頭の配置情報 + 14 項目 x 1 行
  // + 枠と余白) と、カットの実寸 (178x253) の大きい方を下限にする
  // (カットを 30% に押し込むと画像の上下が切れてしまう)。
  const infoLineCount = circle ? infoRows.length + 1 : 0;
  const mainRowStyle: CSSProperties = {
    ...MAIN_ROW_STYLE,
    minHeight: Math.max(infoLineCount * INFO_ROW_HEIGHT + INFO_BOX_INSET, CUT_HEIGHT),
  };

  return (
    <Window
      data-testid="detail-window"
      title={`サークル詳細${circle ? ' - ' + circle.circleName : ''}`}
      onClose={onClose}
      onMinimize={onMinimize}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
      style={{ minWidth, maxWidth }}
    >
      <ToolbarBand
        data-testid="detail-toolbar"
        rows={[
          <ToolbarRow key="row" style={TOOLBAR_ROW_LOCAL}>
            <Button
              type="button"
              data-testid="detail-google-search"
              disabled={!circle}
              style={TOOLBAR_TEXT_BUTTON_STYLE}
              onClick={onGoogleSearch}
              title="Googleで検索"
            >
              Googleで検索
            </Button>
            {/* 実測の Button 32836。Google 検索の条件設定 (ダイアログ 212) を開く。 */}
            <Button
              type="button"
              data-testid="detail-settings"
              data-ctrl-id={32836}
              style={TOOLBAR_TEXT_BUTTON_STYLE}
              onClick={onGoogleSearchSettings}
              title="設定"
            >
              設定
            </Button>
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            {/*
              色 1〜9。押した色でチェックリストに登録する (実物のツールバーの色ボタン)。
              実測は 14x11 (12x9 の色矩形 + 1px の黒枠) だったが、ユーザー指示で
              サークルカット ウィンドウの色ボタンに合わせて 22x22 のアイコン ボタンに統一した。
            */}
            <div data-testid="detail-color-palette" style={TOOLBAR_PALETTE_STYLE}>
              {CHECK_COLOR_IDS.map((color) => (
                <Button
                  key={color}
                  type="button"
                  data-testid={`detail-color-${color}`}
                  data-color={color}
                  aria-label={`色${color}`}
                  title={`色${color}`}
                  disabled={!circle}
                  className={TOOLBAR_ICON_BUTTON_CLASS}
                  style={TOOLBAR_ICON_BUTTON_STYLE}
                  onClick={() => onSetColor?.(color)}
                >
                  {/* サークルカット ウィンドウの色ボタンと同じアイコン (ui/check-colors.ts)。 */}
                  <img
                    src={checkSwatchIcon(palette[color - 1])}
                    alt=""
                    aria-hidden="true"
                    style={TOOLBAR_SWATCH_STYLE}
                  />
                </Button>
              ))}
            </div>
            {/* 実測 x 342..343 の区切り線。色ボタンとアイコン ボタンの間。 */}
            <Groove orientation="vertical" style={TOOLBAR_SEPARATOR_STYLE} />
            {/* 実測 x 351..366 のアイコンだけのボタン (RT_BITMAP 130 の × 印 = チェック解除)。 */}
            <Button
              type="button"
              data-testid="detail-check-remove"
              disabled={!circle || !checked}
              className={TOOLBAR_ICON_BUTTON_CLASS}
              style={TOOLBAR_ICON_BUTTON_STYLE}
              onClick={onToggleCheck}
              title="チェックリストから外す"
              aria-label="チェックリストから外す"
            >
              <img
                src={TOOLBAR_ICONS.checkRemove}
                alt=""
                aria-hidden="true"
                style={TOOLBAR_ICON_STYLE}
              />
            </Button>
          </ToolbarRow>,
        ]}
      />
      {/* 本文 (カット / サークル詳細情報 / リンク / サークルメモ)。ツールバーの下に続ける。 */}
      <div data-testid="detail-body" style={BODY_STYLE}>
        <div data-testid="detail-main" style={mainRowStyle}>
          <div data-testid="detail-cut" style={CUT_COLUMN_STYLE}>
            <div data-testid="detail-cut-frame" style={CUT_FRAME_STYLE}>
              {circle ? (
                <>
                  <img
                    data-testid="detail-cut-image"
                    className="detail-cut"
                    src={assetUrl(`/cuts/${circle.id}.png`)}
                    alt=""
                    width={CUT_WIDTH}
                    height={CUT_HEIGHT}
                    style={CUT_IMAGE_STYLE}
                  />
                  {/*
                    実物のカットは左上にスペース番号のボックスがある。チェック済みは
                    チェックリストの色で塗る。番号を出すのは a のサークルだけ
                    (サークルカット ウィンドウと同じ)。カット欄が 214x304 なので
                    番号も同じ比率で大きくする。
                  */}
                  {circle.spaceNoSub === 0 ? (
                    <CutSpaceBox
                      data-testid="detail-cut-space"
                      space={cutSpaceLabel(circle)}
                      color={checked ? checkColor : undefined}
                      scale={CUT_WIDTH / 105}
                    />
                  ) : null}
                </>
              ) : (
                <div data-testid="detail-cut-placeholder" style={CUT_BOX_STYLE}>
                  カット未選択
                </div>
              )}
            </div>
          </div>

          <div data-testid="detail-info" className="detail-info" style={INFO_BOX_STYLE}>
            {circle ? (
              <>
                {/* 実物は情報欄の 1 行目に開催日とスペースの位置を太字で出す。 */}
                <div data-testid="detail-position" style={POSITION_ROW_STYLE} title={positionLabel}>
                  {positionLabel}
                </div>
                {infoRows.map((row) => (
                  <div
                    key={row.label}
                    data-testid="detail-info-row"
                    data-label={row.label}
                    style={INFO_ROW_STYLE}
                  >
                    <span style={INFO_LABEL_STYLE}>{row.label}：</span>
                    <span style={INFO_VALUE_STYLE} title={row.value}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <p data-testid="detail-empty" style={EMPTY_STYLE}>
                サークルが選択されていません
              </p>
            )}
          </div>
        </div>

        <div data-testid="detail-links" className="detail-links" style={LINKS_STYLE}>
          {linkRows.map((row) => (
            <div key={row.key} data-testid="detail-link-row" style={LINK_ROW_STYLE}>
              <span style={LINK_LABEL_STYLE}>{row.label}：</span>
              <span style={LINK_VALUE_STYLE} title={row.value}>
                {row.href === '' ? (
                  row.value
                ) : (
                  <a href={row.href} target="_blank" rel="noreferrer" style={LINK_STYLE}>
                    {row.value}
                  </a>
                )}
              </span>
            </div>
          ))}
        </div>

        <div style={MEMO_LABEL_ROW_STYLE}>
          <span>サークルメモ：</span>
        </div>
        {/* 実物は「メモの編集」ダイアログで書き換えるが、Web 版はメモ欄をそのまま
            編集できるようにしている (サークルを選ぶたびに中身が入れ替わる)。 */}
        <textarea
          className="text-area"
          data-testid="detail-memo"
          aria-label="サークルメモ"
          style={MEMO_INPUT_STYLE}
          value={memo}
          disabled={!circle}
          onChange={(event) => onMemoChange(event.target.value)}
        />
      </div>
    </Window>
  );
}
