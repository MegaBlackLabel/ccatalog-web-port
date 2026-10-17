import { useState, type CSSProperties } from 'react';
import {
  Button,
  Checkbox,
  Dropdown,
  GroupBox,
  OptionButton,
  TextBox,
  Window,
} from '@megablacklabel/react98retro';
import { PAPER_SIZES } from './paper-sizes';
import { PRINT_FORMAT_DESCRIPTIONS } from './print-formats';
import type { PrintFormat } from './print-formats';
import { PRINT_ICONS } from './print-icons';

/** ダミーのプリンタ名 (Web 版は実際のプリンタを列挙できない)。 */
export const PRINTERS: readonly string[] = [
  'Microsoft Print To PDF',
  'EPSON PX-M6010F (ダミー)',
  'HP LaserJet Pro M15w (ダミー)',
];

/** プリンタのプロパティ (元ダイアログ 1538 の 状態 / 種類 / 場所 / コメント)。 */
type PrinterProperties = {
  status: string;
  kind: string;
  where: string;
  comment: string;
};

/**
 * 実物の [プロパティ] (1025) は OS のプリンタ プロパティを開くため、Web 版は
 * プリンタごとのダミーをそのまま表示する。
 */
const PRINTER_PROPERTIES: Record<string, PrinterProperties> = {
  'Microsoft Print To PDF': {
    status: '準備完了',
    kind: 'Microsoft Print To PDF',
    where: 'PORTPROMPT:',
    comment: '',
  },
  'EPSON PX-M6010F (ダミー)': {
    status: '準備完了',
    kind: 'EPSON PX-M6010F',
    where: 'USB001',
    comment: '',
  },
  'HP LaserJet Pro M15w (ダミー)': {
    status: '準備完了',
    kind: 'HP LaserJet Pro M15w',
    where: 'IP_192.168.0.12',
    comment: '',
  },
};

/**
 * 用紙サイズのコンボ。元リソースの 1641 は用紙サイズを出すスタティックだが、
 * 実物の新しい版は A4 を表示するコンボになっている (用紙の一覧は 203 と同じ)。
 */

/** 印刷形式 (元ダイアログ 1538 のラジオ 1046 / 1048 / 1049 / 1053)。出力形式と同じ 4 種。 */
export type { PrintFormat };

/** 印刷範囲 (元ダイアログ 1538 のラジオ 1056 / 1058 と 2 つの数値入力 1637)。 */
export type PrintRange = {
  /** すべて(&A) なら true、ページ指定(&G) なら false。 */
  all: boolean;
  /** ページ指定の開始ページ。 */
  from: number;
  /** ページ指定の終了ページ。 */
  to: number;
};

/** OK (元ダイアログ 1538 の [OK] 1) が渡す印刷設定。 */
export type PrintOptions = {
  /** プリンタ名 (コンボ 1139)。 */
  printer: string;
  /** 印刷形式 (ラジオ 1046 / 1048 / 1049 / 1053)。 */
  format: PrintFormat;
  /** 印刷範囲。 */
  range: PrintRange;
  /** 部数 (1154)。 */
  copies: number;
  /** 部単位 (1041)。 */
  collate: boolean;
  /** GDI+を使用しないで印刷 (1042)。 */
  noGdiPlus: boolean;
};

