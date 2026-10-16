import { useState, type CSSProperties } from 'react';
import { Button, Checkbox, GroupBox, OptionButton, Tabs, TextBox, Window } from '@megablacklabel/react98retro';
import type {
  AppSettings,
  CheckColorSettings,
  ImagePathSettings,
  ListColumnKey,
  ListDisplaySettings,
} from '../../domain/app-settings';
import {
  DEFAULT_APP_SETTINGS,
  DEFAULT_LIST_DISPLAY_SETTINGS,
  LIST_COLUMN_LABELS,
  LIST_COLUMN_ORDER,
} from '../../domain/app-settings';
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
  /** 動作オプションの「設定を初期化(D)」(1720)。 */
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
 * ページの大きさは実物の最大ページ (動作オプション 235x301 DLU) に合わせる。実測の換算は
 * x = 1.75 / y = 1.85 px/DLU (このプロパティシートのフォントは MS UI Gothic 9pt 相当で、
 * 実機キャプチャの 12 DLU ピッチ = 22px / 17 DLU のスウォッチ幅 = 30px から求めた)。
 */
const TABS = [
  { id: 'option', label: '動作オプション' },
  { id: 'imagePath', label: 'パス設定' },
  { id: 'list', label: 'リスト表示' },
  { id: 'colors', label: 'チェック色' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** 確定待ちの編集 (キーごとの patch)。「適用」の有効 / 無効と確定時の通知に使う。 */
type PendingEdits = {
  settings?: Partial<AppSettings>;
  imagePath?: Partial<ImagePathSettings>;
  listDisplay?: Partial<ListDisplaySettings>;
  checkColors?: Partial<CheckColorSettings>;
};

const BODY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 auto',
  minHeight: 0,
  // ウィンドウ (500x670) に収まる寸法で組むので、本文のスクロールは出さない。
  overflow: 'hidden',
  padding: 6,
  fontSize: 12,
};

/** ページ (タブの中身)。実測: グループの左端は x=7、上端は y=13。 */
const PAGE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '13px 5px 8px',
  flex: '1 1 auto',
  minHeight: 0,
  overflow: 'hidden',
};

/**
 * 元実装のグループ枠 (fieldset) はコントロールの位置がそのまま入る詰めた枠なので、
 * ライブラリの既定の余白を外して中身の高さに合わせる。
 * 実測: 見出しとチェックはグループ内の左端から 15px (クライアント x=24)。
 */
const GROUP_STYLE: CSSProperties = {
  flex: '0 0 auto',
  padding: '4px 4px 4px 12px',
  margin: 0,
};

/** 実測: チェックボックス / ラジオの行は 12 DLU = 22px ピッチ。 */
const CHOICE_ROW_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: 22,
  gap: 6,
};

const CHOICE_COLUMN_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column' };

const ROW_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', gap: 4 };

const SPACER_STYLE: CSSProperties = { flex: '1 1 auto' };

/** 長いラベルが折り返さないようにする (実物も 1 行)。 */
const NOWRAP_STYLE: CSSProperties = { whiteSpace: 'nowrap' };

/** リストの移動ボタン (実物 42x14 DLU = 74x26)。ライブラリの左右 12px の余白は詰める。 */
const MOVE_BUTTON_STYLE: CSSProperties = {
  ...NOWRAP_STYLE,
  width: 74,
  minWidth: 74,
  padding: '0 2px',
};

const BUTTON_ROW_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

/**
 * プロパティシート下部のボタン行 (実物は右端揃えの OK / キャンセル / 適用(A))。
 * 実測: タブ ページの下端とボタンの間に 8px の余白がある。
 */
