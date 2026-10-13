import type { CSSProperties } from 'react';
import { Button, Checkbox, GroupBox, OptionButton, Window } from '@megablacklabel/react98retro';
import type { GoogleSearchSettings } from '../../domain/app-settings';

export type GoogleSearchDialogProps = {
  /** 現在の Google 検索設定。各コントロールの状態に使う。 */
  settings: GoogleSearchSettings;
  /** ラジオ / チェックボックスの変更ごとに、その項目だけの patch で呼ばれる。 */
  onChange: (patch: Partial<GoogleSearchSettings>) => void;
  /** 「閉じる」。 */
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
  padding: 4,
  overflow: 'auto',
  flex: '1 1 auto',
  minHeight: 0,
};

/** 検索条件のラジオボタンの縦並び。 */
const CHOICE_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

/** カスタム設定のときだけ出す項目 / 条件のブロック。 */
const CUSTOM_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginTop: 4,
  marginLeft: 26,
};

/** 項目チェックボックスと条件ラジオの横並び。 */
const CUSTOM_ROW_STYLE: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  columnGap: 10,
  rowGap: 2,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/**
 * Google 検索設定 (ダイアログ 212)。元実装の 1693〜1695 はドロップダウンだが、
 * Web 版では項目をチェックボックス、条件を AND / OR のラジオボタンで表現する。
 */
export function GoogleSearchDialog({
  settings,
  onChange,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: GoogleSearchDialogProps) {
  return (
    <Window
      data-testid="google-search-dialog"
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
        <GroupBox legend="検索条件">
          <div style={CHOICE_COLUMN_STYLE}>
            <OptionButton
              id="google-search-mode-either"
              name="google-search-mode"
              data-ctrl-id={1690}
              label="『サークル名』と『執筆者名』のいずれかを含む"
              checked={settings.mode === 'either'}
              onChange={() => onChange({ mode: 'either' })}
            />
            <OptionButton
              id="google-search-mode-both"
              name="google-search-mode"
              data-ctrl-id={1691}
              label="『サークル名』と『執筆者名』の両方を含む"
              checked={settings.mode === 'both'}
              onChange={() => onChange({ mode: 'both' })}
            />
            <OptionButton
              id="google-search-mode-custom"
              name="google-search-mode"
              data-ctrl-id={1692}
              label="カスタム設定"
              checked={settings.mode === 'custom'}
              onChange={() => onChange({ mode: 'custom' })}
            />
          </div>
          {settings.mode === 'custom' ? (
            <div style={CUSTOM_STYLE}>
              <div style={CUSTOM_ROW_STYLE}>
                <Checkbox
                  id="google-search-field-circleName"
                  label="サークル名"
                  checked={settings.fields.circleName}
                  onChange={(event) =>
                    onChange({
                      fields: { ...settings.fields, circleName: event.target.checked },
                    })
                  }
                />
                <Checkbox
                  id="google-search-field-circleKana"
                  label="読みがな"
                  checked={settings.fields.circleKana}
                  onChange={(event) =>
                    onChange({
                      fields: { ...settings.fields, circleKana: event.target.checked },
                    })
                  }
                />
                <Checkbox
                  id="google-search-field-penName"
                  label="執筆者名"
                  checked={settings.fields.penName}
                  onChange={(event) =>
                    onChange({
                      fields: { ...settings.fields, penName: event.target.checked },
                    })
                  }
                />
                <Checkbox
                  id="google-search-field-bookName"
                  label="発行誌名"
                  checked={settings.fields.bookName}
                  onChange={(event) =>
                    onChange({
                      fields: { ...settings.fields, bookName: event.target.checked },
                    })
                  }
                />
              </div>
              <div style={CUSTOM_ROW_STYLE}>
                <OptionButton
                  id="google-search-condition-and"
                  name="google-search-condition"
                  label="両方を含む"
                  checked={settings.andMode}
                  onChange={() => onChange({ andMode: true })}
                />
                <OptionButton
                  id="google-search-condition-or"
                  name="google-search-condition"
                  label="いずれかを含む"
                  checked={!settings.andMode}
                  onChange={() => onChange({ andMode: false })}
                />
              </div>
            </div>
          ) : null}
        </GroupBox>
        <div style={BUTTON_ROW_STYLE}>
          <Button
            variant="default"
            data-testid="google-search-close"
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
