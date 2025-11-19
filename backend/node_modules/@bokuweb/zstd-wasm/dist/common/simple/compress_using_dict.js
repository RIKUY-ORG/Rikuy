"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressUsingDict = exports.freeCCtx = exports.createCCtx = void 0;
const module_1 = require("../module");
const errors_1 = require("../errors");
const compressBound = (size) => {
    const bound = module_1.Module['_ZSTD_compressBound'];
    return bound(size);
};
const createCCtx = () => {
    return module_1.Module['_ZSTD_createCCtx']();
};
exports.createCCtx = createCCtx;
const freeCCtx = (cctx) => {
    return module_1.Module['_ZSTD_freeCCtx'](cctx);
};
exports.freeCCtx = freeCCtx;
const compressUsingDict = (cctx, buf, dict, level) => {
    const bound = compressBound(buf.byteLength);
    const malloc = module_1.Module['_malloc'];
    const compressed = malloc(bound);
    const src = malloc(buf.byteLength);
    module_1.Module.HEAP8.set(buf, src);
    // Setup dict
    const pdict = malloc(dict.byteLength);
    module_1.Module.HEAP8.set(dict, pdict);
    const free = module_1.Module['_free'];
    try {
        /*
          @See https://zstd.docsforge.com/dev/api/ZSTD_compress_usingDict/
          size_t ZSTD_compress_usingDict(ZSTD_CCtx* cctx,
                             void* dst, size_t dstCapacity,
                             const void* src, size_t srcSize,
                             const void* dict, size_t dictSize,
                             int compressionLevel)
        */
        const _compress = module_1.Module['_ZSTD_compress_usingDict'];
        const sizeOrError = _compress(cctx, compressed, bound, src, buf.byteLength, pdict, dict.byteLength, level !== null && level !== void 0 ? level : 3);
        if ((0, errors_1.isError)(sizeOrError)) {
            throw new Error(`Failed to compress with code ${sizeOrError}`);
        }
        // // Copy buffer
        // // Uint8Array.prototype.slice() return copied buffer.
        const data = new Uint8Array(module_1.Module.HEAPU8.buffer, compressed, sizeOrError).slice();
        free(compressed, bound);
        free(src, buf.byteLength);
        free(pdict, dict.byteLength);
        return data;
    }
    catch (e) {
        free(compressed, bound);
        free(src, buf.byteLength);
        free(pdict, dict.byteLength);
        throw e;
    }
};
exports.compressUsingDict = compressUsingDict;
//# sourceMappingURL=compress_using_dict.js.map