const DIALOG_BUTTON_ROW_STYLE: CSSProperties = {
  ...BUTTON_ROW_STYLE,
  padding: '8px 6px 6px',
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
      style={NOWRAP_STYLE}
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
    <div style={PAGE_STYLE}>
      {/* 実測: 画面の掴みスクロールの方式 (4,7,225,50) = 394x92 */}
      <GroupBox legend="画面の掴みスクロールの方式" style={{ ...GROUP_STYLE, height: 92 }}>
        <div style={CHOICE_COLUMN_STYLE}>
          <div style={CHOICE_ROW_STYLE}>
            <OptionButton
              id="preferences-scroll-adobe"
              data-ctrl-id={1023}
              name="preferences-scroll"
              label="Adobe方式(A) （スペースキーを押しながらマウスドラッグ）"
              checked={settings.scrollMode === 'adobe'}
              onChange={() => onChange({ scrollMode: 'adobe' })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <OptionButton
              id="preferences-scroll-ie"
              data-ctrl-id={1025}
              name="preferences-scroll"
              label="IE方式(E) （ホイールクリックでスクロールロック）"
              checked={settings.scrollMode === 'ie'}
              onChange={() => onChange({ scrollMode: 'ie' })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <OptionButton
              id="preferences-scroll-drag"
              data-ctrl-id={1027}
              name="preferences-scroll"
              label="マウスドラッグのみで掴みスクロール(R)"
              checked={settings.scrollMode === 'drag'}
              onChange={() => onChange({ scrollMode: 'drag' })}
            />
          </div>
        </div>
      </GroupBox>

      {/* 実測: カーソル移動 (4,64,225,72) = 394x133 */}
      <GroupBox legend="カーソル移動" style={{ ...GROUP_STYLE, height: 133 }}>
        <div style={CHOICE_COLUMN_STYLE}>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1021}
              label="リターンキーでチェック時、カーソルを自動で次のサークルに移動 (N)"
              checked={settings.enterMovesCursor}
              onToggle={(checked) => onChange({ enterMovesCursor: checked })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1029}
              label="テンキーでチェック時、カーソルを自動で次のサークルに移動 (M)"
              checked={settings.tenkeyMovesCursor}
              onToggle={(checked) => onChange({ tenkeyMovesCursor: checked })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1710}
              label="ページ変更時に常に左上のサークルカットにカーソルを合わせる (U)"
              checked={settings.cursorToTopLeftOnPageChange}
              onToggle={(checked) => onChange({ cursorToTopLeftOnPageChange: checked })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1024}
              label="選択カーソルをマウスカーソルに追従する (T)"
              checked={settings.cursorFollowsMouse}
              onToggle={(checked) => onChange({ cursorFollowsMouse: checked })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1022}
              label="選択サークルのブロックが変わった際にサークル一覧の表示も追従する (L)"
              checked={settings.listFollowsBlock}
              onToggle={(checked) => onChange({ listFollowsBlock: checked })}
            />
          </div>
        </div>
      </GroupBox>

      {/* 実測: データ読み込み (4,141,225,63) = 394x117 */}
      <GroupBox legend="データ読み込み" style={{ ...GROUP_STYLE, height: 117 }}>
        <div style={CHOICE_COLUMN_STYLE}>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1664}
              label="起動時に前回使用したチェックリストを自動的に読み込む (P)"
              checked={settings.loadLastChecklistOnStart}
              onToggle={(checked) => onChange({ loadLastChecklistOnStart: checked })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1028}
              label="過去のチェックリスト読み込み時、サークル名チェックを厳密に行う (C)"
              checked={settings.strictCircleNameCheck}
              onToggle={(checked) => onChange({ strictCircleNameCheck: checked })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1712}
              label="読み込み時にサークルメモを上書きする(O)"
              checked={settings.overwriteMemoOnLoad}
              onToggle={(checked) => onChange({ overwriteMemoOnLoad: checked })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1713}
              label="読み込み時にチェック色情報を上書きする(W)"
              checked={settings.overwriteColorOnLoad}
              onToggle={(checked) => onChange({ overwriteColorOnLoad: checked })}
            />
          </div>
        </div>
      </GroupBox>

      {/* 実測: その他 (4,213,225,58) = 394x107 */}
      <GroupBox legend="その他" style={{ ...GROUP_STYLE, height: 107 }}>
        <div style={CHOICE_COLUMN_STYLE}>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1714}
              label="個別窓のアイコン化を連動する(I)"
              checked={settings.linkWindowIconify}
              onToggle={(checked) => onChange({ linkWindowIconify: checked })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1026}
              label="シングルクリックでチェックする (S)"
              checked={settings.singleClickChecks}
              onToggle={(checked) => onChange({ singleClickChecks: checked })}
            />
          </div>
          <div style={CHOICE_ROW_STYLE}>
            <PreferenceCheck
              controlId={1711}
              label="起動時に表紙画像を表示する (B)"
              checked={settings.showCoverOnStart}
              onToggle={(checked) => onChange({ showCoverOnStart: checked })}
            />
          </div>
        </div>
      </GroupBox>

      <div style={BUTTON_ROW_STYLE}>
        <Button
          data-testid="preferences-reset"
          data-ctrl-id={1720}
          style={{ ...NOWRAP_STYLE, width: 122 }}
          onClick={onReset}
        >
          設定を初期化(D)
        </Button>
      </div>
    </div>
  );
}

