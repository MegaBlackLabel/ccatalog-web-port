import { ReactNode, CSSProperties } from 'react';
export interface Win98ProviderProps {
    children: ReactNode;
    style?: CSSProperties;
    className?: string;
    autoMoveOnSnap?: boolean;
    /** Enable mobile-responsive behavior (cascading, snap defaults) */
    mobile?: boolean;
}
/**
 * Win98Provider — 98.css のスタイルを .win98 クラス配下にスコープするラッパー。
 * このコンポーネントで囲んだ要素にのみ Win98 スタイルが適用されます。
 */
export declare function Win98Provider({ children, style, className, autoMoveOnSnap, mobile }: Win98ProviderProps): import('react').JSX.Element;
