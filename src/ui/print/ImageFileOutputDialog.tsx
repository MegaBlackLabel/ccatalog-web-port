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
import { PRINT_FORMAT_DESCRIPTIONS } from './print-formats';
import type { PrintFormat } from './print-formats';

/** ダイアログ 197 の 出力ファイル形式 (元実装はコンボボックス 1751)。 */
export type ImageFormat = 'bmp' | 'png' | 'jpg';

/** ダイアログ 197 の 出力形式 (ラジオ 1046 / 1048 / 1049 / 1053)。印刷形式と同じ 4 種。 */
export type ImageOutputFormat = PrintFormat;

/** 画像ファイル出力の設定 (アプリ側が持つ値)。 */
export type ImageOutputSettings = {
  /** 出力パス (1630)。 */
  directory: string;
  /** 出力ファイル名 (1632)。実際の出力は「(ファイル名)(ページ番号).拡張子」。 */
  baseName: string;
  /** 出力ファイル形式 (1751)。 */
  format: ImageFormat;
  /** 長辺のサイズ (1633)。0 は原寸。 */
  longSide: number;
  /** 高解像度で出力 (1705)。 */
  highResolution: boolean;
  /** 出力範囲: すべて (1056) = true / ページ指定 (1058) = false。 */
  allPages: boolean;
  /** ページ指定の範囲 (1637)。例 "3-5"。 */
  pageSpec: string;
  /** 出力形式 (1046 / 1048 / 1049 / 1053)。 */
  outputFormat: ImageOutputFormat;
  /** GDI+を使用しないで印刷 (1042)。 */
  noGdiPlus: boolean;
};

export type ImageFileOutputDialogProps = ImageOutputSettings & {
  /** 有効なページ番号の上限 (「(有効範囲 : 1-N)」に出す)。 */
  maxPage: number;
  onChange: (patch: Partial<ImageOutputSettings>) => void;
  /** OK。出力する。 */
  onOutput: () => void;
  /** プレビュー (1052)。 */
  onPreview: () => void;
  /** 詳細設定 (1051)。選択中の出力形式の詳細ダイアログを開く。 */
  onOpenDetails: () => void;
  /** 説明 (1646)。 */
  onHelp: () => void;
  /** キャンセル (2)。 */
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** 出力ファイル形式のコンボボックス (1751) の選択肢。 */
const FORMATS: readonly { value: ImageFormat; label: string }[] = [
  { value: 'bmp', label: 'BMP' },
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
];

/** 出力形式のラジオ (1046 / 1048 / 1049 / 1053)。 */
const OUTPUT_FORMATS: readonly { value: ImageOutputFormat; controlId: number; label: string }[] = [
  { value: 'list', controlId: 1046, label: 'サークルリスト印刷(I)' },
  { value: 'cut', controlId: 1048, label: 'サークルカット印刷(U)' },
  { value: 'map', controlId: 1049, label: 'マップ印刷(M)' },
  { value: 'blankMap', controlId: 1053, label: '白地図印刷(W)' },
];

/** 長辺のサイズの上限 (元実装の注記は 0, 1〜9999)。 */
const LONG_SIDE_MAX = 9999;

/**
 * ダイアログ 197 の実測 (クライアント 508 x 405 = 290x270 DLU)。
 * 画像出力は x=14 / 幅 476、出力範囲と出力形式は x=12 / 幅 485。
 */
const IMAGE_GROUP_STYLE: CSSProperties = {
  flex: '0 0 auto',
  width: 476,
  height: 128,
  // 実測: 見出しはグループ内の左端から 6px (クライアント x=20)。
  padding: '2px 6px 3px',
  margin: 0,
};

const RANGE_GROUP_STYLE: CSSProperties = { ...IMAGE_GROUP_STYLE, width: 485, height: 96 };

const FORMAT_GROUP_STYLE: CSSProperties = { ...IMAGE_GROUP_STYLE, width: 485, height: 90 };

const GROUP_BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', gap: 4 };

/**
 * 実測: 見出し (出力パス / 出力ファイル名 / 長辺のサイズ) は 103px で入力欄の左端がそろう。
 * 「出力ファイル名(B) :」が折り返さない幅を取る。
 */
const LABEL_STYLE: CSSProperties = { flex: '0 0 114px', whiteSpace: 'nowrap' };

const SPACER_STYLE: CSSProperties = { flex: '1 1 auto' };

/** 実測: 出力パスのエディットは 160 DLU = 280px。 */
const DIRECTORY_STYLE: CSSProperties = { flex: '1 1 auto', minWidth: 0 };

/** 実測: 出力ファイル名と出力ファイル形式は 48 DLU = 84px。 */
const SMALL_INPUT_STYLE: CSSProperties = { flex: '0 0 84px', minWidth: 0 };

/** 実測: 長辺のサイズは 27 DLU = 47px。 */
const LONG_SIDE_STYLE: CSSProperties = { flex: '0 0 47px', minWidth: 0 };

/** 実測: ページ指定の 1 つあたり 46px (1 - 1 で 110px に収まる)。 */
const PAGE_INPUT_STYLE: CSSProperties = { flex: '0 0 46px', minWidth: 0 };

const PAGE_ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', gap: 2 };

/** 「(有効範囲 : 1-N)」は折り返さない。 */
const RANGE_NOTE_STYLE: CSSProperties = { flex: '0 0 auto', whiteSpace: 'nowrap' };

/** 実測: 注記 (1752 / 長辺のサイズの注意) は入力欄とほぼ同じ左端から。 */
const NOTE_STYLE: CSSProperties = { color: '#404040', paddingLeft: 118 };

/** 出力範囲の注記はグループの左端 (実測 x=26) から。 */
const RANGE_NOTE_TEXT_STYLE: CSSProperties = { color: '#404040', paddingLeft: 6 };

/** ボタンの幅は元リソースの実測 (参照 41 / 詳細設定 52 / 説明 47 DLU …)。 */
const BUTTON_WIDTH_STYLE: CSSProperties = { flex: '0 0 auto', whiteSpace: 'nowrap' };

/** 形式のラジオ列 (実測: ラジオの幅 158px、ピッチ 15〜16px)。 */
const FORMAT_CHOICE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  flex: '0 0 165px',
};

