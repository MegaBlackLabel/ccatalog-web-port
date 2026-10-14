import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  Button,
  Dropdown,
  MenuBar,
  Slider,
  StatusBar,
  StatusBarField,
  TextBox,
  Toolbar,
  ToolbarBand,
  ToolbarRow,
  Window,
  useToolbarRows,
} from '@megablacklabel/react98retro';
import type { ToolbarItemDef } from '@megablacklabel/react98retro';
import { TOOLBAR_ICONS } from './toolbar-icons';
import { TOOLBAR_CONTENT_HEIGHT, TOOLBAR_PADDING_X } from './toolbar-groove';
import { checkColorPalette, checkSwatchIcon } from '../check-colors';
import type { CheckColor } from '../../app/catalog-state';
import { SOURCE_CHARS, TARGET_CHARS, normalize } from '../../domain/normalize';
import type { Circle, ComiketInfo } from '../../domain/types';
import { MENU_COMMANDS } from '../menu/menu-defs';
import { toMenuBarMenus, TOOLBAR_BARS, type ToolbarBarId } from '../menu/to-menu-bar';
import { TOOLBAR_COMMANDS } from './toolbar-commands';
import type { FitBox } from './fit-zoom';
import { CircleCutView, type CutViewOperation } from './CircleCutView';

/** ツールバーのドロップダウンの選択肢 1 個。 */
export type MainWindowToolbarOption = {
  label: string;
  /** 選んだときに onCommand へ渡す WM_COMMAND 相当。 */
  command: number;
};

/**
 * ページ移動ツールバーの 3 つのドロップダウンの選択肢。
 * 元実装は「日付(曜日) / ホール / インデックス」をカタログデータから作る
 * (曜日名は元実装の ComiketDate テーブル由来) ので、アプリ側が作って渡す。
 */
export type MainWindowJumpOptions = {
  /** 日付ジャンプ。例 "金曜日"。 */
  days?: readonly MainWindowToolbarOption[];
  /** ホールジャンプ。例 "西2壁"。 */
  halls?: readonly MainWindowToolbarOption[];
  /** インデックスジャンプ。例 "あ"。 */
  indexes?: readonly MainWindowToolbarOption[];
};

export type MainWindowProps = {
  /** 例: 'コミックマーケット カタロム - 新規チェックリスト' */
  title: string;
  info: ComiketInfo | null;
  /** 現在ページのサークル (カット表示用)。 */
  circles: readonly Circle[];
  pageNo: number;
  selectedId: number | null;
  /** カット画像の URL (未指定ならテキストのみ)。 */
  imageUrl?: (circle: Circle) => string | undefined;
  /** ステータスバーに出す文言。 */
  status: string;
  checkedIds: ReadonlySet<number>;
  /** サークル ID → チェック色 (0 = 標準色)。カットのスペース番号ボックスをこの色で塗る。 */
  colorById: ReadonlyMap<number, CheckColor>;
  /** メニュー / ツールバーの WM_COMMAND 相当。 */
  onCommand: (command: number) => void;
  onSelect: (id: number | null) => void;
  onOpenDetail: (id: number) => void;
  onPageChange: (pageNo: number) => void;
  onClose: () => void;
  /** 総ページ数 (ステータスバーのページ送りスライダの範囲)。 */
  lastPage?: number;
  /**
   * 表示中の拡大率 (%。100 = 100%)。アプリ側 (App) は zoom を % で渡し、
   * onZoomChange も % で受け取る。実物のツールバー内 Edit (実測 ID 125) が
   * 表示する値と同じ。
   */
  zoom?: number;
  /**
   * 拡大率を 25〜200 の整数 % で指定する。元実装はツールバー内の Edit
   * コントロール (実測 ID 125) なので WM_COMMAND を持たない。
   */
  onZoomChange?: (percent: number) => void;
  /**
   * セル 1 枚の幅 (拡大率を掛けた実寸)。null なら幅に合わせる (6 列の 1fr)。
   * アプリ側が拡大率から計算して渡す (カットビュー側は表示だけを受け持つ)。
   */
  cellWidth?: number | null;
  /** カットビューの表示領域 (アプリ側の「幅 / 高さ / 全体」合わせの計算元)。 */
  onViewBoxChange?: (box: FitBox) => void;
  /** 動作設定 (ダイアログ 150) のうち、カットビューの操作に関するもの。 */
  operation?: CutViewOperation;
  /** リターンキー / テンキーでチェックしたあとに移すサークル (アプリ側が決める)。 */
  onMoveNext?: (circle: Circle) => void;
  /** ページ移動ツールバーの選択肢。未指定なら circles から作れる分だけ入れる。 */
  jumpOptions?: MainWindowJumpOptions;
  /** 表示するドッキング ツールバー (表示 > ツールバー 32839-32847)。省略時は 5 本とも出す。 */
  visibleBars?: readonly ToolbarBarId[];
  /** オンのトグル (アンチエイリアス / 高解像度表示 / リスト中のカット表示) のコマンド。 */
  checkedCommands?: readonly number[];
  /** 標準のチェック色 (チェックリスト > 標準のチェック色)。メニューのチェック印に使う。 */
  checkColor?: number;
  /** アンチエイリアス (表示 32792)。抜き差しできるようにして、省略時はこの画面が持つ。 */
  antiAlias?: boolean;
  onAntiAliasChange?: (antiAlias: boolean) => void;
  /** 「色の設定」の表示色 (動作設定)。未指定なら実物から実測した色。 */
  checkColors?: readonly string[];
  /** ウィンドウの初期位置とサイズ (アプリ側のレイアウトが決める)。 */
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
};