export type PrintDialogProps = {
  /** OK。選んだ設定をまとめて渡す。 */
  onPrint: (options: PrintOptions) => void;
  /** 用紙・余白の変更 (元リソース 1656)。 */
  onPageSetup: () => void;
  /**
   * 詳細設定 (元リソース 1051)。選んだ印刷形式を渡す。
   * 省略してもボタンは押せる (何も開かない)。
   */
  onDetails?: (format: PrintFormat) => void;
  /** 詳細説明 (元リソース 1642)。省略してもボタンは押せる (何も開かない)。 */
  onHelp?: () => void;
  /** プレビュー (元リソース 1052)。選んだ印刷形式を渡す。 */
  onPreview?: (format: PrintFormat) => void;
  /** キャンセル / 閉じる。 */
  onClose: () => void;
  /** 有効なページ番号の上限 (「(有効範囲 : 1-N)」に出す)。 */
  maxPage?: number;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/**
 * 印刷形式のラジオ (1046 / 1048 / 1049 / 1053)。ラベルは実物の新しい版
 * (ユーザー提供スクリーンショット実測) に合わせる。
 */
const PRINT_FORMATS: readonly { value: PrintFormat; controlId: number; label: string }[] = [
  { value: 'list', controlId: 1046, label: 'サークルリストID(K)' },
  { value: 'cut', controlId: 1048, label: 'サークルカット印刷(U)' },
  { value: 'map', controlId: 1049, label: 'マップ印刷(M)' },
  { value: 'blankMap', controlId: 1053, label: '白地図印刷(W)' },
];

/** 部数の上限 (元実装の編集欄は 1〜999)。 */
const COPIES_MAX = 999;

/** 有効なページ番号の既定の上限 (元リソースのスタティック 1639 は 1-1000)。 */
const MAX_PAGE_DEFAULT = 1000;

/**
 * ダイアログ 1538 の実測 (`解析/UI-SPEC.md`: 502 x 446 のクライアント領域)。
 * グループは左端 x=14 / 幅 476、下 3 つは x=14 と x=280 に並ぶ。
 */
const PRINTER_GROUP_STYLE: CSSProperties = {
  flex: '0 0 auto',
  width: 476,
  height: 128,
  // 実測: グループ内の左端は 14px (ラベルはクライアント x=28 から)。
  padding: '2px 14px 4px',
  margin: 0,
};

const RANGE_GROUP_STYLE: CSSProperties = { ...PRINTER_GROUP_STYLE, width: 252, height: 96 };

const COPIES_GROUP_STYLE: CSSProperties = { ...PRINTER_GROUP_STYLE, width: 210, height: 96 };

const FORMAT_GROUP_STYLE: CSSProperties = { ...PRINTER_GROUP_STYLE, height: 90 };

const TIPS_GROUP_STYLE: CSSProperties = { ...PRINTER_GROUP_STYLE, height: 56 };

const GROUP_BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

/** 状態 / 種類 / 場所 / コメント の行間 (実測: 46 → 63 → 80 → 96 の 16〜17px ピッチ)。 */
const PRINTER_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 13,
};

/** 印刷範囲と印刷部数は x=14 と x=280 に並ぶ (間は 14px)。 */
const GROUPS_ROW_STYLE: CSSProperties = {
  display: 'flex',
  gap: 14,
  flex: '0 0 auto',
};

const ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 };

/** ラベル列の幅 (実測: ラベル x=28 / 値 x=103 なので 75px)。 */
const LABEL_STYLE: CSSProperties = { flex: '0 0 75px' };

/**
 * 「プリンタ名(N):」は 75px では折り返すため、この行だけ実測 (ラベル x=28 / コンボ x=108) に
 * 合わせて広げる。
 */
const PRINTER_NAME_LABEL_STYLE: CSSProperties = {
  flex: '0 0 84px',
  whiteSpace: 'nowrap',
};

const VALUE_STYLE: CSSProperties = { flex: '1 1 auto', minWidth: 0 };

const SPACER_STYLE: CSSProperties = { flex: '1 1 auto' };

/**
 * 印刷範囲の 2 つの数値入力 (実測: 入力の幅は 1 つあたり 46px)。
 * minWidth: 0 を付けないと、エディットの既定の幅 (20 文字分) でグループが広がる。
 */
const PAGE_INPUT_STYLE: CSSProperties = { flex: '0 0 46px', minWidth: 0 };

/** ページ範囲の数値入力の行。実測では「1 - 1」と「(有効範囲 : 1-1000)」が 1 行に収まる。 */
const PAGE_ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', gap: 2 };

/** 「(有効範囲 : 1-N)」は折り返さない (実測: 幅 119px の 1 行)。 */
const RANGE_NOTE_STYLE: CSSProperties = { flex: '0 0 auto', whiteSpace: 'nowrap' };

