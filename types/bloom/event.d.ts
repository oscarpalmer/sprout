export type EventData = {
    element: Element;
    listener: EventListener;
} & Parameters;
type Parameters = {
    name: string;
    options: AddEventListenerOptions;
};
export declare function addEvent(element: Element, attribute: string, value: unknown): void;
export {};
