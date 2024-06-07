import type { StoredParameters } from './models';
export declare function disableStoredNode(node: Node, remove?: boolean): void;
export declare function enableStoredNode(node: Node): void;
export declare function storeNode(node: Node, data: Partial<StoredParameters>): void;
