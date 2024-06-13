import type { Key } from '@oscarpalmer/atoms/models';
import type { Effect } from '@oscarpalmer/sentinel';
export type BloomData = {
    expressions: unknown[];
    identifier?: Key;
    html: string;
    nodes: Node[];
    strings: TemplateStringsArray;
    values: unknown[];
};
export type Bloom = {
    /**
     * The identifier of the Bloom
     */
    readonly id?: Key;
    /**
     * Renders and returns the Bloom
     */
    grow(): Node;
    /**
     * Sets the identifier of the Bloom
     */
    identify(identifier: Key): Bloom;
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
    identifier?: Key;
    nodes: ChildNode[];
};
export type ProperElement = HTMLElement | SVGElement;
export type StoredData = {
    effects: Set<Effect>;
    events: Map<string, Map<EventListener, EventData>>;
};
export type StoredParameters = {
    effect: Effect;
    event: EventData;
};
