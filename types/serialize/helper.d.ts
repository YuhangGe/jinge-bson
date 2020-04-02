export declare type Dict = {
    /**
     * array-buffer of TextEncoder.encode
     */
    b: ArrayBuffer;
    /**
     * count of string
     */
    c: number;
    /**
     * index of string
     */
    i: number;
};
export declare class Context {
    /**
     * buffer page size
     */
    p: number;
    /**
     * global string dictionary
     */
    d: Map<string, Dict>;
    /**
     * current data-view
     */
    v: DataView;
    /**
     * offset of current data-view
     */
    o: number;
    constructor(bufferPageSize: number);
}
declare global {
    interface ArrayBufferConstructor {
        transfer: (source: ArrayBuffer, length: number) => ArrayBuffer;
    }
}
export declare function transferArrayBuffer(source: ArrayBuffer, length: number): ArrayBuffer;
export declare function prepareArrayBuffer(ctx: Context, size: number): void;
export declare function getByteSizeOfInteger(v: number | bigint): number;
export declare function getType(v: unknown): string;
/**
 * 判断数组里的项目是否全部相同。“相同”的定义如下：
 * 1. 项目的类型全都不是 object（但可以是 null） 或 array，且项目的【类型】和【值】全都相同。或者，
 * 2. 项目的值的类型全部是 object，且所有对象的 properties 完全一致，
 *    且相同名称的 property 的值有相同的类型且类型不是 object（但可以是 null） 或 array。
 *
 * @param v Array
 */
export declare function isArrayItemsSame(v: unknown[]): boolean;
