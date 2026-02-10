/*
 * Copyright 2021, Offchain Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-env node */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthBridger = void 0;
const ethers_1 = require("ethers");
const Inbox__factory_1 = require("../abi/factories/Inbox__factory");
const ERC20Inbox__factory_1 = require("../abi/factories/ERC20Inbox__factory");
const ArbSys__factory_1 = require("../abi/factories/ArbSys__factory");
const constants_1 = require("../dataEntities/constants");
const assetBridger_1 = require("./assetBridger");
const ParentTransaction_1 = require("../message/ParentTransaction");
const ChildTransaction_1 = require("../message/ChildTransaction");
const ParentToChildMessageCreator_1 = require("../message/ParentToChildMessageCreator");
const transactionRequest_1 = require("../dataEntities/transactionRequest");
const signerOrProvider_1 = require("../dataEntities/signerOrProvider");
const errors_1 = require("../dataEntities/errors");
const networks_1 = require("../dataEntities/networks");
const ERC20__factory_1 = require("../abi/factories/ERC20__factory");
const lib_1 = require("../utils/lib");
/**
 * Bridger for moving either ETH or custom gas tokens back and forth between parent and child networks
 */
class EthBridger extends assetBridger_1.AssetBridger {
    /**
     * Instantiates a new EthBridger from a child network Provider
     * @param childProvider
     * @returns
     */
    static async fromProvider(childProvider) {
        return new EthBridger(await (0, networks_1.getArbitrumNetwork)(childProvider));
    }
    /**
     * Asserts that the provided argument is of type `ApproveGasTokenParams` and not `ApproveGasTokenTxRequest`.
     * @param params
     */
    isApproveGasTokenParams(params) {
        return typeof params.txRequest === 'undefined';
    }
    /**
     * Creates a transaction request for approving the custom gas token to be spent by the inbox on the parent network
     * @param params
     */
    getApproveGasTokenRequest(params) {
        var _a;
        if (this.nativeTokenIsEth) {
            throw new Error('chain uses ETH as its native/gas token');
        }
        const data = ERC20__factory_1.ERC20__factory.createInterface().encodeFunctionData('approve', [
            // spender
            this.childNetwork.ethBridge.inbox,
            // value
            (_a = params === null || params === void 0 ? void 0 : params.amount) !== null && _a !== void 0 ? _a : ethers_1.constants.MaxUint256,
        ]);
        return {
            to: this.nativeToken,
            data,
            value: ethers_1.BigNumber.from(0),
        };
    }
    /**
     * Approves the custom gas token to be spent by the Inbox on the parent network.
     * @param params
     */
    async approveGasToken(params) {
        if (this.nativeTokenIsEth) {
            throw new Error('chain uses ETH as its native/gas token');
        }
        const approveGasTokenRequest = this.isApproveGasTokenParams(params)
            ? this.getApproveGasTokenRequest(params)
            : params.txRequest;
        return params.parentSigner.sendTransaction(Object.assign(Object.assign({}, approveGasTokenRequest), params.overrides));
    }
    /**
     * Gets transaction calldata for a tx request for depositing ETH or custom gas token
     * @param params
     * @returns
     */
    getDepositRequestData(params) {
        if (!this.nativeTokenIsEth) {
            return ERC20Inbox__factory_1.ERC20Inbox__factory.createInterface().encodeFunctionData('depositERC20(uint256)', [params.amount]);
        }
        return Inbox__factory_1.Inbox__factory.createInterface().encodeFunctionData('depositEth()');
    }
    /**
     * Gets tx request for depositing ETH or custom gas token
     * @param params
     * @returns
     */
    async getDepositRequest(params) {
        return {
            txRequest: {
                to: this.childNetwork.ethBridge.inbox,
                value: this.nativeTokenIsEth ? params.amount : 0,
                data: this.getDepositRequestData(params),
                from: params.from,
            },
            isValid: async () => true,
        };
    }
    /**
     * Deposit ETH from Parent onto Child network
     * @param params
     * @returns
     */
    async deposit(params) {
        await this.checkParentNetwork(params.parentSigner);
        const ethDeposit = (0, transactionRequest_1.isParentToChildTransactionRequest)(params)
            ? params
            : await this.getDepositRequest(Object.assign(Object.assign({}, params), { from: await params.parentSigner.getAddress() }));
        const tx = await params.parentSigner.sendTransaction(Object.assign(Object.assign({}, ethDeposit.txRequest), params.overrides));
        return ParentTransaction_1.ParentTransactionReceipt.monkeyPatchEthDepositWait(tx);
    }
    /**
     * Get a transaction request for an ETH deposit to a different child network address using Retryables
     * @param params
     * @returns
     */
    async getDepositToRequest(params) {
        const decimals = await (0, lib_1.getNativeTokenDecimals)({
            parentProvider: params.parentProvider,
            childNetwork: this.childNetwork,
        });
        const amountToBeMintedOnChildChain = (0, lib_1.scaleFromNativeTokenDecimalsTo18Decimals)({
            amount: params.amount,
            decimals,
        });
        const requestParams = Object.assign(Object.assign({}, params), { to: params.destinationAddress, l2CallValue: amountToBeMintedOnChildChain, callValueRefundAddress: params.destinationAddress, data: '0x' });
        // Gas overrides can be passed in the parameters
        const gasOverrides = params.retryableGasOverrides || undefined;
        return ParentToChildMessageCreator_1.ParentToChildMessageCreator.getTicketCreationRequest(requestParams, params.parentProvider, params.childProvider, gasOverrides);
    }
    /**
     * Deposit ETH from parent network onto a different child network address
     * @param params
     * @returns
     */
    async depositTo(params) {
        await this.checkParentNetwork(params.parentSigner);
        await this.checkChildNetwork(params.childProvider);
        const retryableTicketRequest = (0, transactionRequest_1.isParentToChildTransactionRequest)(params)
            ? params
            : await this.getDepositToRequest(Object.assign(Object.assign({}, params), { from: await params.parentSigner.getAddress(), parentProvider: params.parentSigner.provider }));
        const parentToChildMessageCreator = new ParentToChildMessageCreator_1.ParentToChildMessageCreator(params.parentSigner);
        const tx = await parentToChildMessageCreator.createRetryableTicket(retryableTicketRequest, params.childProvider);
        return ParentTransaction_1.ParentTransactionReceipt.monkeyPatchContractCallWait(tx);
    }
    /**
     * Get a transaction request for an eth withdrawal
     * @param params
     * @returns
     */
    async getWithdrawalRequest(params) {
        const iArbSys = ArbSys__factory_1.ArbSys__factory.createInterface();
        const functionData = iArbSys.encodeFunctionData('withdrawEth', [
            params.destinationAddress,
        ]);
        return {
            txRequest: {
                to: constants_1.ARB_SYS_ADDRESS,
                data: functionData,
                value: params.amount,
                from: params.from,
            },
            // todo: do proper estimation
            estimateParentGasLimit: async (parentProvider) => {
                if (await (0, lib_1.isArbitrumChain)(parentProvider)) {
                    // values for L3 are dependent on the L1 base fee, so hardcoding can never be accurate
                    // however, this is only an estimate used for display, so should be good enough
                    //
                    // measured with withdrawals from Xai and Rari then added some padding
                    return ethers_1.BigNumber.from(4000000);
                }
                // measured 126998 - add some padding
                return ethers_1.BigNumber.from(130000);
            },
        };
    }
    /**
     * Withdraw ETH from child network onto parent network
     * @param params
     * @returns
     */
    async withdraw(params) {
        if (!signerOrProvider_1.SignerProviderUtils.signerHasProvider(params.childSigner)) {
            throw new errors_1.MissingProviderArbSdkError('childSigner');
        }
        await this.checkChildNetwork(params.childSigner);
        const request = (0, transactionRequest_1.isChildToParentTransactionRequest)(params)
            ? params
            : await this.getWithdrawalRequest(params);
        const tx = await params.childSigner.sendTransaction(Object.assign(Object.assign({}, request.txRequest), params.overrides));
        return ChildTransaction_1.ChildTransactionReceipt.monkeyPatchWait(tx);
    }
}
exports.EthBridger = EthBridger;
