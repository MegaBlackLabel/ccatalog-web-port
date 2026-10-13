import { ComponentPropsWithoutRef, ReactNode, RefAttributes, ReactElement } from 'react';
export type TableSortDirection = 'asc' | 'desc';
export type TableSortState<T> = {
    columnKey: keyof T | null;
    direction: TableSortDirection;
};
export type TableColumn<T> = {
    key: keyof T;
    header: string;
    width?: number | string;
    render?: (value: T[keyof T], row: T) => ReactNode;
};
export type TableRowId = string | number;
export type TableViewProps<T extends {
    id: TableRowId;
}> = {
    columns: readonly TableColumn<T>[];
    rows: readonly T[];
    /** 数値 id も受け付け、内部では文字列に正規化する */
    selectedIds?: readonly TableRowId[];
    onSelectionChange?: (ids: string[]) => void;
    onRowDoubleClick?: (row: T) => void;
    /** 行の右クリック。渡すとブラウザ既定のコンテキスト メニューを抑制する */
    onRowContextMenu?: (row: T, event: React.MouseEvent<HTMLTableRowElement>) => void;
    sort?: TableSortState<T>;
    onSortChange?: (sort: TableSortState<T>) => void;
    interactive?: boolean;
    height?: number | string;
} & ComponentPropsWithoutRef<'div'>;
export declare const TableView: <T extends {
    id: TableRowId;
}>(props: TableViewProps<T> & RefAttributes<HTMLDivElement>) => ReactElement;
