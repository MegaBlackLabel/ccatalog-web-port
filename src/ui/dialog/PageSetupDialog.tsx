import { useState, type CSSProperties } from 'react';
import { Button, GroupBox, TextBox, Window } from '@megablacklabel/react98retro';
import { DEFAULT_PAGE_SETUP } from '../../domain/app-settings';
import type { PageSetup } from '../../domain/app-settings';

export type PageSetupDialogProps = {
  /** 現在の用紙サイズ・余白。未編集の入力欄の表示に使う。 */
  setup: PageSetup;
  /** 数値として読めた入力ごとに、その項目だけの patch で呼ばれる。 */
  onChange: (patch: Partial<PageSetup>) => void;
  /** 「閉じる」。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/** ダイアログ内で編集した項目の生テキスト (未編集の項目は持たない)。 */
type PageSetupEdits = Partial<Record<keyof PageSetup, string>>;

type PageSetupRow = {
  field: keyof PageSetup;
  label: string;
  /** 元実装 (ダイアログ 203) のコントロール ID。対応する入力が無い項目は省略。 */
  controlId?: number;
};

/**
 * 元実装 (ダイアログ 203) の入力は 1638 (幅) / 1644 (高さ) / 1653 (左) / 1651 (上) など。
 * DPI・オフセットと、左右 / 上下の余白の統合は Web 版の PageSetup (cpr.ini の [DOCUMENT]) に合わせている。
 */
const PAGE_SETUP_GROUPS: readonly { legend: string; rows: readonly PageSetupRow[] }[] = [
  {
    legend: '用紙サイズ',
    rows: [
      { field: 'dpi', label: 'DPI' },
      { field: 'paperWidth', label: '用紙幅(mm)', controlId: 1638 },
      { field: 'paperHeight', label: '用紙高さ(mm)', controlId: 1644 },
    ],
  },
  {
    legend: '余白',
    rows: [
      { field: 'marginX', label: '左右余白(mm)', controlId: 1653 },
      { field: 'marginY', label: '上下余白(mm)', controlId: 1651 },
      { field: 'offsetX', label: 'オフセットX(mm)' },
      { field: 'offsetY', label: 'オフセットY(mm)' },
    ],
  },
];

/** 編集した 1 項目だけを反映した編集内容を返す。 */
function textEdit(field: keyof PageSetup, text: string): PageSetupEdits {
  switch (field) {
    case 'dpi':
      return { dpi: text };
    case 'paperWidth':
      return { paperWidth: text };
    case 'paperHeight':
      return { paperHeight: text };
    case 'marginX':
      return { marginX: text };
    case 'marginY':
      return { marginY: text };
    case 'offsetX':
      return { offsetX: text };
    case 'offsetY':
      return { offsetY: text };
  }
}

/** 数値として読めた 1 項目だけの patch を返す。 */
function numberPatch(field: keyof PageSetup, value: number): Partial<PageSetup> {
  switch (field) {
    case 'dpi':
      return { dpi: value };
    case 'paperWidth':
      return { paperWidth: value };
    case 'paperHeight':
      return { paperHeight: value };
    case 'marginX':
      return { marginX: value };
    case 'marginY':
      return { marginY: value };
    case 'offsetX':
      return { offsetX: value };
    case 'offsetY':
      return { offsetY: value };
  }
}

/** 「既定値に戻す」で入力欄に戻す既定値。 */
const DEFAULT_EDITS: PageSetupEdits = {
  dpi: String(DEFAULT_PAGE_SETUP.dpi),
  paperWidth: String(DEFAULT_PAGE_SETUP.paperWidth),
  paperHeight: String(DEFAULT_PAGE_SETUP.paperHeight),
  marginX: String(DEFAULT_PAGE_SETUP.marginX),
  marginY: String(DEFAULT_PAGE_SETUP.marginY),
  offsetX: String(DEFAULT_PAGE_SETUP.offsetX),
  offsetY: String(DEFAULT_PAGE_SETUP.offsetY),
};

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 4,
  overflow: 'auto',
  flex: '1 1 auto',
  minHeight: 0,
};

const FIELD_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const INPUT_STYLE: CSSProperties = {
  width: 72,
  textAlign: 'right',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

type PageSetupFieldProps = {
  field: keyof PageSetup;
  /** 元実装のコントロール ID (無い項目は undefined)。 */
  controlId?: number;
  label: string;
  value: string;
  onValue: (field: keyof PageSetup, text: string) => void;
};

/** 数値入力 1 個。生のテキストはダイアログ側が保持する。 */
function PageSetupField({ field, controlId, label, value, onValue }: PageSetupFieldProps) {
  return (
    <TextBox
      id={`page-setup-${field}`}
      data-ctrl-id={controlId}
      label={label}
      value={value}
      inputMode="numeric"
      style={INPUT_STYLE}
      onChange={(event) => onValue(field, event.target.value)}
    />
  );
}

/** 用紙サイズ・余白の設定 (ダイアログ 203)。数値として読めない入力では patch を出さない。 */
export function PageSetupDialog({
  setup,
  onChange,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: PageSetupDialogProps) {
  const [edits, setEdits] = useState<PageSetupEdits>({});

  const applyText = (field: keyof PageSetup, text: string) => {
    setEdits((current) => ({ ...current, ...textEdit(field, text) }));
    const parsed = Number.parseInt(text, 10);
    if (Number.isNaN(parsed)) return;
    onChange(numberPatch(field, parsed));
  };

  const resetToDefaults = () => {
    setEdits(DEFAULT_EDITS);
    onChange({ ...DEFAULT_PAGE_SETUP });
  };

  return (
    <Window
      data-testid="page-setup-dialog"
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
        {PAGE_SETUP_GROUPS.map((group) => (
          <GroupBox key={group.legend} legend={group.legend}>
            <div style={FIELD_COLUMN_STYLE}>
              {group.rows.map((row) => (
                <PageSetupField
                  key={row.field}
                  field={row.field}
                  controlId={row.controlId}
                  label={row.label}
                  value={edits[row.field] ?? String(setup[row.field])}
                  onValue={applyText}
                />
              ))}
            </div>
          </GroupBox>
        ))}
        <div style={BUTTON_ROW_STYLE}>
          <Button data-testid="page-setup-reset" onClick={resetToDefaults}>
            既定値に戻す
          </Button>
          <Button
            variant="default"
            data-testid="page-setup-close"
            data-ctrl-id={2}
            onClick={onClose}
          >
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
