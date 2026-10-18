import type { MenuBarMenu, MenuItemDef } from '@megablacklabel/react98retro';
import { CHECK_COLOR_IDS } from '../check-colors';
import { TOOLBAR_COMMANDS } from '../main/toolbar-commands';
import { CCATALOG_MENUS, MENU_COMMANDS, type CatalogMenuItem } from './menu-defs';

/**
 * 元実装の「ウィンドウ」メニューは表示中の子ウィンドウから実行時に組み立てられるため、
 * RT_MENU リソースにはダミー項目しか入っていない (CHM 1WINDOW/7MENU.HTM の並びを再現)。
 * 600xx は Web 版だけが使うアプリ内コマンド ID。
 */
export const WINDOW_MENU_COMMANDS = {
  detail: 60001,
  list: 60002,
  checklist: 60003,
  map: 60004,
  bringToFront: 60005,
  resetPositions: 60006,
} as const;

/**
 * 「チェックリスト > 標準のチェック色」のコマンド ID の先頭。色1〜色9 が 33101..33109
 * (元実装は実行時に色 1〜9 を並べるので、RT_MENU にはダミーの 1 項目しか無い)。
 */
export const CHECK_COLOR_COMMAND_BASE = 33100;

/** 「表示 > ツールバー」の 5 本 (メインウィンドウのドッキング ツールバー)。 */
export const TOOLBAR_BARS = [
  { id: 'basic', menuCommand: 32839, label: '基本バー(B)' },
  { id: 'jump', menuCommand: 32840, label: 'ページ移動バー(J)' },
  { id: 'view', menuCommand: 32841, label: '表示バー(D)' },
  { id: 'check', menuCommand: 32842, label: 'チェックバー(C)' },
  { id: 'nav', menuCommand: 32847, label: 'ナビゲートバー(N)' },
] as const;

export type ToolbarBarId = (typeof TOOLBAR_BARS)[number]['id'];

/** メニューのチェック印を付けるコマンド (オン / オフが分かるようにする)。 */
export type MenuState = {
  /** 表示中のツールバー。 */
  visibleBars: readonly ToolbarBarId[];
  /** オンになっているトグルのコマンド ID。 */
  checked: readonly number[];
  /** サークルカットを選択中か。選択が要る項目 (追加 / 外す / メモ編集 / コピー) の活性に使う。 */
  hasSelection: boolean;
};

/**
 * チェックリスト メニューが送るコマンド (元実装の WM_COMMAND) のうち、他の定義に無いもの。
 * RT_MENU 128 のチェックリスト メニューはダミーで、実機は実行時に組み立てるため、
 * 実機のメニュー ダンプ (`解析/ui_capture/menus.tsv`) の ID をここに持つ。
 */
export const CHECKLIST_MENU_COMMANDS = {
  /** チェックなしサークルのメモを消去する。 */
  clearUncheckedMemos: 32869,
  /** 全てのメモを消去する。 */
  clearAllMemos: 32874,
  /** 選択サークルをクリップボードにコピーする。 */
  copyCircle: 1707,
  /** クリップボードからチェックリストにペーストする。 */
  pasteCircle: 1708,
} as const;

const WINDOW_MENU_ITEMS: CatalogMenuItem[] = [
  { type: 'item', label: 'サークル詳細(&D)', command: WINDOW_MENU_COMMANDS.detail },
  { type: 'item', label: 'サークル一覧(&L)', command: WINDOW_MENU_COMMANDS.list },
  { type: 'item', label: 'チェックリスト(&C)', command: WINDOW_MENU_COMMANDS.checklist },
  { type: 'item', label: '会場マップ(&M)', command: WINDOW_MENU_COMMANDS.map },
  { type: 'separator' },
  { type: 'item', label: '子ウィンドウを前面に表示(&F)', command: WINDOW_MENU_COMMANDS.bringToFront },
  { type: 'item', label: 'ウィンドウ位置を初期化(&R)', command: WINDOW_MENU_COMMANDS.resetPositions },
];

/** 標準のチェック色 (元実装は実行時に色 1〜9 を並べる)。 */
function checkColorItems(
  onCommand: (command: number) => void,
  current: number,
): MenuItemDef[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((color) => ({
    type: 'item',
    label: `色${color}`,
    checked: color === current,
    onClick: () => onCommand(CHECK_COLOR_COMMAND_BASE + color),
  }));
}

/**
 * チェックリスト メニュー (実機の並び)。
 *
 * RT_MENU 128 のチェックリスト メニューは「標準のチェック色」のダミー 1 項目だけで、
 * 実機は実行時に組み立てる (CHM 1WINDOW/7MENU.HTM の並び、実機のメニュー ダンプ
 * `解析/ui_capture/menus.tsv` の ID、ユーザー提供のスクリーンショットのラベルとショートカット)。
 * 選択中のサークルが要る項目 (追加 / 外す / メモ編集 / コピー) は、サークルカットを
 * 選んでいないとき灰色にする。
 */