/** 実測: エディット 1154 の幅は 46px。 */
const COPIES_INPUT_STYLE: CSSProperties = { flex: '0 0 46px', minWidth: 0 };

/** 実測: コンボ 1641 (用紙サイズ) は 120px 幅。 */
const PAPER_SIZE_STYLE: CSSProperties = { flex: '0 0 120px', minWidth: 0 };

/**
 * 印刷部数の絵 (スタティック 1086)。実測ではグループ相対で左下 (8,34) DLU、
 * 部数の行と部単位の行の下に置く。
 */
const COPIES_ICON_STYLE: CSSProperties = { alignSelf: 'flex-start', flex: '0 0 auto' };

const NOTE_STYLE: CSSProperties = { color: '#404040' };

/** ボタンの幅は元リソースの実測 (プロパティ 105 / 用紙・余白 147 / 詳細設定 91 …)。 */
const BUTTON_WIDTH_STYLE: CSSProperties = { flex: '0 0 auto', whiteSpace: 'nowrap' };

const FORMAT_ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 12 };

/** 形式のラジオ列 (実測: ラジオの幅 158px、ピッチ 16〜17px)。 */
const FORMAT_CHOICE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  flex: '0 0 158px',
};

/**
 * 実測: スタティック 1050 は SS_SUNKEN (凹んだ枠) で 282x30。いちばん長い文言
 * (マップ印刷の 2 行) が入る高さに固定し、形式を変えても高さを変えない。
 */
const FORMAT_DESCRIPTION_STYLE: CSSProperties = {
  background: 'transparent',
  height: 32,
  overflow: 'hidden',
  padding: '2px 3px',
};

/**
 * 説明文の下の段 (GDI+ のチェックと 詳細設定(N)... は実測でも同じ帯に並ぶ)。
 * 隙間は詰めてある (この段の最小幅がグループの内側 (444px) を超えると、グループごと広がる)。
 */
const FORMAT_CONTROLS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  paddingTop: 2,
};

/** GDI+ のラベルは 1 行 (実測: 192,297 の 178x18)。幅が足りないと折り返すので nowrap にする。 */
const FORMAT_CHECKBOX_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
};

const FORMAT_RIGHT_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minWidth: 0,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: 7,
  // 実測: ボタン列はクライアントの下端 (y=414〜435) に寄る。
  marginTop: 'auto',
  flex: '0 0 auto',
};

/**
 * 本文。ウィンドウ (510x471) に収まる寸法で組むので、スクロールは出さない
 * (実測: 中身は 436px で、本文の高さ 447px に収まる)。
 */
const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 7,
  // 実測: グループの左端は x=14、ボタン列の右端は x=488 (クライアント幅 502)。
  padding: '4px 12px 11px',
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'hidden',
  fontSize: 12,
};

/** 上下スピンのボタン (元リソース 1086 相当)。98.css のボタンは大きいので、小型の見た目を当てる。 */
const SPIN_BUTTON_STYLE: CSSProperties = {
  background: 'silver',
  border: 'none',
  borderRadius: 0,
  boxShadow:
    'inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px gray, inset 2px 2px #dfdfdf',
  boxSizing: 'border-box',
  color: 'transparent',
  cursor: 'default',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
  width: 16,
  height: 10,
  minWidth: 0,
  minHeight: 0,
  padding: 0,
};

const SPIN_ARROW_UP_STYLE: CSSProperties = {
  width: 0,
  height: 0,
  borderLeft: '3px solid transparent',
  borderRight: '3px solid transparent',
  borderBottom: '4px solid #000000',
};

const SPIN_ARROW_DOWN_STYLE: CSSProperties = {
  width: 0,
  height: 0,
  borderLeft: '3px solid transparent',
  borderRight: '3px solid transparent',
  borderTop: '4px solid #000000',
};

const SPIN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '0 0 auto',
  gap: 1,
};

/** 数値入力を 1〜max の整数として読む。読めない入力は undefined (呼び出し側で既定値にする)。 */
function parseCount(raw: string, max: number): number | undefined {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > max) return undefined;
  return parsed;
}