/**
 * ツールバー 1 本 (実物のドッキング ツールバー)。メインウィンドウは実物と同じ
 * 5 本を左から並べ、ウィンドウ幅に入りきらない本は次の段へ回す (グループ単位の折り返し)。
 */
type ToolbarGroup = {
  /** key と data-testid に使う識別子。 */
  id: ToolbarBarId;
  /** 実物のツールバー名 (アクセシブル名に使う)。例 "ページ移動ツールバー"。 */
  label: string;
  /** Toolbar に並べる項目。 */
  items: ToolbarItemDef[];
  /**
   * 実物は ToolbarWindow32 の子コントロール (ComboBox / Edit / Button) で、
   * ツールバー本体の中に置かれているもの。Toolbar の item には任意のノードを
   * 置けないので、ツールバーの右隣 (同じグループの中) に並べる。
   */
  extra?: ReactNode;
};

/**
 * 正規化済みの読み先頭 (半角カナ) を表示用のひらがなへ戻す。
 * normalize.ts の変換表を逆引きする (半角カナ以外はそのまま)。
 */
function kanaIndexLabel(head: string): string {
  if (!/^[\uFF61-\uFF9F]$/.test(head)) return head;
  const index = TARGET_CHARS.indexOf(head);
  return index >= 0 ? SOURCE_CHARS[index] : head;
}

/** アイコン付きボタン 1 個。label / tooltip は必ず持たせる (画像が読めなくても名前が残る)。 */
function toolbarButton(
  id: string,
  label: string,
  icon: string,
  command: number,
  onCommand: (command: number) => void,
): ToolbarItemDef {
  return { type: 'button', id, icon, label, tooltip: label, onClick: () => onCommand(command) };
}

/**
 * 折り返した段の左右の余白 ([ui/main/toolbar-groove.ts] の共通値) と、
 * グループ (ツールバー) 同士の間隔。段の中の項目の間隔 (4px) とは別で、
 * ドッキング ツールバーの継ぎ目は実物と同じ 2px にする。
 */
const TOOLBAR_ROW_GAP = 2;

/**
 * メニューバーとツールバー帯の境目。メニューバーの下辺は暗い線を持たず (銀の余白 1px)、
 * 溝の暗 1px はツールバー帯 (ライブラリの ToolbarBand) が上辺の外へ描く。
 * こうすると メニューバーを持つこのウィンドウも、持たない 4 ウィンドウも
 * 「銀 → 暗 #808080 → 明 #ffffff → 銀」の同じ溝になる。帯の高さを変えないよう、
 * 暗 1px ぶんは padding-bottom で持つ。
 */
const MENU_BAR_STYLE: CSSProperties = {
  padding: '1px 0',
};

