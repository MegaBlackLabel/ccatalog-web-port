import { ComponentPropsWithoutRef, ReactNode } from 'react';
export type TabItem = {
    id: string;
    label: string;
    content: ReactNode;
    disabled?: boolean;
};
export type TabsProps = {
    tabs: TabItem[];
    activeTab?: string;
    defaultActiveTab?: string;
    onTabChange?: (id: string) => void;
    multirows?: boolean;
    /** 親の高さに追従させる (root を flex column にする) */
    fill?: boolean;
    /** タブパネル (.window) に足すクラス */
    panelClassName?: string;
} & ComponentPropsWithoutRef<'div'>;
export declare const Tabs: import('react').ForwardRefExoticComponent<{
    tabs: TabItem[];
    activeTab?: string;
    defaultActiveTab?: string;
    onTabChange?: (id: string) => void;
    multirows?: boolean;
    /** 親の高さに追従させる (root を flex column にする) */
    fill?: boolean;
    /** タブパネル (.window) に足すクラス */
    panelClassName?: string;
} & Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & import('react').RefAttributes<HTMLDivElement>>;