/**
 * 印刷ダイアログ (元実装のダイアログ 1538 / CHM 4PRINT/1PRINT.HTM)。
 * プリンタ・印刷範囲 (すべて / ページ指定)・印刷部数・印刷形式 (4 種) を指定する。
 * Web 版は印刷自体をダミーで再現し、選んだ設定を呼び出し側へ渡す。
 */
export function PrintDialog({
  onPrint,
  onPageSetup,
  onDetails,
  onHelp,
  onPreview,
  onClose,
  maxPage = MAX_PAGE_DEFAULT,
  initialX = 300,
  initialY = 80,
  // 元実装のクライアント領域は 502 x 446 (UI-SPEC)。ライブラリのウィンドウは
  // タイトルバーと余白 (上下 24px) を寸法に含むので、外枠は実測相当の 510 x 471。
  width = 510,
  height = 471,
  zIndex,
}: PrintDialogProps) {
  const [printer, setPrinter] = useState(PRINTERS[0]);
  const [paperSize, setPaperSize] = useState(PAPER_SIZES[0].name);
  const [format, setFormat] = useState<PrintFormat>('list');
  const [allPages, setAllPages] = useState(true);
  // 数値入力は編集中の文字列をそのまま持ち、OK で整数に直す。
  const [pageFrom, setPageFrom] = useState('1');
  const [pageTo, setPageTo] = useState('1');
  const [copies, setCopies] = useState('1');
  const [collate, setCollate] = useState(false);
  const [noGdiPlus, setNoGdiPlus] = useState(false);
  // 未知のプリンタ名 (テスト用の差し替えなど) は名前だけを種類として出す。
  const properties = PRINTER_PROPERTIES[printer] ?? {
    status: '準備完了',
    kind: printer,
    where: '',
    comment: '',
  };

  /** 上下スピン (1086) の 1 クリック分 (1〜999 の範囲に丸める)。 */
  const changeCopies = (delta: number) => {
    const current = parseCount(copies, COPIES_MAX) ?? 1;
    setCopies(String(Math.min(COPIES_MAX, Math.max(1, current + delta))));
  };

  const handlePrint = () => {
    onPrint({
      printer,
      format,
      range: {
        all: allPages,
        from: parseCount(pageFrom, maxPage) ?? 1,
        to: parseCount(pageTo, maxPage) ?? 1,
      },
      copies: parseCount(copies, COPIES_MAX) ?? 1,
      collate,
      noGdiPlus,
    });
  };

  return (
    <Window
      data-testid="print-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="印刷"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox data-ctrl-id={1075} legend="プリンタ" style={PRINTER_GROUP_STYLE}>
          <div style={GROUP_BODY_STYLE}>
            <div style={ROW_STYLE}>
              <label style={PRINTER_NAME_LABEL_STYLE} htmlFor="print-printer">
                プリンタ名(N):
              </label>
              <Dropdown
                id="print-printer"
                aria-label="プリンタ名"
                data-ctrl-id={1139}
                data-testid="print-printer"
                style={VALUE_STYLE}
                value={printer}
                onChange={(event) => setPrinter(event.target.value)}
              >
                {PRINTERS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Dropdown>
              <Button
                data-ctrl-id={1025}
                style={{ ...BUTTON_WIDTH_STYLE, width: 105 }}
                disabled
                title="プリンタのプロパティは Web 版では開けません"
              >
                プロパティ(P)...
              </Button>
            </div>
            <div style={PRINTER_ROW_STYLE}>
              <span data-ctrl-id={1095} style={LABEL_STYLE}>
                状態:
              </span>
              <span data-ctrl-id={1099} data-testid="print-printer-status" style={VALUE_STYLE}>
                {properties.status}
              </span>
            </div>
            <div style={PRINTER_ROW_STYLE}>
              <span data-ctrl-id={1094} style={LABEL_STYLE}>
                種類:
              </span>
              <span data-ctrl-id={1098} data-testid="print-printer-kind" style={VALUE_STYLE}>
                {properties.kind}
              </span>
            </div>
            <div style={PRINTER_ROW_STYLE}>
              <span data-ctrl-id={1097} style={LABEL_STYLE}>
                場所:
              </span>
              <span data-ctrl-id={1101} data-testid="print-printer-where" style={VALUE_STYLE}>
                {properties.where}
              </span>
            </div>
            <div style={PRINTER_ROW_STYLE}>
              <span data-ctrl-id={1096} style={LABEL_STYLE}>
                コメント:
              </span>
              <span data-ctrl-id={1100} data-testid="print-printer-comment" style={VALUE_STYLE}>
                {properties.comment}
              </span>
            </div>
            <div style={ROW_STYLE}>
              <span style={LABEL_STYLE}>用紙サイズ:</span>
              <Dropdown
                aria-label="用紙サイズ"
                data-ctrl-id={1641}
                data-testid="print-paper-size"
                style={PAPER_SIZE_STYLE}
                value={paperSize}
                onChange={(event) => setPaperSize(event.target.value)}
              >
                {PAPER_SIZES.map((paper) => (
                  <option key={paper.name} value={paper.name}>
                    {paper.name}
                  </option>
                ))}
              </Dropdown>
              <span style={SPACER_STYLE} />
              <Button
                data-ctrl-id={1656}
                data-testid="print-page-setup"
                style={{ ...BUTTON_WIDTH_STYLE, width: 147 }}
                onClick={onPageSetup}
              >
                用紙・余白の変更(S)...
              </Button>
            </div>
          </div>
        </GroupBox>

        <div style={GROUPS_ROW_STYLE}>
          <GroupBox data-ctrl-id={1072} legend="印刷範囲" style={RANGE_GROUP_STYLE}>
            <div style={GROUP_BODY_STYLE}>
              <OptionButton
                id="print-range-all"
                data-ctrl-id={1056}
                name="print-range"
                label="すべて(A)"
                checked={allPages}
                onChange={() => setAllPages(true)}
              />
              <OptionButton
                id="print-range-pages"
                data-ctrl-id={1058}
                name="print-range"
                label="ページ指定(G) :"
                checked={!allPages}
                onChange={() => setAllPages(false)}
              />
              <div style={PAGE_ROW_STYLE}>
                <TextBox
                  id="print-page-from"
                  aria-label="開始ページ"
                  data-ctrl-id={1637}
                  data-testid="print-page-from"
                  inputMode="numeric"
                  style={PAGE_INPUT_STYLE}
                  value={pageFrom}
                  onChange={(event) => setPageFrom(event.target.value)}
                />
                <span>-</span>
                <TextBox
                  id="print-page-to"
                  aria-label="終了ページ"
                  data-testid="print-page-to"
                  inputMode="numeric"
                  style={PAGE_INPUT_STYLE}
                  value={pageTo}
                  onChange={(event) => setPageTo(event.target.value)}
                />
                <span data-ctrl-id={1639} style={RANGE_NOTE_STYLE}>{`(有効範囲 : 1-${maxPage})`}</span>
              </div>
              <div style={NOTE_STYLE}>
                ページ番号・範囲を、コンマ区切りで入力してください （例 : 1, 3-5）
              </div>
            </div>
          </GroupBox>

          <GroupBox data-ctrl-id={1073} legend="印刷部数" style={COPIES_GROUP_STYLE}>
            <div style={GROUP_BODY_STYLE}>
              <div style={ROW_STYLE}>
                <span data-ctrl-id={1092} style={LABEL_STYLE}>
                  部数(C) :
                </span>
                <TextBox
                  id="print-copies"
                  aria-label="部数"
                  data-ctrl-id={1154}
                  data-testid="print-copies"
                  inputMode="numeric"
                  style={COPIES_INPUT_STYLE}
                  value={copies}
                  onChange={(event) => setCopies(event.target.value)}
                />
                <div style={SPIN_STYLE}>
                  <button
                    type="button"
                    aria-label="部数を増やす"
                    data-testid="print-copies-up"
                    style={SPIN_BUTTON_STYLE}
                    onClick={() => changeCopies(1)}
                  >
                    <span style={SPIN_ARROW_UP_STYLE} />
                  </button>
                  <button
                    type="button"
                    aria-label="部数を減らす"
                    data-testid="print-copies-down"
                    style={SPIN_BUTTON_STYLE}
                    onClick={() => changeCopies(-1)}
                  >
                    <span style={SPIN_ARROW_DOWN_STYLE} />
                  </button>
                </div>
              </div>
              {/* 実測: 部単位(&O) は部数のエディットの真下にぶら下がる。 */}
              <div style={{ ...ROW_STYLE, paddingLeft: 74 }}>
                <Checkbox
                  id="print-collate"
                  data-ctrl-id={1041}
                  data-testid="print-collate"
                  label="部単位(O)"
                  checked={collate}
                  onChange={(event) => setCollate(event.target.checked)}
                />
              </div>
              {/* 実測: スタティック 1086 (グループ相対で左下) は「3 の紙 + 1 の紙」の絵。 */}
              <img
                data-ctrl-id={1086}
                data-testid="print-copies-icon"
                src={PRINT_ICONS.copies}
                alt=""
                width={40}
                height={34}
                style={COPIES_ICON_STYLE}
              />
            </div>
          </GroupBox>
        </div>

        <GroupBox legend="印刷形式" style={FORMAT_GROUP_STYLE}>
          <div style={FORMAT_ROW_STYLE}>
            <div style={FORMAT_CHOICE_STYLE}>
              {PRINT_FORMATS.map((item) => (
                <OptionButton
                  key={item.value}
                  id={`print-format-${item.value}`}
                  data-ctrl-id={item.controlId}
                  name="print-format"
                  label={item.label}
                  checked={format === item.value}
                  onChange={() => setFormat(item.value)}
                />
              ))}
            </div>
            <div style={FORMAT_RIGHT_STYLE}>
              <div
                className="sunken-panel"
                data-ctrl-id={1050}
                data-testid="print-format-description"
                style={FORMAT_DESCRIPTION_STYLE}
              >
                {PRINT_FORMAT_DESCRIPTIONS[format]}
              </div>
              <div style={FORMAT_CONTROLS_STYLE}>
                <div style={FORMAT_CHECKBOX_STYLE}>
                  <Checkbox
                    id="print-no-gdiplus"
                    data-ctrl-id={1042}
                    data-testid="print-no-gdiplus"
                    label="GDI+を使用しないで印刷(B)"
                    checked={noGdiPlus}
                    onChange={(event) => setNoGdiPlus(event.target.checked)}
                  />
                </div>
                <span style={SPACER_STYLE} />
                <Button
                  data-ctrl-id={1051}
                  data-testid="print-details"
                  style={{ ...BUTTON_WIDTH_STYLE, width: 91 }}
                  onClick={onDetails ? () => onDetails(format) : undefined}
                >
                  詳細設定(N)...
                </Button>
              </div>
            </div>
          </div>
        </GroupBox>

        <GroupBox legend="Tips" style={TIPS_GROUP_STYLE}>
          <div style={ROW_STYLE}>
            <div style={VALUE_STYLE}>
              Windows2000/XPで印刷が非常に遅くなる場合、プリンタスプーラをOFFにすることで動作が改善される場合があります。
            </div>
            <Button
              data-ctrl-id={1642}
              data-testid="print-help"
              style={{ ...BUTTON_WIDTH_STYLE, width: 91 }}
              onClick={onHelp}
            >
              詳細説明(D)...
            </Button>
          </div>
        </GroupBox>

        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-ctrl-id={1}
            data-testid="print-submit"
            style={{ ...BUTTON_WIDTH_STYLE, width: 84 }}
            onClick={handlePrint}
          >
            OK
          </Button>
          <Button
            data-ctrl-id={2}
            data-testid="print-cancel"
            style={{ ...BUTTON_WIDTH_STYLE, width: 84 }}
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            data-ctrl-id={1052}
            data-testid="print-preview"
            style={{ ...BUTTON_WIDTH_STYLE, width: 80 }}
            onClick={onPreview ? () => onPreview(format) : undefined}
          >
            プレビュー(V)
          </Button>
        </div>
      </div>
    </Window>
  );
}