/**
 * ツールバー 1 段分の、このウィンドウ固有の見た目。帯 (外周の溝)・段の並び (flex)・
 * 背景・折り返しの許可はライブラリの `ToolbarBand` / `ToolbarRow` が持つので、
 * ここは段の左右の余白と折り返した段の中の項目の間隔だけを決める。
 * 入りきらないグループは次の段へ折り返す (段の幅はライブラリが計測して詰める)。
 */
const TOOLBAR_ROW_LOCAL: CSSProperties = {
  padding: `0 ${TOOLBAR_PADDING_X}px`,
  gap: TOOLBAR_ROW_GAP,
  whiteSpace: 'nowrap',
};

/**
 * ツールバーの中に置くライブラリの Toolbar を段 (内容 22px) に収める。ライブラリの既定は
 * padding 1px 2px なので、アイコン ボタン 22x22 の上下に 1px ずつ乗って 24px になる。
 * 上下の余白だけ外して 22px にし、帯の内側 (溝の内側) にそのまま収める。左右の 2px は残す。
 * (会場マップ のツールバーと同じやり方。)
 */
const TOOLBAR_INLINE_STYLE: CSSProperties = {
  height: TOOLBAR_CONTENT_HEIGHT,
  padding: `0 ${TOOLBAR_PADDING_X}px`,
  boxSizing: 'border-box',
};

/** グループ 1 本。実物と同じくグループの中では折り返さない。 */
const TOOLBAR_GROUP_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  flex: '0 0 auto',
};

/** ツールバー内の ComboBox (実測 64x20 / 68x20 / 40x20 の 3 つ)。 */
/**
 * ツールバー内の ComboBox。実測の幅 (64/68/40) は最小幅で持ち、
 * 実際の幅は内容に合わせる (「西3･4壁」のような長いホール名が欠けないように)。
 */
const toolbarComboStyle = (width: number): CSSProperties => ({
  width: 'auto',
  minWidth: width,
  maxWidth: 160,
  height: 20,
  flex: '0 0 auto',
});

/** 表示ツールバーの拡大率の Edit (実測 36x18、表示は "100%")。 */
const ZOOM_INPUT_STYLE: CSSProperties = {
  width: 36,
  height: 18,
  padding: 0,
  minHeight: 0,
  boxSizing: 'border-box',
  flex: '0 0 auto',
};

/** チェックツールバーの「色編集」ボタン (実測 64x20、文字は上下中央)。 */
const COLOR_EDIT_STYLE: CSSProperties = {
  width: 64,
  height: 20,
  minWidth: 0,
  minHeight: 0,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 auto',
};

/**
 * ツールバー内の ComboBox 1 個 (実物は ToolbarWindow32 の子コントロール)。
 * 実物と同じく選択中の値 (例 "金曜日") を表示し、選ぶと WM_COMMAND 相当を送る。
 */
function ToolbarCombo({
  label,
  width,
  options,
  onSelect,
}: {
  label: string;
  width: number;
  options: readonly MainWindowToolbarOption[];
  onSelect: (option: MainWindowToolbarOption) => void;
}) {
  const [command, setCommand] = useState<number | null>(options[0]?.command ?? null);
  // 選択肢が差し替わったら (アプリがカタログを読み直した等) 先頭の値に戻す。
  const selected = options.find((option) => option.command === command) ?? options[0];
  return (
    <Dropdown
      aria-label={label}
      title={label}
      disabled={options.length === 0}
      style={toolbarComboStyle(width)}
      value={selected ? String(selected.command) : ''}
      options={options.map((option) => ({ value: String(option.command), label: option.label }))}
      onChange={(event) => {
        const option = options.find((candidate) => String(candidate.command) === event.target.value);
        if (!option) return;
        setCommand(option.command);
        onSelect(option);
      }}
    />
  );
}

/** 表示ツールバーの拡大率の Edit。Enter で確定して onZoomChange (%) を呼ぶ。 */
function ZoomPercentInput({
  percent,
  onChange,
}: {
  percent: number;
  onChange?: (percent: number) => void;
}) {
  const [draft, setDraft] = useState(`${percent}%`);

  useEffect(() => {
    setDraft(`${percent}%`);
  }, [percent]);

  return (
    <TextBox
      aria-label="拡大率"
      inputMode="numeric"
      style={ZOOM_INPUT_STYLE}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return;
        const parsed = Number.parseInt(draft, 10);
        if (!Number.isNaN(parsed) && parsed > 0) onChange?.(parsed);
      }}
    />
  );
}

