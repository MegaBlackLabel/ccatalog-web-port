import { MenuItem } from '../menu/Menu';
export type { MenuItem };
export type SplitButtonProps = {
    /** アイコン画像のURL */
    icon: string;
    /** アクセシビリティ用ラベル */
    label?: string;
    /** ツールチップ */
    tooltip?: string;
    /** 無効状態 */
    disabled?: boolean;
    /** ドロップダウンメニューアイテム */
    items: MenuItem[];
    className?: string;
};
export declare function SplitButton({ icon, label, tooltip, disabled, items, className, }: SplitButtonProps): import('react').JSX.Element;
export declare namespace SplitButton {
    var displayName: string;
}
