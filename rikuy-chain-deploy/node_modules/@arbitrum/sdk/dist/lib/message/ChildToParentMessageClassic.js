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
exports.ChildToParentMessageWriterClassic = exports.ChildToParentMessageReaderClassic = exports.ChildToParentMessageClassic = void 0;
const constants_1 = require("../dataEntities/constants");
const ArbSys__factory_1 = require("../abi/factories/ArbSys__factory");
const Outbox__factory_1 = require("../abi/classic/factories/Outbox__factory");
const NodeInterface__factory_1 = require("../abi/factories/NodeInterface__factory");
const eventFetcher_1 = require("../utils/eventFetcher");
const signerOrProvider_1 = require("../dataEntities/signerOrProvider");
const lib_1 = require("../utils/lib");
const errors_1 = require("../dataEntities/errors");
const message_1 = require("../dataEntities/message");
const networks_1 = require("../dataEntities/networks");
class ChildToParentMessageClassic {
    constructor(batchNumber, indexInBatch) {
        this.batchNumber = batchNumber;
        this.indexInBatch = indexInBatch;
    }
    static fromBatchNumber(parentSignerOrProvider, batchNumber, indexInBatch, parentProvider) {
        return signerOrProvider_1.SignerProviderUtils.isSigner(parentSignerOrProvider)
            ? new ChildToParentMessageWriterClassic(parentSignerOrProvider, batchNumber, indexInBatch, parentProvider)
            : new ChildToParentMessageReaderClassic(parentSignerOrProvider, batchNumber, indexInBatch);
    }
    static async getChildToParentEvents(childProvider, filter, batchNumber, destination, uniqueId, indexInBatch) {
        const eventFetcher = new eventFetcher_1.EventFetcher(childProvider);
        const events = (await eventFetcher.getEvents(ArbSys__factory_1.ArbSys__factory, t => t.filters.L2ToL1Transaction(null, destination, uniqueId, batchNumber), Object.assign(Object.assign({}, filter), { address: constants_1.ARB_SYS_ADDRESS }))).map(l => (Object.assign(Object.assign({}, l.event), { transactionHash: l.transactionHash })));
        if (indexInBatch) {
            const indexItems = events.filter(b => b.indexInBatch.eq(indexInBatch));
            if (indexItems.length === 1) {
                return indexItems;
            }
            else if (indexItems.length > 1) {
                throw new errors_1.ArbSdkError('More than one indexed item found in batch.');
            }
            else
                return [];
        }
        else
            return events;
    }
}
exports.ChildToParentMessageClassic = ChildToParentMessageClassic;
/**
 * Provides read-only access for classic Child-to-Parent-messages
 */
