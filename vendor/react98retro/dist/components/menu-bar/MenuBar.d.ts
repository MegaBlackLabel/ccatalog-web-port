export type MenuItemDef = {
    type: 'item';
    label: string;
    shortcut?: string;
    onClick?: () => void;
    disabled?: boolean;
    checked?: boolean;
    icon?: string;
} | {
    type: 'separator';
} | {
    type: 'submenu';
    label: string;
    disabled?: boolean;
    items: MenuItemDef[];
};
export type MenuBarMenu = {
    /** テスト用の安定 ID (`data-menu-id` に出力)。省略時は label を使う */
    id?: string;
    label: string;
    items: MenuItemDef[];
};
export type MenuBarProps = {
    menus: MenuBarMenu[];
    rightIcons?: string[];
} & React.ComponentPropsWithoutRef<'div'>;
export declare function MenuBar({ menus, rightIcons, className, ...rest }: MenuBarProps): import('react').JSX.Element;
export declare namespace MenuBar {
    var displayName: string;
}
