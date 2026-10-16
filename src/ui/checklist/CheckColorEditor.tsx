import { useState, type CSSProperties } from 'react';
import { Button, Dropdown, GroupBox, TextBox } from '@megablacklabel/react98retro';
import type { CheckColorSettings } from '../../domain/app-settings';
import { CHECK_COLOR_IDS, checkColorPalette } from '../check-colors';
import { ColorPaletteDialog } from '../dialog/ColorPaletteDialog';

export type CheckColorEditorProps = {
  /** 色の設定 (表示色 / 印刷色 / 名称 / 編集するチェック色)。 */
  checkColors: CheckColorSettings;
  onChange: (patch: Partial<CheckColorSettings>) => void;
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

const TEXT_BUTTON_STYLE: CSSProperties = {
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
};

/**
 * 色のスウォッチ (元実装の ownerdraw ボタン 17x14 DLU)。プロパティシートの換算
 * (x = 1.75 / y = 1.85) で 30x26 だが、下の 9 列に合わせて横幅いっぱいまで広げる
 * (実物の比率 17/20 = 85%)。
 */
const SWATCH_STYLE: CSSProperties = {
  width: '100%',
  maxWidth: 36,
  height: 26,
  minWidth: 0,
  minHeight: 0,
};

/** ページ (タブの中身) は実物どおりの余白で組む。 */
const PAGE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '13px 7px 8px',
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'hidden',
};

/**
 * 実測: 色の編集 (8,28,216,59) / チェック色名の編集 (8,96,216,36) はどちらもページの
 * 内側幅いっぱい (高さは 109 / 67)。上下の余白は実物どおりで、色の編集は
 * 上 ≈18px / 下 ≈10px、チェック色名の編集は行が上下ほぼ中央 (≈21px ずつ)。
 */
const GROUP_STYLE: CSSProperties = { flex: '0 0 auto', margin: 0, padding: '5px 8px 8px 10px' };

/** チェック色名の編集は行が上下中央に来るように余白を取る (上に凡例 10px がある)。 */
const NAME_GROUP_STYLE: CSSProperties = {
  ...GROUP_STYLE,
  padding: '11px 8px 21px 10px',
};

/**
 * 色の列。9 個でグループの残り幅を等分する (実物は 20 DLU = 35px ピッチで 9 個)。
 * 見出し (色1〜色9) とスウォッチは同じ列に並ぶ。
 */
const SWATCH_ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'center' };

/** 色 1 列ぶん (残り幅を等分)。 */
const COLOR_CELL_STYLE: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  justifyContent: 'center',
};

/** 見出し (色N) とスウォッチの行の間隔 (実測: 見出しの下端からスウォッチの上端まで 3px)。 */
const LABEL_ROW_STYLE: CSSProperties = {
  ...SWATCH_ROW_STYLE,
  height: 16,
  alignItems: 'flex-end',
  paddingBottom: 3,
};

/** 2 段 (表示色 / 印刷色) の間隔 (実測: スウォッチの下端から次の段の上端まで 8px)。 */
const SWATCH_ROWS_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

/**
 * 「表示色 :」「印刷色 :」の見出しの幅 (実測: 1 個目のスウォッチはグループの左端から
 * 33 DLU = 58px)。見出しが折り返さない幅を取る。
 */
const COLOR_LABEL_WIDTH = 54;

/** 見出しは 1 行で出す。 */
const COLOR_LABEL_STYLE: CSSProperties = { width: COLOR_LABEL_WIDTH, whiteSpace: 'nowrap' };

/**
 * チェック色の編集 (元実装のダイアログ 149 「チェック色」の中身)。
 * 動作設定の「色の設定」ページと、「チェック色の編集」プロパティシートの両方から使う。
 *
 * - 編集するチェック色 (1702): 標準の設定値 / 現在のチェックリスト
 * - 色の編集 (1020〜1037): 表示色 9 個 + 印刷色 9 個 (押すと色パレット)
 * - チェック色名の編集 (1665 / 1636): 色ごとの名称 (半角 32 文字まで)
 * - デフォルト色に戻す(R) (1038) / Macデフォルト色に戻す(M) (1711)
 */
