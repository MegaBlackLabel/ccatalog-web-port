import { ComponentPropsWithoutRef, ReactNode } from 'react';
export interface DropdownOption {
    value: string;
    label: ReactNode;
}
export interface DropdownProps extends ComponentPropsWithoutRef<'select'> {
    options?: DropdownOption[];
    children?: ReactNode;
}
export declare const Dropdown: import('react').ForwardRefExoticComponent<DropdownProps & import('react').RefAttributes<HTMLSelectElement>>;
