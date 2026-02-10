"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryableDataTools = void 0;
const abi_1 = require("@ethersproject/abi");
const ethers_1 = require("ethers");
const lib_1 = require("../utils/lib");
// TODO: add typechain support
const errorInterface = new abi_1.Interface([
    'error RetryableData(address from, address to, uint256 l2CallValue, uint256 deposit, uint256 maxSubmissionCost, address excessFeeRefundAddress, address callValueRefundAddress, uint256 gasLimit, uint256 maxFeePerGas, bytes data)',
]);
/**
 * Tools for parsing retryable data from errors.
 * When calling createRetryableTicket on Inbox.sol special values
 * can be passed for gasLimit and maxFeePerGas. This causes the call to revert
 * with the info needed to estimate the gas needed for a retryable ticket using
 * L1ToL2GasPriceEstimator.
 */
class RetryableDataTools {
    static isErrorData(maybeErrorData) {
        return (0, lib_1.isDefined)(maybeErrorData.errorData);
    }
    static tryGetErrorData(ethersJsError) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (this.isErrorData(ethersJsError)) {
            return ethersJsError.errorData;
        }
        else {
            const typedError = ethersJsError;
            if (typedError.data) {
                return typedError.data;
            }
            else if ((_b = (_a = typedError.error) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.body) {
                const maybeData = (_e = JSON.parse((_d = (_c = typedError.error) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.body).error) === null || _e === void 0 ? void 0 : _e.data;
                if (!maybeData)
                    return null;
                return maybeData;
            }
            else if ((_g = (_f = typedError.error) === null || _f === void 0 ? void 0 : _f.error) === null || _g === void 0 ? void 0 : _g.data) {
                return (_j = (_h = typedError.error) === null || _h === void 0 ? void 0 : _h.error) === null || _j === void 0 ? void 0 : _j.data;
            }
            else {
                return null;
            }
        }
    }
    /**
     * Try to parse a retryable data struct from the supplied ethersjs error, or any explicitly supplied error data
     * @param ethersJsErrorOrData
     * @returns
     */
    static tryParseError(ethersJsErrorOrData) {
        const errorData = typeof ethersJsErrorOrData === 'string'
            ? ethersJsErrorOrData
            : this.tryGetErrorData(ethersJsErrorOrData);
        if (!errorData)
            return null;
        return errorInterface.parseError(errorData).args;
    }
}
exports.RetryableDataTools = RetryableDataTools;
/**
 * The parameters that should be passed to createRetryableTicket in order to induce
 * a revert with retryable data
 */
RetryableDataTools.ErrorTriggeringParams = {
    gasLimit: ethers_1.BigNumber.from(1),
    maxFeePerGas: ethers_1.BigNumber.from(1),
};
