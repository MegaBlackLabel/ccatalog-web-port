import type { MenuBarMenu, MenuItemDef } from '@megablacklabel/react98retro';
import { CCATALOG_MENUS, type CatalogMenuItem } from './menu-defs';

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
};

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
 * `state` を渡すと、実行時に作られるサブメニュー (標準のチェック色 / ツールバー) を
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
        if (state !== undefined && item.label.startsWith('標準のチェック色')) {
          return {
            type: 'submenu',
            label: item.label,
            items: checkColorItems(onCommand, checkColor ?? 0),
          };
        }
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

  return CCATALOG_MENUS.map((menu) =>
    menu.label.startsWith('ウィンドウ')
      ? { label: menu.label, items: convert(WINDOW_MENU_ITEMS) }
      : { label: menu.label, items: convert(menu.items) },
  );
}
