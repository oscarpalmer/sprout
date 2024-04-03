type Bloom = {
    grow(): Node;
};
export declare function bloom(strings: TemplateStringsArray, ...expressions: unknown[]): Bloom;
export declare function isBloom(value: unknown): value is Bloom;
export {};
