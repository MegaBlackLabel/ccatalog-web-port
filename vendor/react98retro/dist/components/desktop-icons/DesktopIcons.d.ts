import { ReactElement } from 'react';
export type DesktopIconItem = {
    id: string;
    label: string;
    /** アイコン画像 URL (32x32 を表示) */
    icon: string;
    x: number;
    y: number;
};
export type DesktopIconsProps = {
    items: readonly DesktopIconItem[];
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
    onOpen?: (id: string) => void;
    /** ドラッグ終了時 (グリッド吸着後の座標) */
    onMove?: (id: string, position: {
        x: number;
        y: number;
    }) => void;
    /** アイコン 1 個のセルサイズ (既定 75) */
    gridSize?: number;
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'onSelect'>;
export declare function DesktopIcons({ items, selectedId, onSelect, onOpen, onMove, gridSize, className, onClick, onPointerMove, onPointerUp, onPointerCancel, ...rest }: DesktopIconsProps): ReactElement;
export declare namespace DesktopIcons {
    var displayName: string;
}