class ChildToParentMessageReaderClassic extends ChildToParentMessageClassic {
    constructor(parentProvider, batchNumber, indexInBatch) {
        super(batchNumber, indexInBatch);
        this.parentProvider = parentProvider;
        /**
         * Contains the classic outbox address, or set to zero address if this network
         * did not have a classic outbox deployed
         */
        this.outboxAddress = null;
        this.proof = null;
    }
    /**
     * Classic had 2 outboxes, we need to find the correct one for the provided batch number
     * @param  childProvider
     * @param batchNumber
     * @returns
     */
    async getOutboxAddress(childProvider, batchNumber) {
        if (!(0, lib_1.isDefined)(this.outboxAddress)) {
            const childChain = await (0, networks_1.getArbitrumNetwork)(childProvider);
            // find the outbox where the activation batch number of the next outbox
            // is greater than the supplied batch
            const outboxes = (0, lib_1.isDefined)(childChain.ethBridge.classicOutboxes)
                ? Object.entries(childChain.ethBridge.classicOutboxes)
                : [];
            const res = outboxes
                .sort((a, b) => {
                if (a[1] < b[1])
                    return -1;
                else if (a[1] === b[1])
                    return 0;
                else
                    return 1;
            })
                .find((_, index, array) => array[index + 1] === undefined || array[index + 1][1] > batchNumber);
            if (!res) {
                this.outboxAddress = '0x0000000000000000000000000000000000000000';
            }
            else {
                this.outboxAddress = res[0];
            }
        }
        return this.outboxAddress;
    }
    async outboxEntryExists(childProvider) {
        const outboxAddress = await this.getOutboxAddress(childProvider, this.batchNumber.toNumber());
        const outbox = Outbox__factory_1.Outbox__factory.connect(outboxAddress, this.parentProvider);
        return await outbox.outboxEntryExists(this.batchNumber);
    }
    static async tryGetProof(childProvider, batchNumber, indexInBatch) {
        const nodeInterface = NodeInterface__factory_1.NodeInterface__factory.connect(constants_1.NODE_INTERFACE_ADDRESS, childProvider);
        try {
            return await nodeInterface.legacyLookupMessageBatchProof(batchNumber, indexInBatch);
        }
        catch (e) {
            const expectedError = "batch doesn't exist";
            const err = e;
            const actualError = err && (err.message || (err.error && err.error.message));
            if (actualError.includes(expectedError))
                return null;
            else
                throw e;
        }
    }
    /**
     * Get the execution proof for this message. Returns null if the batch does not exist yet.
     * @param  childProvider
     * @returns
     */
    async tryGetProof(childProvider) {
        if (!(0, lib_1.isDefined)(this.proof)) {
            this.proof = await ChildToParentMessageReaderClassic.tryGetProof(childProvider, this.batchNumber, this.indexInBatch);
        }
        return this.proof;
    }
    /**
     * Check if given outbox message has already been executed
     */
    async hasExecuted(childProvider) {
        var _a, _b;
        const proofInfo = await this.tryGetProof(childProvider);
        if (!(0, lib_1.isDefined)(proofInfo))
            return false;
        const outboxAddress = await this.getOutboxAddress(childProvider, this.batchNumber.toNumber());
        const outbox = Outbox__factory_1.Outbox__factory.connect(outboxAddress, this.parentProvider);
        try {
            await outbox.callStatic.executeTransaction(this.batchNumber, proofInfo.proof, proofInfo.path, proofInfo.l2Sender, proofInfo.l1Dest, proofInfo.l2Block, proofInfo.l1Block, proofInfo.timestamp, proofInfo.amount, proofInfo.calldataForL1);
            return false;
        }
        catch (err) {
            const e = err;
            if ((_a = e === null || e === void 0 ? void 0 : e.message) === null || _a === void 0 ? void 0 : _a.toString().includes('ALREADY_SPENT'))
                return true;
            if ((_b = e === null || e === void 0 ? void 0 : e.message) === null || _b === void 0 ? void 0 : _b.toString().includes('NO_OUTBOX_ENTRY'))
                return false;
            throw e;
        }
    }
    /**
     * Get the status of this message
     * In order to check if the message has been executed proof info must be provided.
     * @param childProvider
     * @returns
     */
    async status(childProvider) {
        try {
            const messageExecuted = await this.hasExecuted(childProvider);
            if (messageExecuted) {
                return message_1.ChildToParentMessageStatus.EXECUTED;
            }
            const outboxEntryExists = await this.outboxEntryExists(childProvider);
            return outboxEntryExists
                ? message_1.ChildToParentMessageStatus.CONFIRMED
                : message_1.ChildToParentMessageStatus.UNCONFIRMED;
        }
        catch (e) {
            return message_1.ChildToParentMessageStatus.UNCONFIRMED;
        }
    }
    /**
     * Waits until the outbox entry has been created, and will not return until it has been.
     * WARNING: Outbox entries are only created when the corresponding node is confirmed. Which
     * can take 1 week+, so waiting here could be a very long operation.
     * @param retryDelay
     * @returns outbox entry status (either executed or confirmed but not pending)
     */
    async waitUntilOutboxEntryCreated(childProvider, retryDelay = 500) {
        const exists = await this.outboxEntryExists(childProvider);
        if (exists) {
            return (await this.hasExecuted(childProvider))
                ? message_1.ChildToParentMessageStatus.EXECUTED
                : message_1.ChildToParentMessageStatus.CONFIRMED;
        }
        else {
            await (0, lib_1.wait)(retryDelay);
            return await this.waitUntilOutboxEntryCreated(childProvider, retryDelay);
        }
    }
    /**
     * Estimates the Parent Chain block number in which this Child-to-Parent tx will be available for execution
     * @param  childProvider
     * @returns Always returns null for classic chainToParentChain messages since they can be executed in any block now.
     */
    async getFirstExecutableBlock(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    childProvider) {
        return null;
    }
}
exports.ChildToParentMessageReaderClassic = ChildToParentMessageReaderClassic;
/**
 * Provides read and write access for classic Child-to-Parent-messages
 */
class ChildToParentMessageWriterClassic extends ChildToParentMessageReaderClassic {
    /**
     * Instantiates a new `ChildToParentMessageWriterClassic` object.
     *
     * @param {Signer} parentSigner The signer to be used for executing the Child-to-Parent message.
     * @param {BigNumber} batchNumber The number of the batch containing the Child-to-Parent message.
     * @param {BigNumber} indexInBatch The index of the Child-to-Parent message within the batch.
     * @param {Provider} [parentProvider] Optional. Used to override the Provider which is attached to `parentSigner` in case you need more control. This will be a required parameter in a future major version update.
     */
    constructor(parentSigner, batchNumber, indexInBatch, parentProvider) {
        super(parentProvider !== null && parentProvider !== void 0 ? parentProvider : parentSigner.provider, batchNumber, indexInBatch);
        this.parentSigner = parentSigner;
    }
    /**
     * Executes the ChildToParentMessage on Parent Chain.
     * Will throw an error if the outbox entry has not been created, which happens when the
     * corresponding assertion is confirmed.
     * @returns
     */
    async execute(childProvider, overrides) {
        const status = await this.status(childProvider);
        if (status !== message_1.ChildToParentMessageStatus.CONFIRMED) {
            throw new errors_1.ArbSdkError(`Cannot execute message. Status is: ${status} but must be ${message_1.ChildToParentMessageStatus.CONFIRMED}.`);
        }
        const proofInfo = await this.tryGetProof(childProvider);
        if (!(0, lib_1.isDefined)(proofInfo)) {
            throw new errors_1.ArbSdkError(`Unexpected missing proof: ${this.batchNumber.toString()} ${this.indexInBatch.toString()}}`);
        }
        const outboxAddress = await this.getOutboxAddress(childProvider, this.batchNumber.toNumber());
        const outbox = Outbox__factory_1.Outbox__factory.connect(outboxAddress, this.parentSigner);
        // We can predict and print number of missing blocks
        // if not challenged
        return await outbox.functions.executeTransaction(this.batchNumber, proofInfo.proof, proofInfo.path, proofInfo.l2Sender, proofInfo.l1Dest, proofInfo.l2Block, proofInfo.l1Block, proofInfo.timestamp, proofInfo.amount, proofInfo.calldataForL1, overrides || {});
    }
}
exports.ChildToParentMessageWriterClassic = ChildToParentMessageWriterClassic;