/** 実測: 説明 (1050) の右列は 282px 幅で、詳細設定はその右端にそろう。 */
const FORMAT_RIGHT_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: '0 0 282px',
};

/**
 * 説明 (1050) は実物と同じ凹んだ枠 (SS_SUNKEN)。いちばん長い文言 (2 行) が入る
 * 高さに固定し、形式を変えても高さを変えない。
 */
const FORMAT_DESCRIPTION_STYLE: CSSProperties = {
  background: 'transparent',
  height: 32,
  overflow: 'hidden',
  padding: '2px 3px',
};

const FORMAT_ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8 };

/** 説明の下の段 (GDI+ のチェックと 詳細設定(N)... は実測でも同じ帯に並ぶ)。 */
const FORMAT_CONTROLS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

/** GDI+ のラベルは 1 行で出す (幅が足りないと折り返す)。 */
const CHECKBOX_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
};

const HIGH_RESOLUTION_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  // 実測: 高解像度と説明は下端のボタン列のすぐ上に並ぶ。
  marginTop: 'auto',
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  // 実測: OK / キャンセル / プレビュー は隙間 2px で右下に並ぶ。
  gap: 2,
  flex: '0 0 auto',
};

/**
 * 本文。ウィンドウ (518x429) に収まる寸法で組むので、スクロールは出さない
 * (実測: 中身は 385px で、本文の高さ 405px に収まる)。
 */
const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  // 実測: 画像出力のグループは x=14、出力範囲と出力形式は x=12 (クライアント幅 508)。
  padding: '4px 10px 9px 12px',
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'hidden',
  fontSize: 12,
};

/**
 * 出力範囲 (1637) の文字列を 2 つの数値入力に分ける。コンマ区切りの 1 つ目だけを見る
 * (画面は範囲 1 つを編集する)。読めない部分は 1 と maxPage にする。
 */
function parsePageRange(pageSpec: string, maxPage: number): { from: number; to: number } {
  const part = pageSpec.split(',')[0]?.trim() ?? '';
  const range = /^(\d*)\s*-\s*(\d*)$/.exec(part);
  if (range !== null) {
    return {
      from: range[1] === '' ? 1 : Number(range[1]),
      to: range[2] === '' ? maxPage : Number(range[2]),
    };
  }
  const page = Number(part);
  if (Number.isInteger(page) && page >= 1) return { from: page, to: page };
  return { from: 1, to: 1 };
}

/**
 * 印刷データの画像ファイル出力 (元実装のダイアログ 197 / CHM 4PRINT/6BMP.HTM)。
 * 出力パス・ファイル名・形式・長辺のサイズ・出力範囲・出力形式を指定して BMP を書き出す。
 * Web 版は書き出し自体をダミーで再現する。
 */
