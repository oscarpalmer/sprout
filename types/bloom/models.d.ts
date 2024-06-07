import type { Effect } from '@oscarpalmer/sentinel';
export type BloomData = {
    expressions: unknown[];
    identifier?: number | string;
    html: string;
    nodes: Node[];
    strings: TemplateStringsArray;
    values: unknown[];
};
export type Bloom = {
    /**
     * The identifier of the Bloom
     */
    readonly id?: number | string;
    /**
     * Renders and returns the Bloom
     */
    grow(): Node;
    /**
     * Sets the identifier of the Bloom
     */
    identify(identifier: number | string): Bloom;
    /**
     * Destroys the Bloom
     */
    wither(): void;
};
export type EventData = {
    element: Element;
    listener: EventListener;
} & EventParameters;
export type EventParameters = {
    name: string;
    options: AddEventListenerOptions;
};
export type IdentifiedNodes = {
    identifier?: number | string;
    nodes: ChildNode[];
};
export type StoredData = {
    effects: Set<Effect>;
    events: Map<string, Map<EventListener, EventData>>;
};
export type StoredParameters = {
    effect: Effect;
    event: EventData;
};
