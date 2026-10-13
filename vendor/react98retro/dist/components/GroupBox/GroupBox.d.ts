import { ComponentPropsWithoutRef, ReactNode } from 'react';
export interface GroupBoxProps extends ComponentPropsWithoutRef<'fieldset'> {
    legend?: ReactNode;
}
export declare const GroupBox: import('react').ForwardRefExoticComponent<GroupBoxProps & import('react').RefAttributes<HTMLFieldSetElement>>;