export function ImageFileOutputDialog({
  directory,
  baseName,
  format,
  longSide,
  highResolution,
  allPages,
  pageSpec,
  outputFormat,
  noGdiPlus,
  maxPage,
  onChange,
  onOutput,
  onPreview,
  onOpenDetails,
  onHelp,
  onClose,
  initialX = 300,
  initialY = 120,
  // 元実装のクライアント領域は 508 x 405 (290x270 DLU)。ライブラリのウィンドウは
  // タイトルバーと余白 (上下 24px / 左右 10px) を寸法に含むので、外枠は 518 x 429。
  width = 518,
  height = 429,
  zIndex,
}: ImageFileOutputDialogProps) {
  /** 編集中のページ範囲 (元実装のエディット 1637 に入る文字列を作る)。 */
  const initialRange = parsePageRange(pageSpec, maxPage);
  const [pageFrom, setPageFrom] = useState(String(initialRange.from));
  const [pageTo, setPageTo] = useState(String(initialRange.to));
  // 長辺のサイズは編集中の文字列をそのまま持つ (範囲外・数値でない入力は onChange に出さない)。
  const [longSideDraft, setLongSideDraft] = useState(String(longSide));

  const changeLongSide = (raw: string) => {
    setLongSideDraft(raw);
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > LONG_SIDE_MAX) return;
    onChange({ longSide: parsed });
  };

  /** ページ範囲の入力。両方が読めたときだけ "3-5" の形で親へ渡す。 */
  const changePageRange = (which: 'from' | 'to', raw: string) => {
    const next = { from: pageFrom, to: pageTo };
    next[which] = raw;
    if (which === 'from') setPageFrom(raw);
    else setPageTo(raw);
    const from = Number(next.from);
    const to = Number(next.to);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < 1) return;
    onChange({ pageSpec: `${from}-${to}` });
  };

  return (
    <Window
      data-testid="image-output-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="印刷データの画像ファイル出力"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox data-ctrl-id={1075} legend="画像出力" style={IMAGE_GROUP_STYLE}>
          <div style={GROUP_BODY_STYLE}>
            <div style={ROW_STYLE}>
              <span style={LABEL_STYLE}>出力パス(P) :</span>
              {/* ライブラリの TextBox は input を .field-row で包むので、伸ばすのは包み側。 */}
              <div style={DIRECTORY_STYLE}>
                <TextBox
                  id="image-output-directory"
                  aria-label="出力パス"
                  data-ctrl-id={1630}
                  data-testid="image-output-directory"
                  style={{ flex: '1 1 auto', minWidth: 0 }}
                  value={directory}
                  onChange={(event) => onChange({ directory: event.target.value })}
                />
              </div>
              <Button
                data-ctrl-id={1631}
                data-testid="image-output-browse"
                style={{ ...BUTTON_WIDTH_STYLE, width: 72 }}
                disabled
                title="Web 版ではフォルダを参照できません (パスを直接入力)"
              >
                参照(C)...
              </Button>
            </div>
            <div style={ROW_STYLE}>
              <span style={LABEL_STYLE}>出力ファイル名(B) :</span>
              <TextBox
                id="image-output-name"
                aria-label="出力ファイル名"
                data-ctrl-id={1632}
                data-testid="image-output-name"
                style={SMALL_INPUT_STYLE}
                value={baseName}
                onChange={(event) => onChange({ baseName: event.target.value })}
              />
              <span style={SPACER_STYLE} />
              <span>出力ファイル形式(F) :</span>
              <Dropdown
                id="image-output-format"
                aria-label="出力ファイル形式"
                data-ctrl-id={1751}
                data-testid="image-output-format"
                style={SMALL_INPUT_STYLE}
                options={FORMATS.map((item) => ({ value: item.value, label: item.label }))}
                value={format}
                onChange={(event) => onChange({ format: event.target.value as ImageFormat })}
              />
            </div>
            <div data-ctrl-id={1752} data-testid="image-output-note" style={NOTE_STYLE}>
              {`※ ページ番号と拡張子".${format}"が付加されます。`}
            </div>
            <div style={ROW_STYLE}>
              <span style={LABEL_STYLE}>長辺のサイズ(S) :</span>
              <TextBox
                id="image-output-long-side"
                aria-label="長辺のサイズ"
                data-ctrl-id={1633}
                data-testid="image-output-long-side"
                inputMode="numeric"
                style={LONG_SIDE_STYLE}
                value={longSideDraft}
                onChange={(event) => changeLongSide(event.target.value)}
              />
              <span>ピクセル (0, 1〜9999)</span>
            </div>
            <div style={NOTE_STYLE}>※ 0を指定すると、原寸で出力します。</div>
          </div>
        </GroupBox>

        <GroupBox data-ctrl-id={1072} legend="出力範囲" style={RANGE_GROUP_STYLE}>
          <div style={GROUP_BODY_STYLE}>
            <OptionButton
              id="image-output-range-all"
              data-ctrl-id={1056}
              name="image-output-range"
              label="すべて(A)"
              checked={allPages}
              onChange={() => onChange({ allPages: true })}
            />
            <OptionButton
              id="image-output-range-pages"
              data-ctrl-id={1058}
              name="image-output-range"
              label="ページ指定(G) :"
              checked={!allPages}
              onChange={() => onChange({ allPages: false })}
            />
            <div style={PAGE_ROW_STYLE}>
              <TextBox
                id="image-output-page-from"
                aria-label="開始ページ"
                data-ctrl-id={1637}
                data-testid="image-output-page-from"
                inputMode="numeric"
                style={PAGE_INPUT_STYLE}
                value={pageFrom}
                onChange={(event) => changePageRange('from', event.target.value)}
              />
              <span>-</span>
              <TextBox
                id="image-output-page-to"
                aria-label="終了ページ"
                data-testid="image-output-page-to"
                inputMode="numeric"
                style={PAGE_INPUT_STYLE}
                value={pageTo}
                onChange={(event) => changePageRange('to', event.target.value)}
              />
              <span data-ctrl-id={1639} style={RANGE_NOTE_STYLE}>{`(有効範囲 : 1-${maxPage})`}</span>
            </div>
            <div data-testid="image-output-range-note" style={RANGE_NOTE_TEXT_STYLE}>
              ページ番号・範囲を、コンマ区切りで入力してください （例 : 1, 3-5）
            </div>
          </div>
        </GroupBox>

        <GroupBox legend="出力形式" style={FORMAT_GROUP_STYLE}>
          <div style={FORMAT_ROW_STYLE}>
            <div style={FORMAT_CHOICE_STYLE}>
              {OUTPUT_FORMATS.map((item) => (
                <OptionButton
                  key={item.value}
                  id={`image-output-format-${item.value}`}
                  data-ctrl-id={item.controlId}
                  name="image-output-format"
                  label={item.label}
                  checked={outputFormat === item.value}
                  onChange={() => onChange({ outputFormat: item.value })}
                />
              ))}
            </div>
            <div style={FORMAT_RIGHT_STYLE}>
              <div
                className="sunken-panel"
                data-ctrl-id={1050}
                data-testid="image-output-description"
                style={FORMAT_DESCRIPTION_STYLE}
              >
                {PRINT_FORMAT_DESCRIPTIONS[outputFormat]}
              </div>
              <div style={FORMAT_CONTROLS_STYLE}>
                <div style={CHECKBOX_ROW_STYLE}>
                  <Checkbox
                    id="image-output-no-gdiplus"
                    data-ctrl-id={1042}
                    data-testid="image-output-no-gdiplus"
                    label="GDI+を使用しないで印刷(B)"
                    checked={noGdiPlus}
                    onChange={(event) => onChange({ noGdiPlus: event.target.checked })}
                  />
                </div>
                <span style={SPACER_STYLE} />
                <Button
                  data-ctrl-id={1051}
                  data-testid="image-output-details"
                  style={{ ...BUTTON_WIDTH_STYLE, width: 91 }}
                  onClick={onOpenDetails}
                >
                  詳細設定(N)...
                </Button>
              </div>
            </div>
          </div>
        </GroupBox>

        <div style={HIGH_RESOLUTION_ROW_STYLE}>
          <Checkbox
            id="image-output-high-resolution"
            data-ctrl-id={1705}
            data-testid="image-output-high-resolution"
            label="高解像度で出力(H)"
            checked={highResolution}
            onChange={(event) => onChange({ highResolution: event.target.checked })}
          />
          <Button
            data-ctrl-id={1646}
            data-testid="image-output-help"
            style={{ ...BUTTON_WIDTH_STYLE, width: 82 }}
            onClick={onHelp}
          >
            説明(R)...
          </Button>
        </div>

        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-ctrl-id={1}
            data-testid="image-output-submit"
            style={{ ...BUTTON_WIDTH_STYLE, width: 88 }}
            onClick={onOutput}
          >
            OK
          </Button>
          <Button
            data-ctrl-id={2}
            data-testid="image-output-cancel"
            style={{ ...BUTTON_WIDTH_STYLE, width: 88 }}
            onClick={onClose}
          >
            キャンセル
          </Button>
          <Button
            data-ctrl-id={1052}
            data-testid="image-output-preview"
            style={{ ...BUTTON_WIDTH_STYLE, width: 81 }}
            onClick={onPreview}
          >
            プレビュー(V)
          </Button>
        </div>
      </div>
    </Window>
  );
}
