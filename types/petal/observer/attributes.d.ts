import type { Context } from '../controller/context';
type ChangeCallback = (element: Element, name: string, value: string, added: boolean) => void;
type HandleParameters = {
    added: boolean;
    callbacks: Record<string, ChangeCallback>;
    element: Element;
    name: string;
    value: string;
};
export declare function handleActionAttribute(element: Element, _: string, value: string, added: boolean): void;
export declare function handleAttributeChanges(parameters: HandleParameters): void;
export declare function handleControllerAttribute(element: Element, _: string, value: string, added: boolean): void;
export declare function handleDataAttribute(context: Context, name: string, value: string): void;
export declare function handleAttributes(context: Context): void;
export declare function handleInputAttribute(element: Element, _: string, value: string, added: boolean): void;
export declare function handleOutputAttribute(element: Element, _: string, value: string, added: boolean): void;
export declare function handleTargetAttribute(element: Element, _: string, value: string, added: boolean): void;
export {};
