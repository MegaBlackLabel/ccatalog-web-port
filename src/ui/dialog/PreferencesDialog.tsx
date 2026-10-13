import type { CSSProperties } from 'react';
import { Button, Checkbox, GroupBox, OptionButton, Window } from '@megablacklabel/react98retro';
import type { AppSettings } from '../../domain/app-settings';

export type PreferencesDialogProps = {
  /** 現在の動作オプション。各コントロールの状態に使う。 */
  settings: AppSettings;
  /** チェック / ラジオの変更ごとに、その項目だけの patch で呼ばれる。 */
  onChange: (patch: Partial<AppSettings>) => void;
  /** 「設定を初期化」(1720)。 */
  onReset: () => void;
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

/** チェックボックス / ラジオボタンの縦並び。 */
const CHOICE_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

type PreferenceCheckProps = {
  /** 元実装のコントロール ID (1021 など)。 */
  controlId: number;
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
};

/** 動作オプションのチェックボックス 1 個。DOM の id もコントロール ID から作る。 */
function PreferenceCheck({ controlId, label, checked, onToggle }: PreferenceCheckProps) {
  return (
    <Checkbox
      id={`preferences-check-${controlId}`}
      data-ctrl-id={controlId}
      label={label}
      checked={checked}
      onChange={(event) => onToggle(event.target.checked)}
    />
  );
}

/** 動作オプション (ダイアログ 150)。変更はその場で patch として親に渡す。 */
export function PreferencesDialog({
  settings,
  onChange,
  onReset,
  onClose,
  initialX = 300,
  initialY = 200,
  width = 360,
  height = 260,
  zIndex,
}: PreferencesDialogProps) {
  return (
    <Window
      data-testid="preferences-dialog"
      title="動作オプション"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <GroupBox legend="画面の掴みスクロールの方式">
          <div style={CHOICE_COLUMN_STYLE}>
            <OptionButton
              id="preferences-scroll-adobe"
              name="preferences-scroll-mode"
              data-ctrl-id={1023}
              label="Adobe方式 （スペースキーを押しながらマウスドラッグ）"
              checked={settings.scrollMode === 'adobe'}
              onChange={() => onChange({ scrollMode: 'adobe' })}
            />
            <OptionButton
              id="preferences-scroll-ie"
              name="preferences-scroll-mode"
              data-ctrl-id={1025}
              label="IE方式 （ホイールクリックでスクロールロック）"
              checked={settings.scrollMode === 'ie'}
              onChange={() => onChange({ scrollMode: 'ie' })}
            />
            <OptionButton
              id="preferences-scroll-drag"
              name="preferences-scroll-mode"
              data-ctrl-id={1027}
              label="マウスドラッグのみで掴みスクロール"
              checked={settings.scrollMode === 'drag'}
              onChange={() => onChange({ scrollMode: 'drag' })}
            />
          </div>
        </GroupBox>
        <GroupBox legend="カーソル移動">
          <div style={CHOICE_COLUMN_STYLE}>
            <PreferenceCheck
              controlId={1021}
              label="リターンキーでチェック時、カーソルを自動で次のサークルに移動"
              checked={settings.enterMovesCursor}
              onToggle={(checked) => onChange({ enterMovesCursor: checked })}
            />
            <PreferenceCheck
              controlId={1029}
              label="テンキーでチェック時、カーソルを自動で次のサークルに移動"
              checked={settings.tenkeyMovesCursor}
              onToggle={(checked) => onChange({ tenkeyMovesCursor: checked })}
            />
            <PreferenceCheck
              controlId={1710}
              label="ページ変更時に常に左上のサークルカットにカーソルを合わせる"
              checked={settings.cursorToTopLeftOnPageChange}
              onToggle={(checked) => onChange({ cursorToTopLeftOnPageChange: checked })}
            />
            <PreferenceCheck
              controlId={1024}
              label="選択カーソルをマウスカーソルに追従する"
              checked={settings.cursorFollowsMouse}
              onToggle={(checked) => onChange({ cursorFollowsMouse: checked })}
            />
            <PreferenceCheck
              controlId={1022}
              label="選択サークルのブロックが変わった際にサークル一覧の表示も追従する"
              checked={settings.listFollowsBlock}
              onToggle={(checked) => onChange({ listFollowsBlock: checked })}
            />
          </div>
        </GroupBox>
        <GroupBox legend="データ読み込み">
          <div style={CHOICE_COLUMN_STYLE}>
            <PreferenceCheck
              controlId={1664}
              label="起動時に前回使用したチェックリストを自動的に読み込む"
              checked={settings.loadLastChecklistOnStart}
              onToggle={(checked) => onChange({ loadLastChecklistOnStart: checked })}
            />
            <PreferenceCheck
              controlId={1028}
              label="過去のチェックリスト読み込み時、サークル名チェックを厳密に行う"
              checked={settings.strictCircleNameCheck}
              onToggle={(checked) => onChange({ strictCircleNameCheck: checked })}
            />
            <PreferenceCheck
              controlId={1712}
              label="読み込み時にサークルメモを上書きする"
              checked={settings.overwriteMemoOnLoad}
              onToggle={(checked) => onChange({ overwriteMemoOnLoad: checked })}
            />
            <PreferenceCheck
              controlId={1713}
              label="読み込み時にチェック色情報を上書きする"
              checked={settings.overwriteColorOnLoad}
              onToggle={(checked) => onChange({ overwriteColorOnLoad: checked })}
            />
          </div>
        </GroupBox>
        <GroupBox legend="その他">
          <div style={CHOICE_COLUMN_STYLE}>
            <PreferenceCheck
              controlId={1714}
              label="個別窓のアイコン化を連動する"
              checked={settings.linkWindowIconify}
              onToggle={(checked) => onChange({ linkWindowIconify: checked })}
            />
            <PreferenceCheck
              controlId={1026}
              label="シングルクリックでチェックする"
              checked={settings.singleClickChecks}
              onToggle={(checked) => onChange({ singleClickChecks: checked })}
            />
            <PreferenceCheck
              controlId={1711}
              label="起動時に表紙画像を表示する"
              checked={settings.showCoverOnStart}
              onToggle={(checked) => onChange({ showCoverOnStart: checked })}
            />
          </div>
        </GroupBox>
        <div style={BUTTON_ROW_STYLE}>
          <Button data-testid="preferences-reset" data-ctrl-id={1720} onClick={onReset}>
            設定を初期化
          </Button>
          <Button variant="default" data-testid="preferences-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