function checklistItems(
  onCommand: (command: number) => void,
  state: MenuState,
  checkColor: number,
): MenuItemDef[] {
  // 選択中のサークルが要る項目 (追加 / 外す / メモ編集 / コピー) は、サークルカットを
  // 選んでいないとき灰色にする。
  const needsSelection = !state.hasSelection;
  return [
    {
      type: 'item',
      // 実機のショートカット表示は Enter (サークルカットのリターンキーと同じ)。
      label: '標準色で追加(A)',
      shortcut: 'Enter',
      disabled: needsSelection,
      onClick: () => onCommand(TOOLBAR_COMMANDS.checkAddStandardColor),
    },
    { type: 'separator' },
    ...CHECK_COLOR_IDS.map((color) => ({
      type: 'item' as const,
      // 実機は色の見本 (色矩形) を項目の左に出すが、ライブラリのメニュー項目は
      // icon を描かないので Web 版はラベルとショートカットだけにする (README の制約に記載)。
      label: `色${color}で追加`,
      shortcut: String(color),
      disabled: needsSelection,
      onClick: () => onCommand(TOOLBAR_COMMANDS.checkColorBase + color),
    })),
    { type: 'separator' },
    {
      type: 'item',
      label: 'チェックリストから外す(R)',
      shortcut: '0',
      disabled: needsSelection,
      onClick: () => onCommand(TOOLBAR_COMMANDS.checkRemove),
    },
    { type: 'separator' },
    { type: 'submenu', label: '標準のチェック色(D)', items: checkColorItems(onCommand, checkColor) },
    {
      type: 'item',
      label: 'チェック色の編集(E)...',
      onClick: () => onCommand(TOOLBAR_COMMANDS.colorEdit),
    },
    { type: 'separator' },
    {
      type: 'item',
      label: 'サークルのメモを編集する(M)',
      shortcut: 'Ctrl+T',
      disabled: needsSelection,
      onClick: () => onCommand(MENU_COMMANDS.memoEdit),
    },
    {
      type: 'item',
      label: 'チェックなしサークルのメモを消去する',
      onClick: () => onCommand(CHECKLIST_MENU_COMMANDS.clearUncheckedMemos),
    },
    {
      type: 'item',
      label: '全てのメモを消去する',
      onClick: () => onCommand(CHECKLIST_MENU_COMMANDS.clearAllMemos),
    },
    { type: 'separator' },
    {
      type: 'item',
      label: '選択サークルをクリップボードにコピー(C)',
      disabled: needsSelection,
      onClick: () => onCommand(CHECKLIST_MENU_COMMANDS.copyCircle),
    },
    {
      type: 'item',
      label: 'クリップボードからチェックリストにペースト(P)',
      onClick: () => onCommand(CHECKLIST_MENU_COMMANDS.pasteCircle),
    },
  ];
}

/** 表示するツールバー 5 本のオン / オフ。 */
function toolbarBarItems(
  onCommand: (command: number) => void,
  state: MenuState,
): MenuItemDef[] {
  return TOOLBAR_BARS.map((bar) => ({
    type: 'item',
    label: bar.label,
    checked: state.visibleBars.includes(bar.id),
    onClick: () => onCommand(bar.menuCommand),
  }));
}

/**
 * 生成済みメニュー定義 (RT_MENU 128 由来) を react98retro の MenuBar 形式へ変換する。
 * `command` は元実装の WM_COMMAND ID なので、アプリ側は onCommand 1 本で処理できる。
 *
 * `state` を渡すと、実行時に作られるメニュー (チェックリスト / ツールバー) を
 * アプリの状態から作り、トグルの項目にチェック印を付ける。
 */
export function toMenuBarMenus(
  onCommand: (command: number) => void,
  state?: MenuState,
  checkColor?: number,
): MenuBarMenu[] {
  const convert = (items: CatalogMenuItem[]): MenuItemDef[] =>
    items.map((item) => {
      if (item.type === 'separator') return { type: 'separator' };
      if (item.type === 'submenu') {
        if (state !== undefined && item.label.startsWith('ツールバー')) {
          return { type: 'submenu', label: item.label, items: toolbarBarItems(onCommand, state) };
        }
        return { type: 'submenu', label: item.label, disabled: item.disabled, items: convert(item.items) };
      }
      return {
        type: 'item',
        label: item.label,
        shortcut: item.shortcut,
        disabled: item.disabled,
        checked: item.checked || (state?.checked.includes(item.command) ?? false),
        onClick: () => onCommand(item.command),
      };
    });

  return CCATALOG_MENUS.map((menu) => {
    if (menu.label.startsWith('ウィンドウ')) {
      return { label: menu.label, items: convert(WINDOW_MENU_ITEMS) };
    }
    // チェックリスト メニューは実行時に組み立てる (RT_MENU はダミー項目だけ)。
    if (menu.label.startsWith('チェックリスト') && state !== undefined) {
      return { label: menu.label, items: checklistItems(onCommand, state, checkColor ?? 0) };
    }
    return { label: menu.label, items: convert(menu.items) };
  });
}
