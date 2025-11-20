declare class ZstdBuffer {
    positionPtr: number;
    size: number;
    dataPtr: number;
    constructor(positionPtr: number, size: number, dataPtr: number);
}
declare class ZstdStreamDec {
    protected static readonly positionSize: number;
    private static isDecompressInit;
    private static inputSize;
    private static outputSize;
    private static zstdDStreamInSize;
    private static zstdDStreamOutSize;
    private static zstdCreateDStream;
    private static zstdInitDStream;
    private static zstdFreeDStream;
    private static zstdDecompressStreamSimpleArgs;
    static decompress(payload: Uint8Array): Uint8Array;
    protected static calculateReadBytes: (filePos: number, toRead: number, payload: Uint8Array) => number;
    protected static getDataFromTransformation(output: ZstdBuffer, result: Uint8Array): Uint8Array;
    private static initDecompressFunctions;
}
declare class ZstdSimpleDec {
    protected static zstdFrameHeaderSizeMax: number;
    private static isDecompressInit;
    private static zstdDecompress;
    private static zstdGetFrameContentSize;
    static decompress(payload: Uint8Array): Uint8Array;
    protected static initDecompressFunctions(): void;
    protected static createArrayPointer(arr: Uint8Array, len: number): number;
}
interface ZstdDec {
    ZstdSimple: typeof ZstdSimpleDec;
    ZstdStream: typeof ZstdStreamDec;
}
declare module ZstdSimpleDecWrapper {
    export { ZstdSimpleDec };
}
declare module ZstdStreamDecWrapper {
    export { ZstdStreamDec };
}
declare function ZstdInit(): Promise<ZstdDec>;
export { ZstdSimpleDec as ZstdSimple, ZstdStreamDec as ZstdStream, ZstdDec, ZstdInit };
