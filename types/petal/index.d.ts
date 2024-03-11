export declare class Petal {
    readonly element: Element;
    constructor(element: Element);
    connected(): void;
    disconnected(): void;
}
type Bud = new (element: Element) => Petal;
export declare function petal(name: string, bud: Bud): void;
export {};
