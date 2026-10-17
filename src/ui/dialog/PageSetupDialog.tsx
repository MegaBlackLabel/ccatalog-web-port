import { useState, type CSSProperties } from 'react';
import {
  Button,
  Checkbox,
  Dropdown,
  GroupBox,
  TextBox,
  Window,
} from '@megablacklabel/react98retro';
import type { PageSetup } from '../../domain/app-settings';
import { PAPER_SIZES, formatMm } from '../print/paper-sizes';

export type PageSetupDialogProps = {
  /** 現在の用紙サイズ・余白 (元実装は cpr.ini の [DOCUMENT])。 */
  setup: PageSetup;
  /** OK で確定した設定。キャンセルでは呼ばない。 */
  onChange: (setup: PageSetup) => void;
  /** OK / キャンセル / ✕。編集は捨てる。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** 数値入力の項目 (元リソースのエディット 1644 / 1638 / 1653 / 1654 / 1651 / 1652)。 */
type NumberField =
  | 'paperHeight'
  | 'paperWidth'
  | 'marginLeft'
  | 'marginRight'
  | 'marginTop'
  | 'marginBottom';

type NumberRow = {
  field: NumberField;
  /** 見出し (元リソースのスタティック)。 */
  label: string;
  /** 元リソースのコントロール ID。 */
  controlId: number;
};

/** 用紙サイズの高さ / 幅 (元リソース 1644 / 1638)。 */
const PAPER_ROWS: readonly NumberRow[] = [
  { field: 'paperHeight', label: '高さ(H)', controlId: 1644 },
  { field: 'paperWidth', label: '幅(W)', controlId: 1638 },
];

/** 余白の 4 項目 (元リソース 1653 / 1654 / 1651 / 1652)。 */
const MARGIN_ROWS: readonly NumberRow[] = [
  { field: 'marginLeft', label: '左(L)', controlId: 1653 },
  { field: 'marginRight', label: '右(R)', controlId: 1654 },
  { field: 'marginTop', label: '上(T)', controlId: 1651 },
  { field: 'marginBottom', label: '下(B)', controlId: 1652 },
];

/** プレビュー (元リソース 1655 の静止コントロール) の内側の大きさ (実測: 200x258 から枠を引いた 196x254)。 */
const PREVIEW_WIDTH = 196;
const PREVIEW_HEIGHT = 254;

/** 紙とプレビュー枠の間の余白 (実測: A4 の紙が 170x240 になる値)。 */
const PREVIEW_PADDING = 7;

/** 小数 1 桁に丸める (表示と計算で同じ値を使う)。 */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  // 実測: グループの左端は x=12、プレビューの右端は x=391 (クライアント幅 402)。
  padding: '8px 9px 6px 10px',
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'hidden',
  fontSize: 12,
};

const COLUMNS_STYLE: CSSProperties = {
  display: 'flex',
  gap: 15,
  flex: '0 0 auto',
};

const LEFT_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 9,
  flex: '0 0 auto',
};

/** 実測: 用紙サイズは 164x104、余白は 164x151。 */
const GROUP_STYLE: CSSProperties = {
  flex: '0 0 auto',
  width: 164,
  // 右の余白は詰める (中身の最小幅 + 左右の余白が 164px を超えるとグループごと広がる)。
  padding: '6px 6px 4px 14px',
  margin: 0,
};

const GROUP_BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
};

const ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', gap: 4 };

/** 実測: 見出しはグループ内の左端から 16px、エディットは x=89 から。 */
const LABEL_STYLE: CSSProperties = { flex: '0 0 57px' };

/** 実測: エディットは 31 DLU = 54px。 */
const INPUT_STYLE: CSSProperties = { flex: '0 0 54px', minWidth: 0, textAlign: 'right' };

/** 実測: 用紙のコンボは 44 DLU = 77px。 */
const PAPER_COMBO_STYLE: CSSProperties = { flex: '0 0 77px', minWidth: 0 };

/** 実測: プレビューは (191, 16) の 200x258。 */
const PREVIEW_PANEL_STYLE: CSSProperties = {
  width: 200,
  height: 258,
  marginTop: 6,
  background: 'transparent',
  overflow: 'hidden',
  flex: '0 0 auto',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  flex: '0 0 auto',
};

