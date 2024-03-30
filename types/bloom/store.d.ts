import type { Effect } from '@oscarpalmer/sentinel';
import type { EventData } from './event';
type Parameters = {
    effect: Effect;
    event: EventData;
};
export declare function disableNode(node: Node): void;
export declare function enableNode(node: Node): void;
export declare function removeNode(node: Node): void;
export declare function storeNode(node: Node, data: Partial<Parameters>): void;
export {};
