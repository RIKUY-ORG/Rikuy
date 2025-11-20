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
declare class ZstdStream extends ZstdStreamDec {
    private static readonly zstdEContinue;
    private static readonly zstdEEnd;
    private static readonly zstdCCompressionLevel;
    private static readonly zstdCChecksumFlag;
    private static readonly zstdCNbWorkers;
    private static inputSizeCo;
    private static outputSizeCo;
    private static isCompressInit;
    private static zstdCStreamInSize;
    private static zstdCStreamOutSize;
    private static zstdCreateCStream;
    private static zstdInitCStream;
    private static zstdCCtxSetParameter;
    private static zstdCompressStream2SimpleArgs;
    private static zstdFreeCStream;
    static compress(payload: Uint8Array, compressionLevel?: number, checksum?: boolean): Uint8Array;
    private static setCompressionLevel;
    private static initCompressStream;
    private static initCompressFunctions;
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
declare class ZstdSimple extends ZstdSimpleDec {
    private static isCompressInit;
    private static zstdCompress;
    private static zstdCompressBound;
    static compress(payload: Uint8Array, compressionLevel?: number): Uint8Array;
    private static initCompressFunctions;
}
interface ZstdCodec {
    ZstdSimple: typeof ZstdSimple;
    ZstdStream: typeof ZstdStream;
}
declare function ZstdInit(): Promise<ZstdCodec>;
export { ZstdSimple, ZstdStream, ZstdCodec, ZstdInit };