export function CheckColorEditor({ checkColors, onChange }: CheckColorEditorProps) {
  const [paletteTarget, setPaletteTarget] = useState<{ kind: 'display' | 'print'; color: number } | null>(
    null,
  );
  const [nameColor, setNameColor] = useState(1);

  const displayColors = checkColorPalette(checkColors.display);
  // 印刷色は未設定なら表示色を使う。
  const printColors =
    checkColors.print.length > 0 ? checkColorPalette(checkColors.print) : displayColors;
  const names = Array.from({ length: 9 }, (_, index) => checkColors.names[index] ?? '');

  const applyColor = (kind: 'display' | 'print', color: number, hex: string) => {
    const next = [...(kind === 'display' ? displayColors : printColors)];
    next[color - 1] = hex;
    onChange(kind === 'display' ? { display: next } : { print: next });
  };

  return (
    <div style={PAGE_STYLE}>
      {/* 実測: 編集するチェック色(S) (9,12) + コンボ 1702 (78,9,70,64) = 122px。 */}
      <div style={ROW_STYLE}>
        <span style={{ whiteSpace: 'nowrap' }}>編集するチェック色(S) :</span>
        <Dropdown
          aria-label="編集するチェック色"
          data-ctrl-id={1702}
          data-testid="preferences-color-target"
          style={{ width: 122, minWidth: 0 }}
          options={[
            { value: 'standard', label: '標準の設定値' },
            { value: 'current', label: '現在のチェックリスト' },
          ]}
          value={checkColors.editTarget}
          onChange={(event) =>
            onChange({ editTarget: event.target.value as CheckColorSettings['editTarget'] })
          }
        />
      </div>
      <GroupBox legend="色の編集(C)" style={{ ...GROUP_STYLE, height: 109 }}>
        <div style={LABEL_ROW_STYLE} data-testid="check-color-labels">
          {/* 「表示色 :」と同じ幅のスペーサで、見出しを色のボタンの真上に揃える。 */}
          <span style={COLOR_LABEL_STYLE} />
          {CHECK_COLOR_IDS.map((color) => (
            <span key={color} style={COLOR_CELL_STYLE}>
              {`色${color}`}
            </span>
          ))}
        </div>
        <div style={SWATCH_ROWS_STYLE}>
          <div style={SWATCH_ROW_STYLE} data-testid="check-color-display-row">
            <span style={COLOR_LABEL_STYLE}>表示色 :</span>
            {CHECK_COLOR_IDS.map((color) => (
              <div key={color} style={COLOR_CELL_STYLE}>
                <Button
                  type="button"
                  data-ctrl-id={1019 + color}
                  data-testid={`display-color-${color}`}
                  aria-label={`表示色${color}`}
                  title={`色${color}`}
                  style={{ ...SWATCH_STYLE, background: displayColors[color - 1] }}
                  onClick={() => setPaletteTarget({ kind: 'display', color })}
                />
              </div>
            ))}
          </div>
          <div style={SWATCH_ROW_STYLE} data-testid="check-color-print-row">
            <span style={COLOR_LABEL_STYLE}>印刷色 :</span>
            {CHECK_COLOR_IDS.map((color) => (
              <div key={color} style={COLOR_CELL_STYLE}>
                <Button
                  type="button"
                  data-ctrl-id={1028 + color}
                  data-testid={`print-color-${color}`}
                  aria-label={`印刷色${color}`}
                  title={`色${color}`}
                  style={{ ...SWATCH_STYLE, background: printColors[color - 1] }}
                  onClick={() => setPaletteTarget({ kind: 'print', color })}
                />
              </div>
            ))}
          </div>
        </div>
      </GroupBox>
      <GroupBox legend="チェック色名の編集(E)" style={{ ...NAME_GROUP_STYLE, height: 67 }}>
        <div style={ROW_STYLE}>
          <Dropdown
            aria-label="名称を編集する色"
            data-ctrl-id={1665}
            data-testid="preferences-color-name-target"
            options={CHECK_COLOR_IDS.map((color) => ({ value: String(color), label: `色${color}` }))}
            value={String(nameColor)}
            onChange={(event) => setNameColor(Number(event.target.value))}
          />
          <span>名称(N) :</span>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <TextBox
              aria-label="色の名称"
              data-ctrl-id={1636}
              data-testid="preferences-color-name"
              style={{ flex: '1 1 auto', minWidth: 0 }}
              maxLength={32}
              value={names[nameColor - 1]}
              onChange={(event) => {
                const next = [...names];
                next[nameColor - 1] = event.target.value;
                onChange({ names: next });
              }}
            />
          </div>
        </div>
      </GroupBox>
      <div style={BUTTON_ROW_STYLE}>
        <Button
          data-ctrl-id={1038}
          data-testid="preferences-color-reset"
          style={TEXT_BUTTON_STYLE}
          onClick={() => onChange({ display: [], print: [], names: [] })}
        >
          デフォルト色に戻す(R)
        </Button>
        <Button
          data-ctrl-id={1711}
          data-testid="preferences-color-mac-reset"
          style={TEXT_BUTTON_STYLE}
          // Web 版には Mac 版の既定色が無いので、標準の設定値を編集中は使えない
          // (現在のチェックリスト編集中は CHM どおり標準の設定値に戻すので使える)。
          disabled={checkColors.editTarget === 'standard'}
          title={
            checkColors.editTarget === 'standard'
              ? 'Web 版に Mac 版の既定色が無いため使えません'
              : '標準の設定値に戻します'
          }
          onClick={() => onChange({ display: [], print: [], names: [] })}
        >
          Macデフォルト色に戻す(M)
        </Button>
      </div>
      {paletteTarget === null ? null : (
        <ColorPaletteDialog
          colorNo={paletteTarget.color}
          value={(paletteTarget.kind === 'display' ? displayColors : printColors)[paletteTarget.color - 1]}
          onSelect={(hex) => applyColor(paletteTarget.kind, paletteTarget.color, hex)}
          onClose={() => setPaletteTarget(null)}
        />
      )}
    </div>
  );
}
