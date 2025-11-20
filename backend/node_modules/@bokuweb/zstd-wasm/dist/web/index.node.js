var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Module, waitInitialized } from './module';
export const init = () => __awaiter(void 0, void 0, void 0, function* () {
    const { readFile } = require('fs/promises');
    const { resolve } = require('path');
    const buf = yield readFile(resolve(__dirname, './zstd.wasm'));
    Module['init'](buf);
    yield waitInitialized();
});
export * from './simple/decompress';
export * from './simple/compress';
export * from './simple/decompress_using_dict';
export * from './simple/compress_using_dict';
//# sourceMappingURL=index.node.js.map