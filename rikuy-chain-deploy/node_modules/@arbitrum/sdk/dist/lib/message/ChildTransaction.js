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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildTransactionReceipt = void 0;
const signerOrProvider_1 = require("../dataEntities/signerOrProvider");
const ChildToParentMessage_1 = require("./ChildToParentMessage");
const ArbSys__factory_1 = require("../abi/factories/ArbSys__factory");
const ArbRetryableTx__factory_1 = require("../abi/factories/ArbRetryableTx__factory");
const NodeInterface__factory_1 = require("../abi/factories/NodeInterface__factory");
const errors_1 = require("../dataEntities/errors");
const constants_1 = require("../dataEntities/constants");
const event_1 = require("../dataEntities/event");
const arbProvider_1 = require("../utils/arbProvider");
/**
 * Extension of ethers-js TransactionReceipt, adding Arbitrum-specific functionality
 */
class ChildTransactionReceipt {
    constructor(tx) {
        this.to = tx.to;
        this.from = tx.from;
        this.contractAddress = tx.contractAddress;
        this.transactionIndex = tx.transactionIndex;
        this.root = tx.root;
        this.gasUsed = tx.gasUsed;
        this.logsBloom = tx.logsBloom;
        this.blockHash = tx.blockHash;
        this.transactionHash = tx.transactionHash;
        this.logs = tx.logs;
        this.blockNumber = tx.blockNumber;
        this.confirmations = tx.confirmations;
        this.cumulativeGasUsed = tx.cumulativeGasUsed;
        this.effectiveGasPrice = tx.effectiveGasPrice;
        this.byzantium = tx.byzantium;
        this.type = tx.type;
        this.status = tx.status;
    }
    /**
     * Get {@link ChildToParentTransactionEvent} events created by this transaction
     * @returns
     */
    getChildToParentEvents() {
        const classicLogs = (0, event_1.parseTypedLogs)(ArbSys__factory_1.ArbSys__factory, this.logs, 'L2ToL1Transaction');
        const nitroLogs = (0, event_1.parseTypedLogs)(ArbSys__factory_1.ArbSys__factory, this.logs, 'L2ToL1Tx');
        return [...classicLogs, ...nitroLogs];
    }
    /**
     * Get event data for any redeems that were scheduled in this transaction
     * @returns
     */
    getRedeemScheduledEvents() {
        return (0, event_1.parseTypedLogs)(ArbRetryableTx__factory_1.ArbRetryableTx__factory, this.logs, 'RedeemScheduled');
    }
    async getChildToParentMessages(parentSignerOrProvider) {
        const provider = signerOrProvider_1.SignerProviderUtils.getProvider(parentSignerOrProvider);
        if (!provider)
            throw new errors_1.ArbSdkError('Signer not connected to provider.');
        return this.getChildToParentEvents().map(log => ChildToParentMessage_1.ChildToParentMessage.fromEvent(parentSignerOrProvider, log));
    }
    /**
     * Get number of parent chain confirmations that the batch including this tx has
     * @param childProvider
     * @returns number of confirmations of batch including tx, or 0 if no batch included this tx
     */
    getBatchConfirmations(childProvider) {
        const nodeInterface = NodeInterface__factory_1.NodeInterface__factory.connect(constants_1.NODE_INTERFACE_ADDRESS, childProvider);
        return nodeInterface.getL1Confirmations(this.blockHash);
    }
    /**
     * Get the number of the batch that included this tx (will throw if no such batch exists)
     * @param childProvider
     * @returns number of batch in which tx was included, or errors if no batch includes the current tx
     */
    async getBatchNumber(childProvider) {
        const nodeInterface = NodeInterface__factory_1.NodeInterface__factory.connect(constants_1.NODE_INTERFACE_ADDRESS, childProvider);
        const arbProvider = new arbProvider_1.ArbitrumProvider(childProvider);
        const rec = await arbProvider.getTransactionReceipt(this.transactionHash);
        if (rec == null)
            throw new errors_1.ArbSdkError('No receipt receipt available for current transaction');
        // findBatchContainingBlock errors if block number does not exist
        return nodeInterface.findBatchContainingBlock(rec.blockNumber);
    }
    /**
     * Whether the data associated with this transaction has been
     * made available on parent chain
     * @param childProvider
     * @param confirmations The number of confirmations on the batch before data is to be considered available
     * @returns
     */
    async isDataAvailable(childProvider, confirmations = 10) {
        const res = await this.getBatchConfirmations(childProvider);
        // is there a batch with enough confirmations
        return res.toNumber() > confirmations;
    }
    /**
     * Adds a waitForRedeem function to a redeem transaction
     * @param redeemTx
     * @param childProvider
     * @returns
     */
    static toRedeemTransaction(redeemTx, childProvider) {
        const returnRec = redeemTx;
        returnRec.waitForRedeem = async () => {
            const rec = await redeemTx.wait();
            const redeemScheduledEvents = await rec.getRedeemScheduledEvents();
            if (redeemScheduledEvents.length !== 1) {
                throw new errors_1.ArbSdkError(`Transaction is not a redeem transaction: ${rec.transactionHash}`);
            }
            return await childProvider.getTransactionReceipt(redeemScheduledEvents[0].retryTxHash);
        };
        return returnRec;
    }
}
exports.ChildTransactionReceipt = ChildTransactionReceipt;
_a = ChildTransactionReceipt;
/**
 * Replaces the wait function with one that returns an L2TransactionReceipt
 * @param contractTransaction
 * @returns
 */
ChildTransactionReceipt.monkeyPatchWait = (contractTransaction) => {
    const wait = contractTransaction.wait;
    contractTransaction.wait = async (_confirmations) => {
        // we ignore the confirmations for now since child chain transactions shouldn't re-org
        // in future we should give users a more fine grained way to check the finality of
        // an child chain transaction - check if a batch is on a parent chain, if an assertion has been made, and if
        // it has been confirmed.
        const result = await wait();
        return new _a(result);
    };
    return contractTransaction;
};
