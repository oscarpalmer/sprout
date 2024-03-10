export declare class Controller {
    readonly element: Element;
    constructor(element: Element);
}
type Constructor = new (element: Element) => Controller;
export declare function controller(name: string, value: Constructor): void;
export {};
