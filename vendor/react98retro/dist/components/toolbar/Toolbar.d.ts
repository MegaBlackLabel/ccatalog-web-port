import { MenuItem } from '../menu/Menu';
export type { MenuItem };
export type ToolbarItemDef = {
    type: 'button';
    id: string;
    icon?: string;
    label?: string;
    tooltip?: string;
    onClick?: () => void;
    disabled?: boolean;
    pressed?: boolean;
} | {
    type: 'separator';
} | {
    type: 'dropdown';
    id: string;
    icon?: string;
    label?: string;
    tooltip?: string;
    items: MenuItem[];
    disabled?: boolean;
} | {
    type: 'splitButton';
    id: string;
    icon: string;
    label?: string;
    tooltip?: string;
    disabled?: boolean;
    items: MenuItem[];
};
export type ToolbarProps = {
    items: ToolbarItemDef[];
    /**
     * `band` はツールバー帯 (ドッキング ツールバー) に詰める形。内容を実物の
     * ツールバー ボタンと同じ 22px ちょうどにして、上下の 1px を外す。
     * 帯の中で使うときは `ToolbarBand` と組み合わせる。
     */
    variant?: 'plain' | 'band';
} & React.ComponentPropsWithoutRef<'div'>;
export declare const Toolbar: import('react').ForwardRefExoticComponent<{
    items: ToolbarItemDef[];
    /**
     * `band` はツールバー帯 (ドッキング ツールバー) に詰める形。内容を実物の
     * ツールバー ボタンと同じ 22px ちょうどにして、上下の 1px を外す。
     * 帯の中で使うときは `ToolbarBand` と組み合わせる。
     */
    variant?: "plain" | "band";
} & Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & import('react').RefAttributes<HTMLDivElement>>;
