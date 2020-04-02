export declare type SerializeOptions = {
    bufferPageSize?: number;
    floatPrecision?: 'single' | 'double';
};
export declare function serialize(data: unknown, { bufferPageSize, floatPrecision }?: SerializeOptions): ArrayBuffer;
