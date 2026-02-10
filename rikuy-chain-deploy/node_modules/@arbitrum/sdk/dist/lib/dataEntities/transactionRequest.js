"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChildToParentTransactionRequest = exports.isParentToChildTransactionRequest = void 0;
const lib_1 = require("../utils/lib");
/**
 * Check if an object is of ParentToChildTransactionRequest type
 * @param possibleRequest
 * @returns
 */
const isParentToChildTransactionRequest = (possibleRequest) => {
    return (0, lib_1.isDefined)(possibleRequest.txRequest);
};
exports.isParentToChildTransactionRequest = isParentToChildTransactionRequest;
/**
 * Check if an object is of ChildToParentTransactionRequest type
 * @param possibleRequest
 * @returns
 */
const isChildToParentTransactionRequest = (possibleRequest) => {
    return (possibleRequest.txRequest != undefined);
};
exports.isChildToParentTransactionRequest = isChildToParentTransactionRequest;
