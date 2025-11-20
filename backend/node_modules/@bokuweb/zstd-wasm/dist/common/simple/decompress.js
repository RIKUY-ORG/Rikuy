"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompress = void 0;
const module_1 = require("../module");
const errors_1 = require("../errors");
const getFrameContentSize = (src, size) => {
    const getSize = module_1.Module['_ZSTD_getFrameContentSize'];
    return getSize(src, size);
};
const decompress = (buf, opts = { defaultHeapSize: 1024 * 1024 }) => {
    const malloc = module_1.Module['_malloc'];
    const src = malloc(buf.byteLength);
    module_1.Module.HEAP8.set(buf, src);
    const contentSize = getFrameContentSize(src, buf.byteLength);
    const size = contentSize === -1 ? opts.defaultHeapSize : contentSize;
    const free = module_1.Module['_free'];
    const heap = malloc(size);
    try {
        /*
          @See https://zstd.docsforge.com/dev/api/ZSTD_decompress/
          compressedSize : must be the exact size of some number of compressed and/or skippable frames.
          dstCapacity is an upper bound of originalSize to regenerate.
          If user cannot imply a maximum upper bound, it's better to use streaming mode to decompress data.
          @return: the number of bytes decompressed into dst (<= dstCapacity), or an errorCode if it fails (which can be tested using ZSTD_isError()).
        */
        const _decompress = module_1.Module['_ZSTD_decompress'];
        const sizeOrError = _decompress(heap, size, src, buf.byteLength);
        if ((0, errors_1.isError)(sizeOrError)) {
            throw new Error(`Failed to compress with code ${sizeOrError}`);
        }
        // Copy buffer
        // Uint8Array.prototype.slice() return copied buffer.
        const data = new Uint8Array(module_1.Module.HEAPU8.buffer, heap, sizeOrError).slice();
        free(heap, size);
        free(src, buf.byteLength);
        return data;
    }
    catch (e) {
        free(heap, size);
        free(src, buf.byteLength);
        throw e;
    }
};
exports.decompress = decompress;
//# sourceMappingURL=decompress.js.map