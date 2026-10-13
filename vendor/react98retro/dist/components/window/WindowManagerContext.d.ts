import { UseWindowManagerResult } from '../../hooks/useWindowManager';
export interface WindowManagerContextValue extends UseWindowManagerResult {
    /** True when the viewport is mobile-sized (< 640px). Provided by Win98Provider. */
    isMobile: boolean;
}
export declare const WindowManagerContext: import('react').Context<WindowManagerContextValue | null>;
export declare function useWindowManagerContext(): WindowManagerContextValue | null;
/** Convenience: returns isMobile from the nearest Win98Provider, or false if none. */
export declare function useIsMobile(): boolean;
