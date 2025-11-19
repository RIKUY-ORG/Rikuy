"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompressUsingDict = exports.freeDCtx = exports.createDCtx = void 0;
const module_1 = require("../module");
const errors_1 = require("../errors");
const getFrameContentSize = (src, size) => {
    const getSize = module_1.Module['_ZSTD_getFrameContentSize'];
    return getSize(src, size);
};
const createDCtx = () => {
    return module_1.Module['_ZSTD_createDCtx']();
};
exports.createDCtx = createDCtx;
const freeDCtx = (dctx) => {
    return module_1.Module['_ZSTD_freeDCtx'](dctx);
};
exports.freeDCtx = freeDCtx;
const decompressUsingDict = (dctx, buf, dict, opts = { defaultHeapSize: 1024 * 1024 }) => {
    const malloc = module_1.Module['_malloc'];
    const src = malloc(buf.byteLength);
    module_1.Module.HEAP8.set(buf, src);
    const pdict = malloc(dict.byteLength);
    module_1.Module.HEAP8.set(dict, pdict);
    const contentSize = getFrameContentSize(src, buf.byteLength);
    const size = contentSize === -1 ? opts.defaultHeapSize : contentSize;
    const free = module_1.Module['_free'];
    const heap = malloc(size);
    try {
        const _decompress = module_1.Module['_ZSTD_decompress_usingDict'];
        const sizeOrError = _decompress(dctx, heap, size, src, buf.byteLength, pdict, dict.byteLength);
        if ((0, errors_1.isError)(sizeOrError)) {
            throw new Error(`Failed to compress with code ${sizeOrError}`);
        }
        // Copy buffer
        // Uint8Array.prototype.slice() return copied buffer.
        const data = new Uint8Array(module_1.Module.HEAPU8.buffer, heap, sizeOrError).slice();
        free(heap, size);
        free(src, buf.byteLength);
        free(pdict, dict.byteLength);
        return data;
    }
    catch (e) {
        free(heap, size);
        free(src, buf.byteLength);
        free(pdict, dict.byteLength);
        throw e;
    }
};
exports.decompressUsingDict = decompressUsingDict;
//# sourceMappingURL=decompress_using_dict.js.map