/** ステータスバーのページ番号の Edit (実測 26x13)。 */
const PAGE_INPUT_STYLE: CSSProperties = {
  width: 26,
  height: 13,
  padding: 0,
  minHeight: 0,
  boxSizing: 'border-box',
  textAlign: 'right',
  flex: '0 0 auto',
};

/** ステータスバーのスライダ (実測 202x20)。 */
const PAGE_SLIDER_STYLE: CSSProperties = {
  width: 202,
  height: 20,
  flex: '0 0 auto',
};

/**
 * ステータスバーの << / >> ボタン (実測 38x17)。98.css の min-width /
 * min-height を打ち消し、固定高さでも文字が上下中央に来るようにする。
 */
const STATUS_BUTTON_STYLE: CSSProperties = {
  width: 38,
  height: 17,
  minWidth: 0,
  minHeight: 0,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxSizing: 'border-box',
  flex: '0 0 auto',
};

/** ステータスバー 1 行目の左側 (元実装は statusbar の子コントロール)。実測 19px の 1 行。 */
const STATUS_CONTROLS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  // 実測のスライダ (202x20) が収まる高さ。19 だと上下 1px ずつはみ出していた。
  height: 20,
  padding: '0 3px',
  margin: 0,
  boxSizing: 'border-box',
};

/** ステータスバーの文字欄。98.css は文字を上に寄せるので、行の中で上下中央にする。 */
const STATUS_TEXT_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: 20,
  padding: '0 3px',
  margin: 0,
  lineHeight: 1,
  boxSizing: 'border-box',
};

