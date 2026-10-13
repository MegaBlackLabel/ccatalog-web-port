import { ComponentPropsWithoutRef, ReactNode } from 'react';
export interface TextAreaProps extends Omit<ComponentPropsWithoutRef<'textarea'>, 'id'> {
    /** 省略可。label がある場合のみ内部的に生成される */
    id?: string;
    /** 省略すると label 要素を描画しない (aria-label 等で名前を付ける) */
    label?: ReactNode;
    stacked?: boolean;
}
export declare const TextArea: import('react').ForwardRefExoticComponent<TextAreaProps & import('react').RefAttributes<HTMLTextAreaElement>>;
