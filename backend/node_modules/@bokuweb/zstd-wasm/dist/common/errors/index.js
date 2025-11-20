"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isError = void 0;
const module_1 = require("../module");
const isError = (code) => {
    const _isError = module_1.Module['_ZSTD_isError'];
    return _isError(code);
};
exports.isError = isError;
// @See https://github.com/facebook/zstd/blob/12c045f74d922dc934c168f6e1581d72df983388/lib/common/error_private.c#L24-L53
// export const getErrorName = (code: number): string => {
//   const _getErrorName = Module.cwrap('ZSTD_getErrorName', 'string', ['number']);
//   return _getErrorName(code);
// };
//# sourceMappingURL=index.js.map