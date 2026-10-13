import { CSSProperties, ReactNode } from 'react';
export interface WindowProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'title' | 'style' | 'className' | 'children'> {
    title: string;
    icon?: string;
    children?: ReactNode;
    statusBar?: ReactNode;
    width?: number;
    height?: number;
    initialX?: number;
    initialY?: number;
    inactive?: boolean;
    minimized?: boolean;
    maximized?: boolean;
    /** モーダルダイアログとして扱う (role="dialog"/aria-modal、背景ブロック、Escape で onClose) */
    modal?: boolean;
    onMinimize?: () => void;
    onMaximize?: () => void;
    onRestore?: () => void;
    onClose?: () => void;
    snapEnabled?: boolean;
    snapThreshold?: number;
    autoMoveOnSnap?: boolean;
    style?: CSSProperties;
    className?: string;
    zIndex?: number;
    windowId?: string;
}
export declare function Window({ title, icon, children, statusBar, width, height, initialX, initialY, inactive, minimized: minimizedProp, maximized: maximizedProp, modal, onMinimize, onMaximize, onRestore, onClose, snapEnabled: snapEnabledProp, snapThreshold, autoMoveOnSnap: autoMoveOnSnapProp, style, className, zIndex, windowId, ...rest }: WindowProps): import('react').JSX.Element | null;
