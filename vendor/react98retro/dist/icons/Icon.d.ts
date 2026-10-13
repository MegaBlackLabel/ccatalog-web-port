import { CSSProperties } from 'react';
import { IconName, IconSize } from './icons';
export type IconProps = {
    name: IconName;
    size?: IconSize;
    alt?: string;
    className?: string;
    style?: CSSProperties;
};
export declare function Icon({ name, size, alt, className, style }: IconProps): import('react').JSX.Element;
