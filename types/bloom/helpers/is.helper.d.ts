import type { Bloom } from '../models';
export declare function isBadAttribute(attribute: Attr): boolean;
export declare function isBloom(value: unknown): value is Bloom;
export declare function isStylableElement(element: Element): element is HTMLElement | SVGElement;
