import { useState, type CSSProperties } from 'react';
import { Button, Dropdown, GroupBox, OptionButton, Window } from '@megablacklabel/react98retro';
import type { GoogleSearchField, GoogleSearchSettings } from '../../domain/app-settings';
import { GOOGLE_SEARCH_FIELDS } from '../../domain/google-search';

export type GoogleSearchDialogProps = {
  /** 現在の Google 検索設定。各コントロールの状態に使う。 */
  settings: GoogleSearchSettings;
  /** OK を押したときに、確定した設定で呼ばれる。 */
  onChange: (patch: Partial<GoogleSearchSettings>) => void;
  /** キャンセル / 閉じる。 */
  onClose: () => void;
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 6,
  flex: '1 1 auto',
  minHeight: 0,
  fontSize: 12,
};

/** 検索条件のラジオボタンの縦並び。 */
const CHOICE_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

/** カスタム設定のときだけ出す項目 / 条件のブロック (実物は x=58 から始まる)。 */
const CUSTOM_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
  marginTop: 4,
  marginLeft: 46,
};

/** 「項目1 :」+ コンボ の 1 行 (実物の static 58 / コンボ 126 と同じ比率)。 */
const CUSTOM_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
};

const CUSTOM_LABEL_STYLE: CSSProperties = {
  flex: '0 0 65px',
  whiteSpace: 'nowrap',
};

const CUSTOM_SELECT_STYLE: CSSProperties = {
  flex: '0 0 auto',
  width: 102,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  // 実物は右寄せ (UI-SPEC ダイアログ 212: OK x=182 / キャンセル x=273 / ダイアログ幅 373 で、
  // 右端のキャンセルが 361 まで届く)。
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  paddingRight: 4,
  flex: '0 0 auto',
};

/**
 * Google 検索設定 (ダイアログ 212)。実物は
 *   検索条件 … 「いずれかを含む (&OR条件)」/「両方を含む (&AND条件)」/「カスタム (&C)」
 *   カスタムのときだけ、項目&1 / 項目&2 のコンボ 2 つと 条件(&D) のコンボを出す
 * で、下部は OK / キャンセル。編集は OK で確定し、キャンセルで捨てる。
 */
export function GoogleSearchDialog({
  settings,
  onChange,
  onClose,
  initialX = 300,
  initialY = 200,
  // 実物の資源寸法は 373 x 224 (UI-SPEC.md ダイアログ 212) だが、実物の実測は 451 x 238。
  // 幅は「一番長いラベルが折り返さない」ギリギリまで詰める: ラベル (ラジオ + テキスト) の
  // 自然幅は実測 351px、これに groupbox の内側余白 10px x2 とウィンドウ枠・本文余白 22px を
  // 足した 393px。高さはカスタムのコンボ 3 つを常に出しても OK / キャンセルが隠れない寸法。
  width = 393,
  height = 248,
  zIndex,
}: GoogleSearchDialogProps) {
  /** 編集中の値 (OK で親へ出すまで確定しない)。 */
  const [draft, setDraft] = useState(settings);

  const fieldOptions = GOOGLE_SEARCH_FIELDS.map((field) => (
    <option key={field.value} value={field.value}>
      {field.label}
    </option>
  ));

  return (
    <Window
      data-testid="google-search-dialog"
      // 実物のダイアログは × だけで、最小化/最大化のボタンもサイズ変更も持たない。
      minimizable={false}
      maximizable={false}
      resizable={false}
      title="Google検索設定"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox legend="検索条件" style={{ flex: '1 1 auto' }}>
          <div style={CHOICE_COLUMN_STYLE}>
            <OptionButton
              id="google-search-mode-either"
              name="google-search-mode"
              data-ctrl-id={1690}
              label="「サークル名」と「執筆者名」のいずれかを含む（OR条件）"
              checked={draft.mode === 'either'}
              onChange={() => setDraft((prev) => ({ ...prev, mode: 'either' }))}
            />
            <OptionButton
              id="google-search-mode-both"
              name="google-search-mode"
              data-ctrl-id={1691}
              label="「サークル名」と「執筆者名」の両方を含む（AND条件）"
              checked={draft.mode === 'both'}
              onChange={() => setDraft((prev) => ({ ...prev, mode: 'both' }))}
            />
            <OptionButton
              id="google-search-mode-custom"
              name="google-search-mode"
              data-ctrl-id={1692}
              label="カスタム（C）"
              checked={draft.mode === 'custom'}
              onChange={() => setDraft((prev) => ({ ...prev, mode: 'custom' }))}
            />
          </div>
          {/* コンボは常に出しておき、カスタム以外では押せない状態にする。 */}
          <div style={CUSTOM_STYLE}>
            <div style={CUSTOM_ROW_STYLE}>
              <span style={CUSTOM_LABEL_STYLE}>項目1 :</span>
              <Dropdown
                aria-label="項目1"
                data-ctrl-id={1693}
                data-testid="google-search-field-1"
                style={CUSTOM_SELECT_STYLE}
                disabled={draft.mode !== 'custom'}
                value={draft.field1}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    field1: event.target.value as GoogleSearchField,
                  }))
                }
              >
                {fieldOptions}
              </Dropdown>
            </div>
            <div style={CUSTOM_ROW_STYLE}>
              <span style={CUSTOM_LABEL_STYLE}>項目2 :</span>
              <Dropdown
                aria-label="項目2"
                data-ctrl-id={1694}
                data-testid="google-search-field-2"
                style={CUSTOM_SELECT_STYLE}
                disabled={draft.mode !== 'custom'}
                value={draft.field2}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    field2: event.target.value as GoogleSearchField,
                  }))
                }
              >
                {fieldOptions}
              </Dropdown>
            </div>
            <div style={CUSTOM_ROW_STYLE}>
              <span style={CUSTOM_LABEL_STYLE}>条件(D) :</span>
              <Dropdown
                aria-label="条件"
                data-ctrl-id={1695}
                data-testid="google-search-condition"
                style={CUSTOM_SELECT_STYLE}
                disabled={draft.mode !== 'custom'}
                value={draft.andMode ? 'and' : 'or'}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, andMode: event.target.value === 'and' }))
                }
              >
                <option value="and">両方を含む（AND）</option>
                <option value="or">いずれかを含む（OR）</option>
              </Dropdown>
            </div>
          </div>
        </GroupBox>
        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-testid="google-search-ok"
            data-ctrl-id={1}
            style={{ minWidth: 88 }}
            onClick={() => {
              onChange(draft);
              onClose();
            }}
          >
            OK
          </Button>
          <Button
            data-testid="google-search-cancel"
            data-ctrl-id={2}
            style={{ minWidth: 88 }}
            onClick={onClose}
          >
            キャンセル
          </Button>
        </div>
      </div>
    </Window>
  );
}
