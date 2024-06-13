import type { ProperElement } from '../models';
export declare const booleanAttributes: Set<string>;
export declare function setBooleanAttribute(element: ProperElement, name: string, value: unknown): void;
export declare function setSelectedAttribute(element: ProperElement): (element: ProperElement, name: string, value: unknown) => void;
