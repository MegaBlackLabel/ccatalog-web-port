export type AddressBarItem = {
    path: string;
    icon?: string;
    label?: string;
};
export type AddressBarProps = {
    value: string;
    onChange?: (value: string) => void;
    onNavigate?: (path: string) => void;
    history?: AddressBarItem[];
    label?: string;
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'>;
export declare function AddressBar({ value, onChange, onNavigate, history, label, className, ...rest }: AddressBarProps): import('react').JSX.Element;
export declare namespace AddressBar {
    var displayName: string;
}
