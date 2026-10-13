import { ComponentPropsWithoutRef } from 'react';
export interface FieldRowProps extends ComponentPropsWithoutRef<'div'> {
    stacked?: boolean;
}
export declare const FieldRow: import('react').ForwardRefExoticComponent<FieldRowProps & import('react').RefAttributes<HTMLDivElement>>;
