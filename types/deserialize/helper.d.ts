export declare class Context {
    /**
     * global string dictionary
     */
    d: string[];
    /**
     * current data-view
     */
    v: DataView;
    /**
     * offset of current data-view
     */
    o: number;
    constructor(buffer: ArrayBuffer);
}
export declare function decodeString(buffer: ArrayBuffer): string;
