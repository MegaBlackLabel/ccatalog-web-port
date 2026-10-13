export type MenuItem = {
    type?: 'item';
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    checked?: boolean;
    children?: MenuItem[];
} | {
    type: 'separator';
};
export type MenuProps = {
    items: MenuItem[];
    onClose?: () => void;
    className?: string;
} & React.ComponentPropsWithoutRef<'div'>;
export declare function Menu({ items, onClose, className, ...rest }: MenuProps): import('react').JSX.Element;
export declare namespace Menu {
    var displayName: string;
}
