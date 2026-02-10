"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentToChildMessageCreator = void 0;
const ethers_1 = require("ethers");
const ParentToChildMessageGasEstimator_1 = require("./ParentToChildMessageGasEstimator");
const ParentTransaction_1 = require("./ParentTransaction");
const Inbox__factory_1 = require("../abi/factories/Inbox__factory");
const networks_1 = require("../dataEntities/networks");
const ERC20Inbox__factory_1 = require("../abi/factories/ERC20Inbox__factory");
const signerOrProvider_1 = require("../dataEntities/signerOrProvider");
const errors_1 = require("../dataEntities/errors");
const lib_1 = require("../utils/lib");
const transactionRequest_1 = require("../dataEntities/transactionRequest");
/**
 * Creates retryable tickets by directly calling the Inbox contract on Parent chain
 */
class ParentToChildMessageCreator {
    constructor(parentSigner) {
        this.parentSigner = parentSigner;
        if (!signerOrProvider_1.SignerProviderUtils.signerHasProvider(parentSigner)) {
            throw new errors_1.MissingProviderArbSdkError('parentSigner');
        }
    }
    /**
     * Gets a current estimate for the supplied params
     * @param params
     * @param parentProvider
     * @param childProvider
     * @param retryableGasOverrides
     * @returns
     */
    static async getTicketEstimate(params, parentProvider, childProvider, retryableGasOverrides) {
        const baseFee = await (0, lib_1.getBaseFee)(parentProvider);
        const gasEstimator = new ParentToChildMessageGasEstimator_1.ParentToChildMessageGasEstimator(childProvider);
        return await gasEstimator.estimateAll(params, baseFee, parentProvider, retryableGasOverrides);
    }
    /**
     * Prepare calldata for a call to create a retryable ticket
     * @param params
     * @param estimates
     * @param excessFeeRefundAddress
     * @param callValueRefundAddress
     * @param nativeTokenIsEth
     * @returns
     */
    static getTicketCreationRequestCallData(params, estimates, excessFeeRefundAddress, callValueRefundAddress, nativeTokenIsEth) {
        if (!nativeTokenIsEth) {
            return ERC20Inbox__factory_1.ERC20Inbox__factory.createInterface().encodeFunctionData('createRetryableTicket', [
                params.to,
                params.l2CallValue,
                estimates.maxSubmissionCost,
                excessFeeRefundAddress,
                callValueRefundAddress,
                estimates.gasLimit,
                estimates.maxFeePerGas,
                estimates.deposit, // tokenTotalFeeAmount
                params.data,
            ]);
        }
        return Inbox__factory_1.Inbox__factory.createInterface().encodeFunctionData('createRetryableTicket', [
            params.to,
            params.l2CallValue,
            estimates.maxSubmissionCost,
            excessFeeRefundAddress,
            callValueRefundAddress,
            estimates.gasLimit,
            estimates.maxFeePerGas,
            params.data,
        ]);
    }
    /**
     * Generate a transaction request for creating a retryable ticket
     * @param params
     * @param parentProvider
     * @param childProvider
     * @param options
     * @returns
     */
    static async getTicketCreationRequest(params, parentProvider, childProvider, options) {
        const excessFeeRefundAddress = params.excessFeeRefundAddress || params.from;
        const callValueRefundAddress = params.callValueRefundAddress || params.from;
        const parsedParams = Object.assign(Object.assign({}, params), { excessFeeRefundAddress,
            callValueRefundAddress });
        const estimates = await ParentToChildMessageCreator.getTicketEstimate(parsedParams, parentProvider, childProvider, options);
        const childChain = await (0, networks_1.getArbitrumNetwork)(childProvider);
        const nativeTokenIsEth = (0, networks_1.isArbitrumNetworkNativeTokenEther)(childChain);
        const data = ParentToChildMessageCreator.getTicketCreationRequestCallData(params, estimates, excessFeeRefundAddress, callValueRefundAddress, nativeTokenIsEth);
        return {
            txRequest: {
                to: childChain.ethBridge.inbox,
                data,
                value: nativeTokenIsEth ? estimates.deposit : ethers_1.constants.Zero,
                from: params.from,
            },
            retryableData: {
                data: params.data,
                from: params.from,
                to: params.to,
                excessFeeRefundAddress: excessFeeRefundAddress,
                callValueRefundAddress: callValueRefundAddress,
                l2CallValue: params.l2CallValue,
                maxSubmissionCost: estimates.maxSubmissionCost,
                maxFeePerGas: estimates.maxFeePerGas,
                gasLimit: estimates.gasLimit,
                deposit: estimates.deposit,
            },
            isValid: async () => {
                const reEstimates = await ParentToChildMessageCreator.getTicketEstimate(parsedParams, parentProvider, childProvider, options);
                return ParentToChildMessageGasEstimator_1.ParentToChildMessageGasEstimator.isValid(estimates, reEstimates);
            },
        };
    }
    /**
     * Creates a retryable ticket by directly calling the Inbox contract on Parent chain
     */
    async createRetryableTicket(params, childProvider, options) {
        const parentProvider = signerOrProvider_1.SignerProviderUtils.getProviderOrThrow(this.parentSigner);
        const createRequest = (0, transactionRequest_1.isParentToChildTransactionRequest)(params)
            ? params
            : await ParentToChildMessageCreator.getTicketCreationRequest(params, parentProvider, childProvider, options);
        const tx = await this.parentSigner.sendTransaction(Object.assign(Object.assign({}, createRequest.txRequest), params.overrides));
        return ParentTransaction_1.ParentTransactionReceipt.monkeyPatchWait(tx);
    }
}
exports.ParentToChildMessageCreator = ParentToChildMessageCreator;
