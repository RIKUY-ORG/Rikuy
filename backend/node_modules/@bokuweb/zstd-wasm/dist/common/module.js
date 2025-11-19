"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Module = exports.waitInitialized = void 0;
const zstd_1 = require("./zstd");
Object.defineProperty(exports, "Module", { enumerable: true, get: function () { return zstd_1.Module; } });
const initialized = (() => new Promise((resolve) => {
    zstd_1.Module.onRuntimeInitialized = resolve;
}))();
const waitInitialized = () => __awaiter(void 0, void 0, void 0, function* () {
    yield initialized;
});
exports.waitInitialized = waitInitialized;
//# sourceMappingURL=module.js.map