export function MainWindow({
  title,
  info,
  circles,
  pageNo,
  selectedId,
  status,
  checkedIds,
  colorById,
  onCommand,
  onSelect,
  onOpenDetail,
  onPageChange,
  onClose,
  imageUrl,
  lastPage,
  zoom = 100,
  onZoomChange,
  cellWidth,
  onViewBoxChange,
  operation,
  onMoveNext,
  jumpOptions,
  visibleBars,
  checkedCommands,
  checkColor,
  antiAlias: antiAliasProp,
  onAntiAliasChange,
  checkColors,
  initialX = 40,
  initialY = 30,
  width = 900,
  height = 680,
}: MainWindowProps) {
  const [pageDraft, setPageDraft] = useState(String(pageNo));
  // アンチエイリアス (32792) は表示メニューとツールバーの両方から切り替わる。
  // アプリが状態を持つときはそちらに任せ、単体で使うときはこの画面が持つ。
  const [antiAliasLocal, setAntiAliasLocal] = useState(true);
  const antiAlias = antiAliasProp ?? antiAliasLocal;
  // マウスが乗っているカット。元実装はステータスバーにそのサークル情報を簡易表示する。
  const [hoveredCircle, setHoveredCircle] = useState<Circle | null>(null);
  const hoverInfo =
    hoveredCircle === null
      ? null
      : [
          hoveredCircle.circleName,
          hoveredCircle.penName,
          hoveredCircle.day === 0 ? '抽選漏れ' : `${hoveredCircle.day}日目`,
          `${hoveredCircle.spaceNo}${hoveredCircle.spaceNoSub === 1 ? 'b' : 'a'}`,
        ]
          .filter(Boolean)
          .join(' / ');

  // 外からページが変わったら入力欄も追随させる。
  useEffect(() => {
    setPageDraft(String(pageNo));
  }, [pageNo]);

  const commitPageDraft = () => {
    const parsed = Number.parseInt(pageDraft, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) onPageChange(parsed);
  };

  // ページ移動ツールバーの選択肢。アプリから渡されなければ、この画面が持っている
  // カタログデータ (現在ページのサークル) から作れる分だけ入れる。
  const jumps = useMemo<Required<MainWindowJumpOptions>>(() => {
    const days = new Set<number>();
    const indexes = new Set<string>();
    for (const circle of circles) {
      if (circle.day > 0) days.add(circle.day);
      const head = normalize([...circle.circleKana][0] ?? '');
      if (head) indexes.add(head);
    }
    return {
      days:
        jumpOptions?.days ??
        [...days]
          .sort((a, b) => a - b)
          .map((day, index) => ({ label: `${day}日目`, command: TOOLBAR_COMMANDS.dayJumpBase + index })),
      halls: jumpOptions?.halls ?? [],
      indexes:
        jumpOptions?.indexes ??
        [...indexes]
          .sort()
          .map((head, index) => ({ label: kanaIndexLabel(head), command: TOOLBAR_COMMANDS.indexJumpBase + index })),
    };
  }, [circles, jumpOptions]);

  // 拡大率はアプリ側と同じ % (実物のツールバー内 Edit の表示と同じ単位)。
  const zoomPercent = Math.round(zoom);

  // チェックツールバーの色ボタン (色1〜色9) の色。「色の設定」(動作設定) を反映する。
  const palette = checkColorPalette(checkColors);

  // 元実装のツールバー (ヘルプ 1WINDOW/8TOOLBAR.HTM) は 5 本のドッキング ツールバー。
  // アイコンは**実物の PE リソース (RT_BITMAP 130 / 16x15) を SVG 化した TOOLBAR_ICONS**
  // (tools/gen-toolbar-icons.py が生成)。グループの区切りは 2 本目以降の先頭のセパレータ。
  const toolbarGroups: ToolbarGroup[] = [
    {
      id: 'basic',
      label: '基本ツールバー',
      // 基本操作関連
      items: [
        toolbarButton('new-checklist', '新規作成', TOOLBAR_ICONS.newChecklist, MENU_COMMANDS.newChecklist, onCommand),
        toolbarButton('open-checklist', 'チェックリストを開く', TOOLBAR_ICONS.checklistOpen, MENU_COMMANDS.openChecklist, onCommand),
        toolbarButton('save-checklist', 'チェックリストの保存', TOOLBAR_ICONS.checklistSave, MENU_COMMANDS.saveChecklist, onCommand),
        toolbarButton('print', '印刷', TOOLBAR_ICONS.print, MENU_COMMANDS.print, onCommand),
      ],
    },
    {
      id: 'jump',
      label: 'ページ移動ツールバー',
      // ジャンプ操作関連。日付/ホール/インデックスのジャンプは実物では ToolbarWindow32 の
      // 子 ComboBox (実測 64x20 / 68x20 / 40x20) で、選択中の値を表示する。
      items: [
        { type: 'separator' },
        toolbarButton('page-prev', '前のページ', TOOLBAR_ICONS.pagePrev, MENU_COMMANDS.pagePrev, onCommand),
        toolbarButton('page-next', '次のページ', TOOLBAR_ICONS.pageNext, MENU_COMMANDS.pageNext, onCommand),
      ],
      extra: (
        <>
          <ToolbarCombo
            label="日付ジャンプ"
            width={64}
            options={jumps.days}
            onSelect={(option) => onCommand(option.command)}
          />
          <ToolbarCombo
            label="ホールジャンプ"
            width={68}
            options={jumps.halls}
            onSelect={(option) => onCommand(option.command)}
          />
          <ToolbarCombo
            label="インデックスジャンプ"
            width={40}
            options={jumps.indexes}
            onSelect={(option) => onCommand(option.command)}
          />
        </>
      ),
    },
    {
      id: 'view',
      label: '表示ツールバー',
      // 表示関連
      items: [
        { type: 'separator' },
        toolbarButton('zoom-out', 'ズームアウト', TOOLBAR_ICONS.zoomOut, MENU_COMMANDS.zoomOut, onCommand),
      ],
      // 実物の「表示ツールバー」は 1 本で、[ズームアウト][拡大率の Edit (36x18)][ズームイン]
      // [幅][高さ][元のサイズ][アンチエイリアス] の順。Toolbar の item には任意のノードを
      // 置けないので、Edit を挟んで 2 本に分けて 1 行に並べる (2 本目のグリップは CSS で消す)。
      extra: (
        <>
          <ZoomPercentInput percent={zoomPercent} onChange={onZoomChange} />
          <Toolbar
            aria-label="表示ツールバー"
            style={TOOLBAR_INLINE_STYLE}
            items={[
              toolbarButton('zoom-in', 'ズームイン', TOOLBAR_ICONS.zoomIn, MENU_COMMANDS.zoomIn, onCommand),
              toolbarButton('fit-width', '幅に合わせる', TOOLBAR_ICONS.fitWidth, MENU_COMMANDS.fitWidth, onCommand),
              toolbarButton('fit-height', '高さに合わせる', TOOLBAR_ICONS.fitHeight, MENU_COMMANDS.fitHeight, onCommand),
              toolbarButton('actual-size', '元のサイズ', TOOLBAR_ICONS.actualSize, MENU_COMMANDS.actualSize, onCommand),
              {
                type: 'button',
                id: 'anti-alias',
                icon: TOOLBAR_ICONS.antiAlias,
                label: 'アンチエイリアス',
                tooltip: 'アンチエイリアス',
                pressed: antiAlias,
                onClick: () => {
                  // アプリが状態を持つときは、コマンド (32792) 側だけで切り替える。
                  if (onAntiAliasChange === undefined) setAntiAliasLocal((value) => !value);
                  onCommand(TOOLBAR_COMMANDS.antiAlias);
                },
              },
            ]}
          />
        </>
      ),
    },
    {
      id: 'check',
      label: 'チェックツールバー',
      // チェックリスト関連: 色1〜色9 + チェックリストから外す
      items: [
        { type: 'separator' },
        ...palette.map((color, index) =>
          toolbarButton(
            `check-color-${index + 1}`,
            `色${index + 1}`,
            checkSwatchIcon(color),
            TOOLBAR_COMMANDS.checkColorBase + index + 1,
            onCommand,
          ),
        ),
        toolbarButton('check-remove', 'チェックリストから外す', TOOLBAR_ICONS.checkRemove, TOOLBAR_COMMANDS.checkRemove, onCommand),
      ],
      // 実物の「色編集」はツールバー内の文字付きボタン (実測 64x20)。
      extra: (
        <Button
          aria-label="色編集"
          style={COLOR_EDIT_STYLE}
          onClick={() => onCommand(TOOLBAR_COMMANDS.colorEdit)}
        >
          色編集
        </Button>
      ),
    },
    {
      id: 'nav',
      label: 'ナビゲートツールバー',
      // ナビゲート関連
      items: [
        { type: 'separator' },
        toolbarButton('nav-back', '戻る', TOOLBAR_ICONS.goBack, MENU_COMMANDS.back, onCommand),
        toolbarButton('nav-forward', '進む', TOOLBAR_ICONS.goForward, MENU_COMMANDS.forward, onCommand),
      ],
    },
  ];

  // 表示 > ツールバー (32839〜32847) で隠したバーは並べない。
  const shownBars = visibleBars ?? TOOLBAR_BARS.map((bar) => bar.id);
  const shownGroups = toolbarGroups.filter((group) => shownBars.includes(group.id));

  // 実物のドッキング ツールバーと同じく、段に入りきらないグループは次の段へ回す。
  // 幅はレイアウト後にしか分からないので、ライブラリの useToolbarRows が計測して詰める
  // (計測できないときは 1 段のまま CSS の折り返しに任せる)。
  const {
    stripRef,
    itemRefs: groupRefs,
    rows: toolbarRows,
  } = useToolbarRows({
    count: shownGroups.length,
    gap: TOOLBAR_ROW_GAP,
    paddingX: TOOLBAR_PADDING_X,
  });

  // ステータスバーのページ送りスライダの範囲。総ページ数が来ていなければ現在ページまで。
  const pageCount = Math.max(lastPage ?? pageNo, pageNo, 1);

  // RT_MENU 128 の定義 + 実行時に作られる「ウィンドウ」メニュー
  // (src/ui/menu/to-menu-bar.ts が単一の変換元)。
  const menus = toMenuBarMenus(
    onCommand,
    { visibleBars: shownBars, checked: checkedCommands ?? [] },
    checkColor,
  );

  return (
    <div data-testid="main-window">
      <Window
        title={title}
        onClose={onClose}
        width={width}
        height={height}
        initialX={initialX}
        initialY={initialY}
        statusBar={
          // 元実装のステータスバーは 1 行で、左から
          // [ページ番号入力][<<][ページ送りスライダ][>>] のあとに文字のステータス欄が並ぶ。
          // status (App 側で「ページ N」を含む) と二重にならないよう、ページ番号は
          // 「N ページ目」の形で並べる。
          // フィールドを実測の 20px にしたので、帯は 1 (上辺の白) + 2 + 20 + 2 = 25px。
          // ライブラリの既定はフィールド 17px / 帯 22px。
          <StatusBar style={{ height: 25 }}>
            {/* StatusBarField は <p> を描くので、ブロック要素 (TextBox/Slider) を入れると
                「<div> cannot be a descendant of <p>」になる。実物と同じく 98.css の
                status-bar-field を div に当てて、コントロールを子に置く。 */}
            <div className="status-bar-field" style={STATUS_CONTROLS_STYLE}>
              <TextBox
                className="text-box"
                aria-label="ページ番号"
                inputMode="numeric"
                style={PAGE_INPUT_STYLE}
                value={pageDraft}
                onChange={(event) => setPageDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitPageDraft();
                }}
              />
              <Button
                aria-label="前のページ"
                style={STATUS_BUTTON_STYLE}
                onClick={() => onPageChange(Math.max(1, pageNo - 1))}
              >
                {'<<'}
              </Button>
              <Slider
                aria-label="ページ送り"
                min={1}
                max={pageCount}
                value={pageNo}
                style={PAGE_SLIDER_STYLE}
                onChange={(event) => onPageChange(Number(event.target.value))}
              />
              <Button
                aria-label="次のページ"
                style={STATUS_BUTTON_STYLE}
                onClick={() => onPageChange(pageNo + 1)}
              >
                {'>>'}
              </Button>
            </div>
            {/* 元実装: 「現在のマウスカーソルの位置にあるサークルカットのサークル情報が簡易表示されます」
                (CHM 1WINDOW/2CIRCLE.HTM ステータスバー節)。 */}
            <StatusBarField style={STATUS_TEXT_STYLE}>{hoverInfo ?? status}</StatusBarField>
            <StatusBarField style={STATUS_TEXT_STYLE}>{pageNo} ページ目</StatusBarField>
          </StatusBar>
        }
      >
        {/* ツールバー帯が上下の区切り線 (溝) を持つ。メニューバー側は下辺に線を入れない
            (帯の上の暗 1px は帯が描くので、線を入れると暗が 2px になる)。 */}
        <MenuBar menus={menus} style={MENU_BAR_STYLE} />
        {/* 元実装は 5 本のドッキング ツールバーで、入りきらない本は次の段へ回る。
            帯の外周の溝と、折り返した段と段の間の溝はライブラリの ToolbarBand が持つ。 */}
        <ToolbarBand
          ref={stripRef}
          data-testid="main-toolbar"
          rows={toolbarRows.map((row) => (
            <ToolbarRow key={row[0]} data-testid="toolbar-row" style={TOOLBAR_ROW_LOCAL}>
              {row.map((groupIndex) => {
                const group = shownGroups[groupIndex];
                return (
                  <div
                    key={group.id}
                    data-testid={`toolbar-group-${group.id}`}
                    ref={(element) => {
                      groupRefs.current[groupIndex] = element;
                    }}
                    style={TOOLBAR_GROUP_STYLE}
                  >
                    <Toolbar items={group.items} aria-label={group.label} style={TOOLBAR_INLINE_STYLE} />
                    {group.extra}
                  </div>
                );
              })}
            </ToolbarRow>
          ))}
        />
        <CircleCutView
          circles={circles}
          info={info}
          selectedId={selectedId}
          checkedIds={checkedIds}
          colorById={colorById}
          onSelect={onSelect}
          onOpenDetail={onOpenDetail}
          imageUrl={imageUrl}
          onHoverCircle={setHoveredCircle}
          cellWidth={cellWidth}
          onViewBoxChange={onViewBoxChange}
          operation={operation}
          onMoveNext={onMoveNext}
          antiAlias={antiAlias}
          checkColors={checkColors}
        />
      </Window>
    </div>
  );
}