/** 実測: ボタンは 50 DLU = 87px。 */
const BUTTON_WIDTH_STYLE: CSSProperties = { flex: '0 0 auto', width: 87 };

/**
 * プレビュー (元ダイアログ 203 のスタティック 1655 を Web 版が描く)。
 * 白い紙を枠いっぱい (余白 7px) に縦横比を保って置き、その上に余白と同じ倍率で
 * 内側へ寄せた青の破線 (1px) を描く。実測: 紙 170x240 / 左の破線 16px (= 20mm × 170/210)。
 */
function PageSetupPreview({ setup }: { setup: PageSetup }) {
  const paperWidth = Math.max(setup.paperWidth, 1);
  const paperHeight = Math.max(setup.paperHeight, 1);
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / paperWidth,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / paperHeight,
  );
  const width = paperWidth * scale;
  const height = paperHeight * scale;
  const x = (PREVIEW_WIDTH - width) / 2;
  const y = (PREVIEW_HEIGHT - height) / 2;
  // 余白は紙と同じ倍率で内側へ寄せる。紙からはみ出す指定は半分で止める。
  const inset = (mm: number, paper: number) => Math.min(paper / 2, Math.max(mm, 0) * scale);
  const left = inset(setup.marginLeft, width);
  const right = inset(setup.marginRight, width);
  const top = inset(setup.marginTop, height);
  const bottom = inset(setup.marginBottom, height);

  return (
    <svg
      data-testid="page-setup-preview"
      width={PREVIEW_WIDTH}
      height={PREVIEW_HEIGHT}
      style={{ display: 'block' }}
    >
      {/* 紙の右下の薄い影 (実測 #e3e3e3 が 2px)。 */}
      <rect x={x + 2} y={y + 2} width={width} height={height} fill="#e3e3e3" />
      <rect
        data-testid="page-setup-preview-paper"
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#ffffff"
      />
      <rect
        data-testid="page-setup-preview-margins"
        x={x + left}
        y={y + top}
        width={Math.max(0, width - left - right)}
        height={Math.max(0, height - top - bottom)}
        fill="none"
        stroke="#0000ff"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
    </svg>
  );
}

/**
 * 用紙サイズ・余白の設定 (元実装のダイアログ 203 / CHM 4PRINT/1PRINT.HTM)。
 * 用紙・高さ・幅と、左右上下の余白を指定する。プレビューは余白を紙と同じ倍率で示す。
 * 編集はダイアログ内に溜め、OK で確定、キャンセルでは捨てる。
 */
