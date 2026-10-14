import { useState, type CSSProperties } from 'react';
import { Button, Checkbox, GroupBox, OptionButton, Tabs, TextBox, Window } from '@megablacklabel/react98retro';
import type {
  AppSettings,
  CheckColorSettings,
  ImagePathSettings,
  ListColumnKey,
  ListDisplaySettings,
} from '../../domain/app-settings';
import { DEFAULT_LIST_DISPLAY_SETTINGS, LIST_COLUMN_LABELS } from '../../domain/app-settings';
import { CheckColorEditor } from '../checklist/CheckColorEditor';

export type PreferencesDialogProps = {
  /** 動作オプション (元ダイアログ 150)。 */
  settings: AppSettings;
  /** 画像データパス (元ダイアログ 191)。 */
  imagePath: ImagePathSettings;
  /** リスト表示 (元ダイアログ 210)。 */
  listDisplay: ListDisplaySettings;
  /** 色の設定 (元ダイアログ 149)。 */
  checkColors: CheckColorSettings;
  /** 動作オプションの変更 (チェック / ラジオごとの patch)。 */
  onChange: (patch: Partial<AppSettings>) => void;
  onImagePathChange: (patch: Partial<ImagePathSettings>) => void;
  onListDisplayChange: (patch: Partial<ListDisplaySettings>) => void;
  onCheckColorsChange: (patch: Partial<CheckColorSettings>) => void;
  /** 動作オプションの「設定を初期化」(1720)。 */
  onReset: () => void;
  onClose: () => void;
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  zIndex?: number;
};

/**
 * 動作設定 (元実装のプロパティシート)。CHM 5CONFIG/1CONFIG.HTM:
 * 「動作設定ダイアログは、プロパティシート式になっており、以下のグループ（ページ）に分かれています。
 *  ① 動作オプション ② 画像データパス ③ リスト表示 ④ 色の設定」
 *
 * ウィンドウの寸法は実測 (`解析/UI-SPEC.md` 6.1: 動作設定 (101,5) 439 x 670) に合わせる。
 */
const TABS = [
  { id: 'option', label: '動作オプション' },
  { id: 'imagePath', label: '画像データパス' },
  { id: 'list', label: 'リスト表示' },
  { id: 'colors', label: '色の設定' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
  padding: 6,
  fontSize: 12,
};

/** チェックボックス / ラジオボタンの縦並び。 */
const CHOICE_COLUMN_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const FIELD_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  paddingLeft: 18,
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/** 文字ボタン。狭い行に置いても文字が折り返さないようにする (高さは 98.css のまま)。 */
const TEXT_BUTTON_STYLE: CSSProperties = {
  flex: '0 0 auto',
  whiteSpace: 'nowrap',
};

/** ページ下部の行 (説明文 + ボタン)。 */
const FOOTER_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: 8,
  flex: '0 0 auto',
};

