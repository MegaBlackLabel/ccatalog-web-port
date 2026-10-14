import { useState, type CSSProperties } from 'react';
import { Button, Checkbox, Dropdown, GroupBox, OptionButton, TextBox, Window } from '@megablacklabel/react98retro';

/** ダイアログ 197 の 出力ファイル形式 (元実装はコンボボックス 1751)。 */
export type ImageFormat = 'bmp' | 'png' | 'jpg';

/** ダイアログ 197 の 出力形式 (ラジオ 1046 / 1048 / 1049 / 1053)。 */
export type ImageOutputFormat = 'list' | 'cut' | 'map' | 'blankMap';

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
  /** ページ指定の文字列 (1637)。例 "1, 3-5"。 */
  pageSpec: string;
  /** 出力形式 (1046 / 1048 / 1049 / 1053)。 */
  outputFormat: ImageOutputFormat;
  /** GDI+を使用しないで印刷 (1042)。 */
  noGdiPlus: boolean;
};

export type ImageFileOutputDialogProps = ImageOutputSettings & {
  /** 有効なページ番号の上限 (「（有効範囲 : 1-N）」に出す)。 */
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
  /** 閉じる(&X) / キャンセル (2)。 */
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

/**
 * 出力形式 4 つの説明 (元実装の静的テキスト 1050。文言は exe の文字列から)。
 * 選んだ形式に合わせて入れ替わる。
 */
const OUTPUT_FORMAT_DESCRIPTIONS: Record<ImageOutputFormat, string> = {
  list: 'チェックリストに登録されているサークルを、画像なしの一覧表形式で印刷します。',
  cut: 'チェックリストに登録されているサークルを、サークルカット画像付きで印刷します。',
  map: 'マップを、チェックリストに登録されているサークルの配置情報と共に印刷します。',
  blankMap: 'マップのみを印刷します。',
};

/** 出力形式のラジオ (1046 / 1048 / 1049 / 1053)。 */
const OUTPUT_FORMATS: readonly { value: ImageOutputFormat; controlId: number; label: string }[] = [
  { value: 'list', controlId: 1046, label: 'サークルリスト印刷' },
  { value: 'cut', controlId: 1048, label: 'サークルカット印刷' },
  { value: 'map', controlId: 1049, label: 'マップ印刷' },
  { value: 'blankMap', controlId: 1053, label: '白地図印刷' },
];

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: 2,
  flex: '1 1 auto',
  minHeight: 0,
  // 405px に収まらない環境でも重ならないようにスクロールさせる。
  overflow: 'auto',
  fontSize: 12,
};

const GROUP_BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  padding: '0 6px 2px',
};

/**
 * 元実装のグループ枠 (fieldset) はコントロールの位置がそのまま入る詰めた枠なので、
 * ライブラリの既定の余白を外して中身の高さに合わせる。
 */
const GROUP_STYLE: CSSProperties = {
  flex: '0 0 auto',
  padding: '2px 4px 4px',
  margin: 0,
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

/** ラベルの幅を実物 (102) に揃えて、Edit の左端をそろえる。 */
const LABEL_STYLE: CSSProperties = { flex: '0 0 102px' };

const SPACER_STYLE: CSSProperties = { flex: '1 1 auto' };

const NOTE_STYLE: CSSProperties = { color: '#404040', paddingLeft: 108 };

const OUTPUT_FORMAT_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 12,
};

const CHOICE_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  flex: '0 0 165px',
};

const DESCRIPTION_STYLE: CSSProperties = {
  minHeight: 22,
  paddingBottom: 2,
};

const TEXT_BUTTON_STYLE: CSSProperties = {
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 8,
  marginTop: 'auto',
  flex: '0 0 auto',
};

/**
 * 長辺のサイズを解釈する。0 (原寸) 〜9999 の整数なら返し、範囲外と数値でない入力は
 * undefined (呼び出し側で無視する)。元実装の注意書きは「0, 1〜9999」。
 */
