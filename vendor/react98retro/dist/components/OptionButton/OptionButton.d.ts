import { ComponentPropsWithoutRef, ReactNode } from 'react';
export interface OptionButtonProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'id' | 'name'> {
    /** 省略可。label がある場合のみ内部的に生成される */
    id?: string;
    name: string;
    /** 省略すると label 要素を描画しない (aria-label 等で名前を付ける) */
    label?: ReactNode;
    stacked?: boolean;
}
export declare const OptionButton: import('react').ForwardRefExoticComponent<OptionButtonProps & import('react').RefAttributes<HTMLInputElement>>;
