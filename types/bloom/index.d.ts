declare class Bloom {
    private readonly data;
    constructor(strings: TemplateStringsArray, ...expressions: unknown[]);
    grow(): Node;
}
export declare function bloom(strings: TemplateStringsArray, ...expressions: unknown[]): Bloom;
export declare function isBloom(value: unknown): value is Bloom;
export {};
