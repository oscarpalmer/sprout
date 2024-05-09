type Handlers = {
    handleAttribute(element: Element, name: string, value: string, removed: boolean): void;
    handleElement(element: Element, added: boolean): void;
};
export type Observer = {
    handleNodes(nodes: NodeList | Node[], added: boolean): void;
    start(): void;
    stop(): void;
    update(): void;
} & Handlers;
export declare const options: MutationObserverInit;
export declare function getAttributes(from: string, to: string): string[][];
export declare function createObserver(element: Element, options: MutationObserverInit, handlers: Handlers): Observer;
export {};