export function PageSetupDialog({
  setup,
  onChange,
  onClose,
  initialX = 300,
  initialY = 160,
  // 元実装のクライアント領域は 402 x 316 (230x211 DLU)。ライブラリのウィンドウは
  // タイトルバーと余白 (上下 24px / 左右 10px) を寸法に含むので、外枠は 412 x 340。
  width = 412,
  height = 340,
  zIndex,
}: PageSetupDialogProps) {
  /** 編集中の設定 (OK で親へ渡す)。 */
  const [draft, setDraft] = useState(setup);
  /** 編集中の生テキスト (未編集の項目は draft の値を表示する)。 */
  const [text, setText] = useState<Partial<Record<NumberField, string>>>({});

  /**
   * 数値入力の編集。縦横比を保つ (1650) が入っていれば、幅を変えたら高さ、
   * 高さを変えたら幅を同じ比で追随させる。
   */
  const editNumber = (field: NumberField, raw: string) => {
    const value = Number(raw);
    const valid = raw.trim() !== '' && Number.isFinite(value);
    const followField =
      field === 'paperWidth' ? 'paperHeight' : field === 'paperHeight' ? 'paperWidth' : undefined;

    setText((current) => {
      const next = { ...current, [field]: raw };
      // 追随する側は計算結果を見せる (編集中のテキストを捨てる)。
      if (valid && draft.keepAspect && followField !== undefined) delete next[followField];
      return next;
    });
    if (!valid) return;

    setDraft((current) => {
      const next = { ...current, [field]: value };
      if (!current.keepAspect) return next;
      // 追随する側は丸めずに持つ (毎回丸めると比が少しずつずれる)。表示と OK で小数 1 桁にする。
      if (field === 'paperWidth' && current.paperWidth > 0) {
        next.paperHeight = value * (current.paperHeight / current.paperWidth);
      }
      if (field === 'paperHeight' && current.paperHeight > 0) {
        next.paperWidth = value * (current.paperWidth / current.paperHeight);
      }
      return next;
    });
  };

  /** 用紙 (1643) を選ぶと、幅 (1638) と高さ (1644) がその値になる。 */
  const choosePaper = (name: string) => {
    const paper = PAPER_SIZES.find((item) => item.name === name);
    setText({});
    setDraft((current) =>
      paper === undefined
        ? { ...current, paper: name }
        : { ...current, paper: paper.name, paperWidth: paper.width, paperHeight: paper.height },
    );
  };

  const numberRow = (row: NumberRow) => (
    <div key={row.field} style={ROW_STYLE}>
      <span style={LABEL_STYLE}>{`${row.label} :`}</span>
      <TextBox
        id={`page-setup-${row.field}`}
        aria-label={row.label}
        data-ctrl-id={row.controlId}
        data-testid={`page-setup-${row.field}`}
        inputMode="decimal"
        style={INPUT_STYLE}
        value={text[row.field] ?? formatMm(draft[row.field])}
        onChange={(event) => editNumber(row.field, event.target.value)}
      />
      <span>mm</span>
    </div>
  );

  return (
    <Window
      data-testid="page-setup-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="用紙サイズ・余白の設定"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <div style={COLUMNS_STYLE}>
          <div style={LEFT_COLUMN_STYLE}>
            <GroupBox legend="用紙サイズ" style={{ ...GROUP_STYLE, height: 104 }}>
              <div style={GROUP_BODY_STYLE}>
                <div style={ROW_STYLE}>
                  <span style={LABEL_STYLE}>用紙(P) :</span>
                  <Dropdown
                    id="page-setup-paper"
                    aria-label="用紙(P)"
                    data-ctrl-id={1643}
                    data-testid="page-setup-paper"
                    style={PAPER_COMBO_STYLE}
                    value={draft.paper}
                    onChange={(event) => choosePaper(event.target.value)}
                  >
                    {PAPER_SIZES.map((paper) => (
                      <option key={paper.name} value={paper.name}>
                        {paper.name}
                      </option>
                    ))}
                  </Dropdown>
                </div>
                {PAPER_ROWS.map(numberRow)}
              </div>
            </GroupBox>

            <GroupBox legend="余白" style={{ ...GROUP_STYLE, height: 151 }}>
              <div style={GROUP_BODY_STYLE}>
                {MARGIN_ROWS.map(numberRow)}
                <Checkbox
                  id="page-setup-keep-aspect"
                  data-ctrl-id={1650}
                  data-testid="page-setup-keep-aspect"
                  label="縦横比を保つ(K)"
                  checked={draft.keepAspect}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, keepAspect: event.target.checked }))
                  }
                />
              </div>
            </GroupBox>
          </div>

          <div
            data-ctrl-id={1655}
            data-testid="page-setup-preview-panel"
            className="sunken-panel"
            style={PREVIEW_PANEL_STYLE}
          >
            <PageSetupPreview setup={draft} />
          </div>
        </div>

        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-ctrl-id={1}
            data-testid="page-setup-ok"
            style={BUTTON_WIDTH_STYLE}
            onClick={() => {
              // 端数はここで小数 1 桁に揃える (編集中は縦横比を保つために丸めない)。
              onChange({
                ...draft,
                paperWidth: round1(draft.paperWidth),
                paperHeight: round1(draft.paperHeight),
                marginLeft: round1(draft.marginLeft),
                marginRight: round1(draft.marginRight),
                marginTop: round1(draft.marginTop),
                marginBottom: round1(draft.marginBottom),
              });
              onClose();
            }}
          >
            OK
          </Button>
          <Button
            data-ctrl-id={2}
            data-testid="page-setup-cancel"
            style={BUTTON_WIDTH_STYLE}
            onClick={onClose}
          >
            キャンセル
          </Button>
        </div>
      </div>
    </Window>
  );
}
