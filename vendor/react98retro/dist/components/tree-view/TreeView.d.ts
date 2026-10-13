import { ComponentPropsWithoutRef, ReactNode } from 'react';
export type TreeViewItem = {
    id: string;
    label: ReactNode;
    icon?: string;
    children?: TreeViewItem[];
    defaultOpen?: boolean;
};
export type TreeViewProps = {
    items: TreeViewItem[];
    selectedId?: string;
    onSelect?: (id: string) => void;
} & ComponentPropsWithoutRef<'ul'>;
export declare const TreeView: import('react').ForwardRefExoticComponent<{
    items: TreeViewItem[];
    selectedId?: string;
    onSelect?: (id: string) => void;
} & Omit<import('react').DetailedHTMLProps<import('react').HTMLAttributes<HTMLUListElement>, HTMLUListElement>, "ref"> & import('react').RefAttributes<HTMLUListElement>>;
