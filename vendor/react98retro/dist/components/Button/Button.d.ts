import { ComponentPropsWithoutRef } from 'react';
export interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
    variant?: 'default' | 'standard';
}
export declare const Button: import('react').ForwardRefExoticComponent<ButtonProps & import('react').RefAttributes<HTMLButtonElement>>;
