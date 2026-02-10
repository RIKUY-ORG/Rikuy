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
exports.ParentContractCallTransactionReceipt = exports.ParentEthDepositTransactionReceipt = exports.ParentTransactionReceipt = void 0;
const bignumber_1 = require("@ethersproject/bignumber");
const ParentToChildMessage_1 = require("./ParentToChildMessage");
const L1ERC20Gateway__factory_1 = require("../abi/factories/L1ERC20Gateway__factory");
const signerOrProvider_1 = require("../dataEntities/signerOrProvider");
const errors_1 = require("../dataEntities/errors");
const Inbox__factory_1 = require("../abi/factories/Inbox__factory");
const message_1 = require("../dataEntities/message");
const Bridge__factory_1 = require("../abi/factories/Bridge__factory");
const event_1 = require("../dataEntities/event");
const lib_1 = require("../utils/lib");
const messageDataParser_1 = require("./messageDataParser");
const networks_1 = require("../dataEntities/networks");
const constants_1 = require("../dataEntities/constants");
class ParentTransactionReceipt {
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
     * Check if is a classic transaction
     * @param childSignerOrProvider
     */
    async isClassic(childSignerOrProvider) {
        const provider = signerOrProvider_1.SignerProviderUtils.getProviderOrThrow(childSignerOrProvider);
        const network = await (0, networks_1.getArbitrumNetwork)(provider);
        // all networks except Arbitrum One started off with Nitro
        if (network.chainId === 42161) {
            return this.blockNumber < constants_1.ARB1_NITRO_GENESIS_L1_BLOCK;
        }
        return false;
    }
    /**
     * Get any MessageDelivered events that were emitted during this transaction
     * @returns
     */
    getMessageDeliveredEvents() {
        return (0, event_1.parseTypedLogs)(Bridge__factory_1.Bridge__factory, this.logs, 'MessageDelivered');
    }
    /**
     * Get any InboxMessageDelivered events that were emitted during this transaction
     * @returns
     */
    getInboxMessageDeliveredEvents() {
        return (0, event_1.parseTypedLogs)(Inbox__factory_1.Inbox__factory, this.logs, 'InboxMessageDelivered(uint256,bytes)');
    }
    /**
     * Get combined data for any InboxMessageDelivered and MessageDelivered events
     * emitted during this transaction
     * @returns
     */
    getMessageEvents() {
        const bridgeMessages = this.getMessageDeliveredEvents();
        const inboxMessages = this.getInboxMessageDeliveredEvents();
        if (bridgeMessages.length !== inboxMessages.length) {
            throw new errors_1.ArbSdkError(`Unexpected missing events. Inbox message count: ${inboxMessages.length} does not equal bridge message count: ${bridgeMessages.length}. ${JSON.stringify(inboxMessages)} ${JSON.stringify(bridgeMessages)}`);
        }
        const messages = [];
        for (const bm of bridgeMessages) {
            const im = inboxMessages.filter(i => i.messageNum.eq(bm.messageIndex))[0];
            if (!im) {
                throw new errors_1.ArbSdkError(`Unexepected missing event for message index: ${bm.messageIndex.toString()}. ${JSON.stringify(inboxMessages)}`);
            }
            messages.push({
                inboxMessageEvent: im,
                bridgeMessageEvent: bm,
            });
        }
        return messages;
    }
    /**
     * Get any eth deposit messages created by this transaction
     * @param childProvider
     */
    async getEthDeposits(childProvider) {
        return Promise.all(this.getMessageEvents()
            .filter(e => e.bridgeMessageEvent.kind ===
            message_1.InboxMessageKind.L1MessageType_ethDeposit)
            .map(m => ParentToChildMessage_1.EthDepositMessage.fromEventComponents(childProvider, m.inboxMessageEvent.messageNum, m.bridgeMessageEvent.sender, m.inboxMessageEvent.data)));
    }
    /**
     * Get classic parent-to-child messages created by this transaction
     * @param childProvider
     */
    async getParentToChildMessagesClassic(childProvider) {
        const network = await (0, networks_1.getArbitrumNetwork)(childProvider);
        const chainId = network.chainId.toString();
        const isClassic = await this.isClassic(childProvider);
        // throw on nitro events
        if (!isClassic) {
            throw new Error("This method is only for classic transactions. Use 'getParentToChildMessages' for nitro transactions.");
        }
        const messageNums = this.getInboxMessageDeliveredEvents().map(msg => msg.messageNum);
        return messageNums.map(messageNum => new ParentToChildMessage_1.ParentToChildMessageReaderClassic(childProvider, bignumber_1.BigNumber.from(chainId).toNumber(), messageNum));
    }
    async getParentToChildMessages(childSignerOrProvider) {
        const provider = signerOrProvider_1.SignerProviderUtils.getProviderOrThrow(childSignerOrProvider);
        const network = await (0, networks_1.getArbitrumNetwork)(provider);
        const chainId = network.chainId.toString();
        const isClassic = await this.isClassic(provider);
        // throw on classic events
        if (isClassic) {
            throw new Error("This method is only for nitro transactions. Use 'getParentToChildMessagesClassic' for classic transactions.");
        }
        const events = this.getMessageEvents();
        return events
            .filter(e => e.bridgeMessageEvent.kind ===
            message_1.InboxMessageKind.L1MessageType_submitRetryableTx &&
            e.bridgeMessageEvent.inbox.toLowerCase() ===
                network.ethBridge.inbox.toLowerCase())
            .map(mn => {
            const messageDataParser = new messageDataParser_1.SubmitRetryableMessageDataParser();
            const inboxMessageData = messageDataParser.parse(mn.inboxMessageEvent.data);
            return ParentToChildMessage_1.ParentToChildMessage.fromEventComponents(childSignerOrProvider, bignumber_1.BigNumber.from(chainId).toNumber(), mn.bridgeMessageEvent.sender, mn.inboxMessageEvent.messageNum, mn.bridgeMessageEvent.baseFeeL1, inboxMessageData);
        });
    }
    /**
     * Get any token deposit events created by this transaction
     * @returns
     */
    getTokenDepositEvents() {
        return (0, event_1.parseTypedLogs)(L1ERC20Gateway__factory_1.L1ERC20Gateway__factory, this.logs, 'DepositInitiated');
    }
}
exports.ParentTransactionReceipt = ParentTransactionReceipt;
_a = ParentTransactionReceipt;
/**
 * Replaces the wait function with one that returns a {@link ParentTransactionReceipt}
 * @param contractTransaction
 * @returns
 */
