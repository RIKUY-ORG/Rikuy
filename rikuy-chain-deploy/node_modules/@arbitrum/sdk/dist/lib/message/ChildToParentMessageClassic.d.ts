import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { BlockTag } from '@ethersproject/abstract-provider';
import { L2ToL1TransactionEvent as ChildToParentTransactionEvent } from '../abi/ArbSys';
import { ContractTransaction, Overrides } from 'ethers';
import { SignerOrProvider } from '../dataEntities/signerOrProvider';
import { EventArgs } from '../dataEntities/event';
import { ChildToParentMessageStatus } from '../dataEntities/message';
export interface MessageBatchProofInfo {
    /**
     * Merkle proof of message inclusion in outbox entry
     */
    proof: string[];
    /**
     * Merkle path to message
     */
    path: BigNumber;
    /**
     * Sender of original message (i.e., caller of ArbSys.sendTxToL1)
     */
    l2Sender: string;
    /**
     * Destination address for L1 contract call
     */
    l1Dest: string;
    /**
     * L2 block number at which sendTxToL1 call was made
     */
    l2Block: BigNumber;
    /**
     * L1 block number at which sendTxToL1 call was made
     */
    l1Block: BigNumber;
    /**
     * L2 Timestamp at which sendTxToL1 call was made
     */
    timestamp: BigNumber;
    /**
     * Value in L1 message in wei
     */
    amount: BigNumber;
    /**
     * ABI-encoded L1 message data
     */
    calldataForL1: string;
}
/**
 * Conditional type for Signer or Provider. If T is of type Provider
 * then ChildToParentMessageReaderOrWriter<T> will be of type ChildToParentMessageReader.
 * If T is of type Signer then ChildToParentMessageReaderOrWriter<T> will be of
 * type ChildToParentMessageWriter.
 */
export type ChildToParentMessageReaderOrWriterClassic<T extends SignerOrProvider> = T extends Provider ? ChildToParentMessageReaderClassic : ChildToParentMessageWriterClassic;
export declare class ChildToParentMessageClassic {
    /**
     * The number of the batch this message is part of
     */
    readonly batchNumber: BigNumber;
    /**
     * The index of this message in the batch
     */
    readonly indexInBatch: BigNumber;
    protected constructor(batchNumber: BigNumber, indexInBatch: BigNumber);
    /**
     * Instantiates a new `ChildToParentMessageWriterClassic` or `ChildToParentMessageReaderClassic` object.
     *
     * @param {SignerOrProvider} parentSignerOrProvider Signer or provider to be used for executing or reading the Child-to-Parent message.
     * @param {BigNumber} batchNumber The number of the batch containing the Child-to-Parent message.
     * @param {BigNumber} indexInBatch The index of the Child-to-Parent message within the batch.
     * @param {Provider} [parentProvider] Optional. Used to override the Provider which is attached to `parentSignerOrProvider` in case you need more control. This will be a required parameter in a future major version update.
     */
    static fromBatchNumber<T extends SignerOrProvider>(parentSignerOrProvider: T, batchNumber: BigNumber, indexInBatch: BigNumber, parentProvider?: Provider): ChildToParentMessageReaderOrWriterClassic<T>;
    static getChildToParentEvents(childProvider: Provider, filter: {
        fromBlock: BlockTag;
        toBlock: BlockTag;
    }, batchNumber?: BigNumber, destination?: string, uniqueId?: BigNumber, indexInBatch?: BigNumber): Promise<(EventArgs<ChildToParentTransactionEvent> & {
        transactionHash: string;
    })[]>;
}
/**
 * Provides read-only access for classic Child-to-Parent-messages
 */
export declare class ChildToParentMessageReaderClassic extends ChildToParentMessageClassic {
    protected readonly parentProvider: Provider;
    constructor(parentProvider: Provider, batchNumber: BigNumber, indexInBatch: BigNumber);
    /**
     * Contains the classic outbox address, or set to zero address if this network
     * did not have a classic outbox deployed
     */
    protected outboxAddress: string | null;
    /**
     * Classic had 2 outboxes, we need to find the correct one for the provided batch number
     * @param  childProvider
     * @param batchNumber
     * @returns
     */
    protected getOutboxAddress(childProvider: Provider, batchNumber: number): Promise<string>;
    private outboxEntryExists;
    static tryGetProof(childProvider: Provider, batchNumber: BigNumber, indexInBatch: BigNumber): Promise<MessageBatchProofInfo | null>;
    private proof;
    /**
     * Get the execution proof for this message. Returns null if the batch does not exist yet.
     * @param  childProvider
     * @returns
     */
    tryGetProof(childProvider: Provider): Promise<MessageBatchProofInfo | null>;
    /**
     * Check if given outbox message has already been executed
     */
    hasExecuted(childProvider: Provider): Promise<boolean>;
    /**
     * Get the status of this message
     * In order to check if the message has been executed proof info must be provided.
     * @param childProvider
     * @returns
     */
    status(childProvider: Provider): Promise<ChildToParentMessageStatus>;
    /**
     * Waits until the outbox entry has been created, and will not return until it has been.
     * WARNING: Outbox entries are only created when the corresponding node is confirmed. Which
     * can take 1 week+, so waiting here could be a very long operation.
     * @param retryDelay
     * @returns outbox entry status (either executed or confirmed but not pending)
     */
    waitUntilOutboxEntryCreated(childProvider: Provider, retryDelay?: number): Promise<ChildToParentMessageStatus.EXECUTED | ChildToParentMessageStatus.CONFIRMED>;
    /**
     * Estimates the Parent Chain block number in which this Child-to-Parent tx will be available for execution
     * @param  childProvider
     * @returns Always returns null for classic chainToParentChain messages since they can be executed in any block now.
     */
    getFirstExecutableBlock(childProvider: Provider): Promise<BigNumber | null>;
}
/**
 * Provides read and write access for classic Child-to-Parent-messages
 */
export declare class ChildToParentMessageWriterClassic extends ChildToParentMessageReaderClassic {
    private readonly parentSigner;
    /**
     * Instantiates a new `ChildToParentMessageWriterClassic` object.
     *
     * @param {Signer} parentSigner The signer to be used for executing the Child-to-Parent message.
     * @param {BigNumber} batchNumber The number of the batch containing the Child-to-Parent message.
     * @param {BigNumber} indexInBatch The index of the Child-to-Parent message within the batch.
     * @param {Provider} [parentProvider] Optional. Used to override the Provider which is attached to `parentSigner` in case you need more control. This will be a required parameter in a future major version update.
     */
    constructor(parentSigner: Signer, batchNumber: BigNumber, indexInBatch: BigNumber, parentProvider?: Provider);
    /**
     * Executes the ChildToParentMessage on Parent Chain.
     * Will throw an error if the outbox entry has not been created, which happens when the
     * corresponding assertion is confirmed.
     * @returns
     */
    execute(childProvider: Provider, overrides?: Overrides): Promise<ContractTransaction>;
}
