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

const WINDOW_MENU_ITEMS: CatalogMenuItem[] = [
  { type: 'item', label: 'サークル詳細(&D)', command: WINDOW_MENU_COMMANDS.detail },
  { type: 'item', label: 'サークル一覧(&L)', command: WINDOW_MENU_COMMANDS.list },
  { type: 'item', label: 'チェックリスト(&C)', command: WINDOW_MENU_COMMANDS.checklist },
  { type: 'item', label: '会場マップ(&M)', command: WINDOW_MENU_COMMANDS.map },
  { type: 'separator' },
  { type: 'item', label: '子ウィンドウを前面に表示(&F)', command: WINDOW_MENU_COMMANDS.bringToFront },
  { type: 'item', label: 'ウィンドウ位置を初期化(&R)', command: WINDOW_MENU_COMMANDS.resetPositions },
];

/**
 * 生成済みメニュー定義 (RT_MENU 128 由来) を react98retro の MenuBar 形式へ変換する。
 * `command` は元実装の WM_COMMAND ID なので、アプリ側は onCommand 1 本で処理できる。
 */
export function toMenuBarMenus(onCommand: (command: number) => void): MenuBarMenu[] {
  const convert = (items: CatalogMenuItem[]): MenuItemDef[] =>
    items.map((item) => {
      if (item.type === 'separator') return { type: 'separator' };
      if (item.type === 'submenu') {
        return { type: 'submenu', label: item.label, disabled: item.disabled, items: convert(item.items) };
      }
      return {
        type: 'item',
        label: item.label,
        shortcut: item.shortcut,
        disabled: item.disabled,
        checked: item.checked,
        onClick: () => onCommand(item.command),
      };
    });

  return CCATALOG_MENUS.map((menu) =>
    menu.label.startsWith('ウィンドウ')
      ? { label: menu.label, items: convert(WINDOW_MENU_ITEMS) }
      : { label: menu.label, items: convert(menu.items) },
  );
}