ParentTransactionReceipt.monkeyPatchWait = (contractTransaction) => {
    const wait = contractTransaction.wait;
    contractTransaction.wait = async (confirmations) => {
        const result = await wait(confirmations);
        return new _a(result);
    };
    return contractTransaction;
};
/**
 * Replaces the wait function with one that returns a {@link ParentEthDepositTransactionReceipt}
 * @param contractTransaction
 * @returns
 */
ParentTransactionReceipt.monkeyPatchEthDepositWait = (contractTransaction) => {
    const wait = contractTransaction.wait;
    contractTransaction.wait = async (confirmations) => {
        const result = await wait(confirmations);
        return new ParentEthDepositTransactionReceipt(result);
    };
    return contractTransaction;
};
/**
 * Replaces the wait function with one that returns a {@link ParentContractCallTransactionReceipt}
 * @param contractTransaction
 * @returns
 */
ParentTransactionReceipt.monkeyPatchContractCallWait = (contractTransaction) => {
    const wait = contractTransaction.wait;
    contractTransaction.wait = async (confirmations) => {
        const result = await wait(confirmations);
        return new ParentContractCallTransactionReceipt(result);
    };
    return contractTransaction;
};
/**
 * A {@link ParentTransactionReceipt} with additional functionality that only exists
 * if the transaction created a single eth deposit.
 */
class ParentEthDepositTransactionReceipt extends ParentTransactionReceipt {
    /**
     * Wait for the funds to arrive on the child chain
     * @param confirmations Amount of confirmations the retryable ticket and the auto redeem receipt should have
     * @param timeout Amount of time to wait for the retryable ticket to be created
     * Defaults to 15 minutes, as by this time all transactions are expected to be included on the child chain. Throws on timeout.
     * @returns The wait result contains `complete`, a `status`, the ParentToChildMessage and optionally the `childTxReceipt`
     * If `complete` is true then this message is in the terminal state.
     * For eth deposits complete this is when the status is FUNDS_DEPOSITED, EXPIRED or REDEEMED.
     */
    async waitForChildTransactionReceipt(childProvider, confirmations, timeout) {
        const message = (await this.getEthDeposits(childProvider))[0];
        if (!message)
            throw new errors_1.ArbSdkError('Unexpected missing Eth Deposit message.');
        const res = await message.wait(confirmations, timeout);
        return {
            complete: (0, lib_1.isDefined)(res),
            childTxReceipt: res,
            message,
        };
    }
}
exports.ParentEthDepositTransactionReceipt = ParentEthDepositTransactionReceipt;
/**
 * A {@link ParentTransactionReceipt} with additional functionality that only exists
 * if the transaction created a single call to a child chain contract - this includes
 * token deposits.
 */
class ParentContractCallTransactionReceipt extends ParentTransactionReceipt {
    /**
     * Wait for the transaction to arrive and be executed on the child chain
     * @param confirmations Amount of confirmations the retryable ticket and the auto redeem receipt should have
     * @param timeout Amount of time to wait for the retryable ticket to be created
     * Defaults to 15 minutes, as by this time all transactions are expected to be included on the child chain. Throws on timeout.
     * @returns The wait result contains `complete`, a `status`, a {@link ParentToChildMessage} and optionally the `childTxReceipt`.
     * If `complete` is true then this message is in the terminal state.
     * For contract calls this is true only if the status is REDEEMED.
     */
    async waitForChildTransactionReceipt(childSignerOrProvider, confirmations, timeout) {
        const message = (await this.getParentToChildMessages(childSignerOrProvider))[0];
        if (!message)
            throw new errors_1.ArbSdkError('Unexpected missing Parent-to-child message.');
        const res = await message.waitForStatus(confirmations, timeout);
        return Object.assign(Object.assign({ complete: res.status === ParentToChildMessage_1.ParentToChildMessageStatus.REDEEMED }, res), { message });
    }
}
exports.ParentContractCallTransactionReceipt = ParentContractCallTransactionReceipt;