/** パス設定の 1 グループ (ラジオ 2 つ + 場所 + 参照)。元ダイアログ 191。 */
function PathGroup({
  legend,
  autoControlId,
  manualControlId,
  autoLabel,
  manualLabel,
  placeLabel,
  placeControlId,
  placeAriaLabel,
  value,
  useAuto,
  onAuto,
  onPath,
  browseTitle,
}: {
  legend: string;
  autoControlId: number;
  manualControlId: number;
  autoLabel: string;
  manualLabel: string;
  placeLabel: string;
  placeControlId: number;
  /** 入力欄のアクセシブル名 (見出しは「場所(D) :」だが、何の場所かを残す)。 */
  placeAriaLabel: string;
  value: string;
  useAuto: boolean;
  onAuto: (auto: boolean) => void;
  onPath: (value: string) => void;
  browseTitle: string;
}) {
  return (
    // 実測: 画像データパス (7,7,217,76) = 380x140
    <GroupBox legend={legend} style={{ ...GROUP_STYLE, height: 140, padding: '4px 12px 4px 10px' }}>
      <div style={CHOICE_COLUMN_STYLE}>
        <div style={CHOICE_ROW_STYLE}>
          <OptionButton
            id={`preferences-path-auto-${autoControlId}`}
            data-ctrl-id={autoControlId}
            name={`preferences-path-${autoControlId}`}
            label={autoLabel}
            checked={useAuto}
            onChange={() => onAuto(true)}
          />
        </div>
        <div style={CHOICE_ROW_STYLE}>
          <OptionButton
            id={`preferences-path-manual-${manualControlId}`}
            data-ctrl-id={manualControlId}
            name={`preferences-path-${autoControlId}`}
            label={manualLabel}
            checked={!useAuto}
            onChange={() => onAuto(false)}
          />
        </div>
        {/* 実測: 場所(D) の見出しは x=42、エディットは x=112 の 266px。 */}
        <div style={{ ...ROW_STYLE, paddingLeft: 18, paddingTop: 2 }}>
          <span style={{ ...NOWRAP_STYLE, flex: '0 0 70px' }}>{placeLabel}</span>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <TextBox
              aria-label={placeAriaLabel}
              data-ctrl-id={placeControlId}
              style={{ flex: '1 1 auto', minWidth: 0 }}
              value={value}
              disabled={useAuto}
              onChange={(event) => onPath(event.target.value)}
            />
          </div>
        </div>
        {/* 実測: 参照(C)... はエディットの下に右寄せ (166,61,50,14) = x=290 の 88px。 */}
        <div style={{ ...BUTTON_ROW_STYLE, paddingTop: 2 }}>
          <Button
            data-ctrl-id={placeControlId === 1614 ? 1616 : 1734}
            style={{ ...NOWRAP_STYLE, width: 88 }}
            disabled
            title={browseTitle}
          >
            参照(C)...
          </Button>
        </div>
      </div>
    </GroupBox>
  );
}

