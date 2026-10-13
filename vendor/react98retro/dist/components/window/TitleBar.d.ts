export interface TitleBarProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    icon?: string;
    inactive?: boolean;
    onMinimize?: () => void;
    onMaximize?: () => void;
    onRestore?: () => void;
    onClose?: () => void;
    onHelp?: () => void;
    maximizeDisabled?: boolean;
    isMaximized?: boolean;
    isMinimized?: boolean;
}
export declare const TitleBar: import('react').ForwardRefExoticComponent<TitleBarProps & import('react').RefAttributes<HTMLDivElement>>;
