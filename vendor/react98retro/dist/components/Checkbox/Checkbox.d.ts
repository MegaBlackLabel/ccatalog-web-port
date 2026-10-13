import { ComponentPropsWithoutRef, ReactNode } from 'react';
export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'id'> {
    /** 省略可。label がある場合のみ内部的に生成される */
    id?: string;
    /** 省略すると label 要素を描画しない (aria-label 等で名前を付ける) */
    label?: ReactNode;
    stacked?: boolean;
}
export declare const Checkbox: import('react').ForwardRefExoticComponent<CheckboxProps & import('react').RefAttributes<HTMLInputElement>>;
