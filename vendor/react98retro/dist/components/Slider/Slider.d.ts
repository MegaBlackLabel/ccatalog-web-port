import { ComponentPropsWithoutRef } from 'react';
export interface SliderProps extends ComponentPropsWithoutRef<'input'> {
    boxIndicator?: boolean;
    vertical?: boolean;
}
export declare const Slider: import('react').ForwardRefExoticComponent<SliderProps & import('react').RefAttributes<HTMLInputElement>>;