function parseLongSide(raw: string): number | undefined {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 9999) return undefined;
  return parsed;
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
  // 実測 (`解析/UI-SPEC.md` ダイアログ 197: 508 x 405)。
  width = 508,
  height = 405,
  zIndex,
}: ImageFileOutputDialogProps) {
  // 長辺のサイズは編集中の文字列をそのまま持つ (範囲外・数値でない入力は onChange に出さない)。
  const [longSideDraft, setLongSideDraft] = useState(String(longSide));

  const changeLongSide = (raw: string) => {
    setLongSideDraft(raw);
    const parsed = parseLongSide(raw);
    if (parsed !== undefined) onChange({ longSide: parsed });
  };

  return (
    <Window
      data-testid="image-output-dialog"
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
        <GroupBox data-ctrl-id={1075} legend="画像出力" style={GROUP_STYLE}>
          <div style={GROUP_BODY_STYLE}>
            <div style={ROW_STYLE}>
              <span style={LABEL_STYLE}>出力パス :</span>
              <TextBox
                id="image-output-directory"
                data-ctrl-id={1630}
                data-testid="image-output-directory"
                style={{ flex: '1 1 auto', minWidth: 0 }}
                value={directory}
                onChange={(event) => onChange({ directory: event.target.value })}
              />
              <Button
                data-ctrl-id={1631}
                style={TEXT_BUTTON_STYLE}
                disabled
                title="Web 版ではフォルダを参照できません (パスを直接入力)"
              >
                参照...
              </Button>
            </div>
            <div style={ROW_STYLE}>
              <span style={LABEL_STYLE}>出力ファイル名 :</span>
              <TextBox
                id="image-output-name"
                data-ctrl-id={1632}
                data-testid="image-output-name"
                style={{ flex: '0 0 90px' }}
                value={baseName}
                onChange={(event) => onChange({ baseName: event.target.value })}
              />
              <span style={SPACER_STYLE} />
              <span>出力ファイル形式 :</span>
              <Dropdown
                aria-label="出力ファイル形式"
                data-ctrl-id={1751}
                data-testid="image-output-format"
                style={{ flex: '0 0 90px' }}
                options={FORMATS.map((item) => ({ value: item.value, label: item.label }))}
                value={format}
                onChange={(event) => onChange({ format: event.target.value as ImageFormat })}
              />
            </div>
            <div data-ctrl-id={1752} data-testid="image-output-note" style={NOTE_STYLE}>
              {`※ ページ番号と拡張子".${format}"が付加されます。`}
            </div>
            <div style={ROW_STYLE}>
              <span style={LABEL_STYLE}>長辺のサイズ :</span>
              <TextBox
                id="image-output-long-side"
                data-ctrl-id={1633}
                data-testid="image-output-long-side"
                style={{ flex: '0 0 52px' }}
                inputMode="numeric"
                value={longSideDraft}
                onChange={(event) => changeLongSide(event.target.value)}
              />
              <span>ピクセル (0, 1〜9999)</span>
            </div>
            <div style={NOTE_STYLE}>※ 0を指定すると、原寸で出力します。</div>
          </div>
        </GroupBox>

        <GroupBox data-ctrl-id={1072} legend="出力範囲" style={GROUP_STYLE}>
          <div style={GROUP_BODY_STYLE}>
            <OptionButton
              id="image-output-range-all"
              data-ctrl-id={1056}
              name="image-output-range"
              label="すべて"
              checked={allPages}
              onChange={() => onChange({ allPages: true })}
            />
            <div style={ROW_STYLE}>
              <OptionButton
                id="image-output-range-pages"
                data-ctrl-id={1058}
                name="image-output-range"
                label="ページ指定 :"
                checked={!allPages}
                onChange={() => onChange({ allPages: false })}
              />
              <TextBox
                id="image-output-pages"
                data-ctrl-id={1637}
                data-testid="image-output-pages"
                style={{ flex: '0 0 112px' }}
                disabled={allPages}
                value={pageSpec}
                onChange={(event) => onChange({ pageSpec: event.target.value })}
              />
              <span data-ctrl-id={1639}>{`（有効範囲 : 1-${maxPage}）`}</span>
            </div>
            <div style={NOTE_STYLE}>
              ページ番号・範囲を、コンマ区切りで入力してください （例 : 1, 3-5）
            </div>
          </div>
        </GroupBox>

        {/* 元実装の 90px を確保する (中身が切れないように)。 */}
        <GroupBox legend="出力形式" style={{ ...GROUP_STYLE, minHeight: 86 }}>
          <div style={OUTPUT_FORMAT_ROW_STYLE}>
            <div style={CHOICE_COLUMN_STYLE}>
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
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <div data-ctrl-id={1050} style={DESCRIPTION_STYLE}>
                {OUTPUT_FORMAT_DESCRIPTIONS[outputFormat]}
              </div>
              <Checkbox
                id="image-output-no-gdiplus"
                data-ctrl-id={1042}
                data-testid="image-output-no-gdiplus"
                label="GDI+を使用しないで印刷"
                checked={noGdiPlus}
                onChange={(event) => onChange({ noGdiPlus: event.target.checked })}
              />
              <div style={{ ...ROW_STYLE, justifyContent: 'flex-end', paddingTop: 4 }}>
                <Button data-ctrl-id={1051} data-testid="image-output-details" style={TEXT_BUTTON_STYLE} onClick={onOpenDetails}>
                  詳細設定...
                </Button>
              </div>
            </div>
          </div>
        </GroupBox>

        <div style={ROW_STYLE}>
          <Checkbox
            id="image-output-high-resolution"
            data-ctrl-id={1705}
            data-testid="image-output-high-resolution"
            label="高解像度で出力"
            checked={highResolution}
            onChange={(event) => onChange({ highResolution: event.target.checked })}
          />
          <Button data-ctrl-id={1646} data-testid="image-output-help" style={TEXT_BUTTON_STYLE} onClick={onHelp}>
            説明...
          </Button>
        </div>

        <div style={BUTTON_ROW_STYLE}>
          <Button variant="default" data-ctrl-id={1} data-testid="image-output-submit" onClick={onOutput}>
            OK
          </Button>
          <Button data-ctrl-id={2} data-testid="image-output-cancel" onClick={onClose}>
            キャンセル
          </Button>
          <Button data-ctrl-id={1052} data-testid="image-output-preview" onClick={onPreview}>
            プレビュー
          </Button>
        </div>
      </div>
    </Window>
  );
}