/** 画像データパス / ブラウザ指定 (ページ② 元ダイアログ 191 パス設定)。 */
function ImagePathPage({
  imagePath,
  onChange,
}: {
  imagePath: ImagePathSettings;
  onChange: (patch: Partial<ImagePathSettings>) => void;
}) {
  return (
    <div style={PAGE_STYLE}>
      <PathGroup
        legend="画像データパス"
        autoControlId={1612}
        manualControlId={1613}
        autoLabel="自動検索する(F)"
        manualLabel="指定場所から読み込む(R)"
        placeLabel="場所(D) :"
        placeControlId={1614}
        placeAriaLabel="画像データの場所"
        value={imagePath.basePath}
        useAuto={imagePath.autoSearch}
        onAuto={(auto) => onChange({ autoSearch: auto })}
        onPath={(value) => onChange({ basePath: value })}
        browseTitle="Web 版ではフォルダを参照できません (URL を直接入力)"
      />
      <PathGroup
        legend="ブラウザ指定"
        autoControlId={1730}
        manualControlId={1731}
        autoLabel="標準(S)"
        manualLabel="ブラウザを指定(B)"
        placeLabel="場所(E) :"
        placeControlId={1733}
        placeAriaLabel="ブラウザの場所"
        value={imagePath.browserPath}
        useAuto={imagePath.useDefaultBrowser}
        onAuto={(auto) => onChange({ useDefaultBrowser: auto })}
        onPath={(value) => onChange({ browserPath: value })}
        browseTitle="Web 版では実行ファイルを参照できません"
      />
    </div>
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
  visible,
  onChange,
}: {
  legend: string;
  controlId: number;
  prevLabel: string;
  prevControlId: number;
  nextLabel: string;
  nextControlId: number;
  /** 表示中の列 (表示順)。 */
  visible: readonly ListColumnKey[];
  onChange: (next: ListColumnKey[]) => void;
}) {
  // 一覧は「表示中の列 (表示順) → チェックの外れた列 (実物の並び)」の順に描く。
  // こうしないと、前へ / 後へ移動で visible を並べ替えても表示が変わらない。
  const hidden = LIST_COLUMN_ORDER.filter((key) => !visible.includes(key));
  const ordered = [...visible, ...hidden];
  // 実物のリストは常に 1 項目が選ばれている (最初は先頭)。端でだけ移動ボタンが無効。
  const [selected, setSelected] = useState<ListColumnKey | null>(ordered[0] ?? null);
  const index = selected === null ? -1 : visible.indexOf(selected);

  const move = (delta: number) => {
    const target = index + delta;
    if (index < 0 || target < 0 || target >= visible.length) return;
    const next = [...visible];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    // 実測: チェックリスト 表示項目 (7,7,103,127) = 180x235。見出し
    // (「チェックリスト 表示項目 (C)」) が折り返さないよう幅はページに合わせる。
    <GroupBox legend={legend} style={{ ...GROUP_STYLE, width: 214, height: 235, padding: '4px 4px 4px 10px' }}>
      <div
        data-ctrl-id={controlId}
        className="sunken-panel"
        style={{
          ...CHOICE_COLUMN_STYLE,
          // 実測: リスト領域は 88x92 DLU = 154x170 (項目が増えるとスクロールする)。
          width: 154,
          height: 170,
          background: 'transparent',
          overflow: 'auto',
        }}
      >
        {ordered.map((key) => (
          <div
            key={key}
            data-testid={`column-row-${key}`}
            // 行のクリックで選ぶ (チェックボックスの入れ外しとは別。実物のリストボックスと同じ)。
            onClick={() => setSelected(key)}
            style={{
              ...ROW_STYLE,
              // 行は縮めない (入りきらない分はリストの中でスクロールする)。
              flex: '0 0 auto',
              height: 17,
              paddingLeft: 2,
              background: key === selected ? '#000080' : undefined,
            }}
          >
            <Checkbox
              id={`preferences-column-${key}`}
              label={LIST_COLUMN_LABELS[key]}
              style={NOWRAP_STYLE}
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
      {/* 実測: 前へ移動 (15,115,42,14) = 74x26 が 2 つ (文字がはみ出さない幅)。 */}
      <div style={{ ...BUTTON_ROW_STYLE, justifyContent: 'flex-start', gap: 5, paddingTop: 8 }}>
        <Button
          data-ctrl-id={prevControlId}
          style={MOVE_BUTTON_STYLE}
          disabled={index <= 0}
          onClick={() => move(-1)}
        >
          {prevLabel}
        </Button>
        <Button
          data-ctrl-id={nextControlId}
          style={MOVE_BUTTON_STYLE}
          disabled={index < 0 || index >= visible.length - 1}
          onClick={() => move(1)}
        >
          {nextLabel}
        </Button>
      </div>
    </GroupBox>
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
    <div style={PAGE_STYLE}>
      <div style={{ display: 'flex', gap: 18, flex: '0 0 auto' }}>
        <ColumnList
          legend="チェックリスト 表示項目 (C)"
          controlId={1694}
          prevLabel="前へ移動(F)"
          prevControlId={1695}
          nextLabel="後へ移動(B)"
          nextControlId={1696}
          visible={listDisplay.checklist}
          onChange={(next) => onChange({ checklist: next })}
        />
        <ColumnList
          legend="サークル一覧 表示項目 (L)"
          controlId={1697}
          prevLabel="前へ移動(P)"
          prevControlId={1698}
          nextLabel="後へ移動(N)"
          nextControlId={1699}
          visible={listDisplay.list}
          onChange={(next) => onChange({ list: next })}
        />
      </div>
      {/* 実測: 注記 (8,142,124,18) = 217x33 (2 行)、デフォルトに戻す (160,141,63,14)。 */}
      <div style={{ ...ROW_STYLE, alignItems: 'flex-start', gap: 8 }}>
        <p data-testid="preferences-list-note" style={{ margin: 0, color: '#404040', whiteSpace: 'nowrap' }}>
          ※「サークル名」を非表示にすることは
          <br />
          できません.
        </p>
        <span style={SPACER_STYLE} />
        <Button
          data-ctrl-id={1700}
          data-testid="preferences-list-default"
          style={{ ...NOWRAP_STYLE, width: 110 }}
          onClick={() => onChange({ ...DEFAULT_LIST_DISPLAY_SETTINGS })}
        >
          デフォルトに戻す(D)
        </Button>
      </div>
    </div>
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
  // 実測 (`解析/UI-SPEC.md` 6.1) の 動作設定 439 x 670。高さはそのまま (ページの内寸
  // 557px = 動作オプションの 301 DLU × 1.85)、幅は実物の 439 だと日本語ラベルが折り返す
  // (「選択サークルのブロックが変わった際に… (L)」の描画幅がチェック印込みで 426px で、
  // 実物の 217 DLU = 380px より 12% 広い)。折り返さない幅にする。
  width = 510,
  height = 670,
  zIndex,
}: PreferencesDialogProps) {
  const [tab, setTab] = useState<TabId>('option');
  /** 編集中の値 (OK / 適用(A) で親へ出すまで確定しない)。 */
  const [draft, setDraft] = useState({ settings, imagePath, listDisplay, checkColors });
  /** まだ確定していない編集 (「適用」の有効 / 無効と、確定時に渡す patch)。 */
  const [pending, setPending] = useState<PendingEdits>({});
  const dirty = Object.values(pending).some((patch) => patch !== undefined);

  const editSettings = (patch: Partial<AppSettings>) => {
    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    setPending((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  };

  const editImagePath = (patch: Partial<ImagePathSettings>) => {
    setDraft((prev) => ({ ...prev, imagePath: { ...prev.imagePath, ...patch } }));
    setPending((prev) => ({ ...prev, imagePath: { ...prev.imagePath, ...patch } }));
  };

  const editListDisplay = (patch: Partial<ListDisplaySettings>) => {
    setDraft((prev) => ({ ...prev, listDisplay: { ...prev.listDisplay, ...patch } }));
    setPending((prev) => ({ ...prev, listDisplay: { ...prev.listDisplay, ...patch } }));
  };

  const editCheckColors = (patch: Partial<CheckColorSettings>) => {
    setDraft((prev) => ({ ...prev, checkColors: { ...prev.checkColors, ...patch } }));
    setPending((prev) => ({ ...prev, checkColors: { ...prev.checkColors, ...patch } }));
  };

  /** 溜めた編集を親へ出す (OK / 適用(A))。 */
  const commit = () => {
    if (pending.settings) onChange(pending.settings);
    if (pending.imagePath) onImagePathChange(pending.imagePath);
    if (pending.listDisplay) onListDisplayChange(pending.listDisplay);
    if (pending.checkColors) onCheckColorsChange(pending.checkColors);
  };

  /** 動作オプションの「設定を初期化(D)」 (実物はこのページの中のボタン)。 */
  const resetOptions = () => {
    onReset();
    setDraft((prev) => ({ ...prev, settings: DEFAULT_APP_SETTINGS }));
    setPending((prev) => ({ ...prev, settings: undefined }));
  };

  const pages: Record<TabId, React.ReactNode> = {
    option: <OptionPage settings={draft.settings} onChange={editSettings} onReset={resetOptions} />,
    imagePath: <ImagePathPage imagePath={draft.imagePath} onChange={editImagePath} />,
    list: <ListPage listDisplay={draft.listDisplay} onChange={editListDisplay} />,
    colors: <CheckColorEditor checkColors={draft.checkColors} onChange={editCheckColors} />,
  };

  return (
    // 実物と同じくサイズ変更不可 (app.css でリサイズ ハンドルを消す)。本文のスクロールも出さない。
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
        <div style={DIALOG_BUTTON_ROW_STYLE} data-testid="preferences-actions">
          <Button
            variant="default"
            data-testid="preferences-ok"
            onClick={() => {
              commit();
              setPending({});
              onClose();
            }}
          >
            OK
          </Button>
          <Button data-testid="preferences-cancel" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            data-testid="preferences-apply"
            disabled={!dirty}
            onClick={() => {
              commit();
              setPending({});
            }}
          >
            適用(A)
          </Button>
        </div>
      </div>
    </Window>
  );
}
