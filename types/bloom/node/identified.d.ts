import type { Bloom, IdentifiedNodes } from '../models';
export declare function createIdentified(template: Bloom): IdentifiedNodes;
export declare function createIdentifieds(value: Node | Node[]): IdentifiedNodes[];
export declare function replaceIdentified(from: IdentifiedNodes[], to: IdentifiedNodes[], setNodes: boolean): IdentifiedNodes[] | null;
export declare function updateIdentified(identified: IdentifiedNodes[], identifiers: (number | string)[], templates: Bloom[]): IdentifiedNodes[];