const NOTE_STYLE: CSSProperties = {
  margin: 0,
  color: '#404040',
  // 元実装の静的テキストは 2 行の決め打ち (改行の位置も合わせる)。
  whiteSpace: 'nowrap',
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

/** 動作オプション (ページ① 元ダイアログ 150)。 */
function OptionPage({
  settings,
  onChange,
  onReset,
}: {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => void;
  onReset: () => void;
}) {
  return (
    <>
      <GroupBox legend="画面の掴みスクロールの方式">
        <div style={CHOICE_COLUMN_STYLE}>
          <OptionButton
            id="preferences-scroll-adobe"
            data-ctrl-id={1023}
            name="preferences-scroll"
            label="Adobe方式 （スペースキーを押しながらマウスドラッグ）"
            checked={settings.scrollMode === 'adobe'}
            onChange={() => onChange({ scrollMode: 'adobe' })}
          />
          <OptionButton
            id="preferences-scroll-ie"
            data-ctrl-id={1025}
            name="preferences-scroll"
            label="IE方式 （ホイールクリックでスクロールロック）"
            checked={settings.scrollMode === 'ie'}
            onChange={() => onChange({ scrollMode: 'ie' })}
          />
          <OptionButton
            id="preferences-scroll-drag"
            data-ctrl-id={1027}
            name="preferences-scroll"
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
        <Button
          data-testid="preferences-reset"
          data-ctrl-id={1720}
          style={TEXT_BUTTON_STYLE}
          onClick={onReset}
        >
          設定を初期化
        </Button>
      </div>
    </>
  );
}

/** 画像データパス (ページ② 元ダイアログ 191 パス設定)。 */
function ImagePathPage({
  imagePath,
  onChange,
}: {
  imagePath: ImagePathSettings;
  onChange: (patch: Partial<ImagePathSettings>) => void;
}) {
  return (
    <>
      <GroupBox legend="画像データパス">
        <div style={CHOICE_COLUMN_STYLE}>
          <OptionButton
            id="preferences-image-auto"
            data-ctrl-id={1612}
            name="preferences-image"
            label="自動検索する"
            checked={imagePath.autoSearch}
            onChange={() => onChange({ autoSearch: true })}
          />
          <OptionButton
            id="preferences-image-manual"
            data-ctrl-id={1613}
            name="preferences-image"
            label="指定場所から読み込む"
            checked={!imagePath.autoSearch}
            onChange={() => onChange({ autoSearch: false })}
          />
          <div style={FIELD_ROW_STYLE}>
            <span>場所 :</span>
            <TextBox
              aria-label="画像データの場所"
              data-ctrl-id={1614}
              style={{ flex: '1 1 auto' }}
              value={imagePath.basePath}
              disabled={imagePath.autoSearch}
              onChange={(event) => onChange({ basePath: event.target.value })}
            />
            <Button disabled title="Web 版ではフォルダを参照できません (URL を直接入力)" data-ctrl-id={1616}>
              参照...
            </Button>
          </div>
        </div>
      </GroupBox>
      <GroupBox legend="ブラウザ指定">
        <div style={CHOICE_COLUMN_STYLE}>
          <OptionButton
            id="preferences-browser-default"
            data-ctrl-id={1730}
            name="preferences-browser"
            label="標準"
            checked={imagePath.useDefaultBrowser}
            onChange={() => onChange({ useDefaultBrowser: true })}
          />
          <OptionButton
            id="preferences-browser-custom"
            data-ctrl-id={1731}
            name="preferences-browser"
            label="ブラウザを指定"
            checked={!imagePath.useDefaultBrowser}
            onChange={() => onChange({ useDefaultBrowser: false })}
          />
          <div style={FIELD_ROW_STYLE}>
            <span>場所 :</span>
            <TextBox
              aria-label="ブラウザの場所"
              data-ctrl-id={1733}
              style={{ flex: '1 1 auto' }}
              value={imagePath.browserPath}
              disabled={imagePath.useDefaultBrowser}
              onChange={(event) => onChange({ browserPath: event.target.value })}
            />
            <Button disabled title="Web 版では実行ファイルを参照できません" data-ctrl-id={1734}>
              参照...
            </Button>
          </div>
        </div>
      </GroupBox>
      <p style={NOTE_STYLE}>
        ※ Web 版は画像データとブラウザの場所を URL / パスとして使い、フォルダ・実行ファイルの参照はできません。
      </p>
    </>
  );
}

/** リスト表示 (ページ③ 元ダイアログ 210)。列の表示と並び (上が左の列)。 */
function ListPage({
  listDisplay,
  onChange,
}: {
  listDisplay: ListDisplaySettings;
  onChange: (patch: Partial<ListDisplaySettings>) => void;
}) {
  return (
    <>
      <div style={{ display: 'flex', gap: 8, flex: '1 1 auto', minHeight: 0 }}>
        <ColumnList
          legend="チェックリスト 表示項目"
          controlId={1694}
          prevLabel="前へ移動"
          prevControlId={1695}
          nextLabel="後へ移動"
          nextControlId={1696}
          keys={DEFAULT_LIST_DISPLAY_SETTINGS.checklist}
          visible={listDisplay.checklist}
          onChange={(next) => onChange({ checklist: next })}
        />
        <ColumnList
          legend="サークル一覧 表示項目"
          controlId={1697}
          prevLabel="前へ移動"
          prevControlId={1698}
          nextLabel="後へ移動"
          nextControlId={1699}
          keys={DEFAULT_LIST_DISPLAY_SETTINGS.list}
          visible={listDisplay.list}
          onChange={(next) => onChange({ list: next })}
        />
      </div>
      <div style={FOOTER_ROW_STYLE}>
        {/* 元実装の静的テキスト (14,213) 217 x 27 = 2 行。改行の位置も実物に合わせる。 */}
        <p data-testid="preferences-list-note" style={NOTE_STYLE}>
          ※ 「サークル名」を非表示にすることは
          <br />
          できません.
        </p>
        <Button
          data-ctrl-id={1700}
          data-testid="preferences-list-default"
          style={TEXT_BUTTON_STYLE}
          onClick={() => onChange({ ...DEFAULT_LIST_DISPLAY_SETTINGS })}
        >
          デフォルトに戻す
        </Button>
      </div>
    </>
  );
}

/** 列の表示項目リスト 1 本 (チェックで表示 / 前へ・後へで並び替え)。 */
function ColumnList({
  legend,
  controlId,
  prevLabel,
  prevControlId,
  nextLabel,
  nextControlId,
  keys,
  visible,
  onChange,
}: {
  legend: string;
  controlId: number;
  prevLabel: string;
  prevControlId: number;
  nextLabel: string;
  nextControlId: number;
  /** 選べる列 (既定の並び)。 */
  keys: readonly ListColumnKey[];
  /** 表示中の列 (表示順)。 */
  visible: readonly ListColumnKey[];
  onChange: (next: ListColumnKey[]) => void;
}) {
  const [selected, setSelected] = useState<ListColumnKey | null>(null);
  const index = selected === null ? -1 : visible.indexOf(selected);
  // 一覧は「表示中の列 (表示順) → チェックの外れた列」の順に描く。
  // こうしないと、前へ / 後へ移動で visible を並べ替えても表示が変わらない。
  const ordered = [...visible, ...keys.filter((key) => !visible.includes(key))];

  const move = (delta: number) => {
    const target = index + delta;
    if (index < 0 || target < 0 || target >= visible.length) return;
    const next = [...visible];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <GroupBox legend={legend} style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div data-ctrl-id={controlId} style={{ ...CHOICE_COLUMN_STYLE, flex: '1 1 auto', overflow: 'auto' }}>
        {ordered.map((key) => (
          <div
            key={key}
            data-testid={`column-row-${key}`}
            // 行のクリックで選ぶ (チェックボックスの入れ外しとは別。実物のリストボックスと同じ)。
            onClick={() => setSelected(key)}
            style={{ ...ROW_STYLE, background: key === selected ? '#000080' : undefined }}
          >
            <Checkbox
              id={`preferences-column-${key}`}
              label={LIST_COLUMN_LABELS[key]}
              checked={visible.includes(key)}
              //「サークル名」は非表示にできない (5LIST.HTM)。
              disabled={key === 'name'}
              onChange={(event) => {
                setSelected(key);
                onChange(
                  event.target.checked
                    ? [...visible, key]
                    : visible.filter((candidate) => candidate !== key),
                );
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ ...BUTTON_ROW_STYLE, justifyContent: 'flex-start' }}>
        <Button
          data-ctrl-id={prevControlId}
          style={TEXT_BUTTON_STYLE}
          disabled={index <= 0}
          onClick={() => move(-1)}
        >
          {prevLabel}
        </Button>
        <Button
          data-ctrl-id={nextControlId}
          style={TEXT_BUTTON_STYLE}
          disabled={index < 0 || index >= visible.length - 1}
          onClick={() => move(1)}
        >
          {nextLabel}
        </Button>
      </div>
    </GroupBox>
  );
}

/** 動作設定 (プロパティシート)。 */
export function PreferencesDialog({
  settings,
  imagePath,
  listDisplay,
  checkColors,
  onChange,
  onImagePathChange,
  onListDisplayChange,
  onCheckColorsChange,
  onReset,
  onClose,
  initialX = 210,
  initialY = 30,
  // 実測 (`解析/UI-SPEC.md` 6.1) の 動作設定 439 x 670。幅は、動作オプションの長いラベル
  // (「選択サークルのブロックが変わった際にサークル一覧の表示も追従する」) が折り返さないよう
  // 少し広げている。
  width = 487,
  height = 670,
  zIndex,
}: PreferencesDialogProps) {
  const [tab, setTab] = useState<TabId>('option');

  const pages: Record<TabId, React.ReactNode> = {
    option: <OptionPage settings={settings} onChange={onChange} onReset={onReset} />,
    imagePath: <ImagePathPage imagePath={imagePath} onChange={onImagePathChange} />,
    list: <ListPage listDisplay={listDisplay} onChange={onListDisplayChange} />,
    colors: <CheckColorEditor checkColors={checkColors} onChange={onCheckColorsChange} />,
  };

  return (
    <Window
      data-testid="preferences-dialog"
      title="動作設定"
      modal
      onClose={onClose}
      width={width}
      height={height}
      initialX={initialX}
      initialY={initialY}
      zIndex={zIndex}
    >
      <div style={BODY_STYLE}>
        <Tabs
          tabs={TABS.map((item) => ({ id: item.id, label: item.label, content: pages[item.id] }))}
          activeTab={tab}
          onTabChange={(id) => setTab(id as TabId)}
          fill
          style={{ flex: '1 1 auto', minHeight: 0 }}
          panelClassName="preferences-page"
        />
        <div style={{ ...BUTTON_ROW_STYLE, paddingTop: 4 }}>
          <Button variant="default" data-testid="preferences-close" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </Window>
  );
}
