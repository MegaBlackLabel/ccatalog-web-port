export type TaskbarItem = {
    id: string;
    title: string;
    icon?: string;
    /** 最前面ウィンドウ */
    active?: boolean;
    /** 最小化中 (タスクバーには残る) */
    minimized?: boolean;
};
export type TaskbarProps = {
    /** 左から並ぶタスクボタン。押下で onItemClick(id) */
    items?: readonly TaskbarItem[];
    onItemClick?: (id: string) => void;
    onStartClick?: () => void;
    /** トレイの時計表示。省略時は現在時刻を HH:MM (24時間) で出し、1 分ごとに更新 */
    clock?: string;
    showTray?: boolean;
} & React.ComponentPropsWithoutRef<'div'>;
export declare function Taskbar({ items, onItemClick, onStartClick, clock, showTray, className, ...rest }: TaskbarProps): import('react').JSX.Element;
