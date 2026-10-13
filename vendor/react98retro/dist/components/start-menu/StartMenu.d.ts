import { ComponentPropsWithoutRef, ReactElement } from 'react';
export type StartMenuItem = {
    type: 'item';
    label: string;
    icon?: string;
    disabled?: boolean;
    onClick?: () => void;
} | {
    type: 'separator';
} | {
    type: 'submenu';
    label: string;
    icon?: string;
    items: StartMenuItem[];
};
export type StartMenuProps = {
    items: StartMenuItem[];
    onClose?: () => void;
    /** 左端の縦帯に出す文字 (既定 'Windows 98') */
    bannerText?: string;
    /** パネル幅 (既定 200) */
    width?: number;
    /**
     * 外側クリック判定から除外する要素のセレクタ。
     * スタート ボタンのように「メニューの外にあるが開閉トグルを持つ」要素を指定する。
     * 指定しないと、ボタンの mousedown で閉じた直後の click が再度開いてしまう。
     */
    ignoreOutsidePressSelector?: string;
} & ComponentPropsWithoutRef<'div'>;
export declare function StartMenu({ items, onClose, bannerText, width, ignoreOutsidePressSelector, className, style, ...rest }: StartMenuProps): ReactElement;
export declare namespace StartMenu {
    var displayName: string;
}
