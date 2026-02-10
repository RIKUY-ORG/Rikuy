import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { BlockTag } from '@ethersproject/abstract-provider';
import { ContractTransaction, Overrides } from 'ethers';
import { SignerOrProvider } from '../dataEntities/signerOrProvider';
import * as classic from './ChildToParentMessageClassic';
import { L2ToL1TransactionEvent as ClassicChildToParentTransactionEvent, L2ToL1TxEvent as NitroChildToParentTransactionEvent } from '../abi/ArbSys';
import { EventArgs } from '../dataEntities/event';
import { ChildToParentMessageStatus } from '../dataEntities/message';
export type ChildToParentTransactionEvent = EventArgs<ClassicChildToParentTransactionEvent> | EventArgs<NitroChildToParentTransactionEvent>;
/**
 * Conditional type for Signer or Provider. If T is of type Provider
 * then ChildToParentMessageReaderOrWriter<T> will be of type ChildToParentMessageReader.
 * If T is of type Signer then ChildToParentMessageReaderOrWriter<T> will be of
 * type ChildToParentMessageWriter.
 */
export type ChildToParentMessageReaderOrWriter<T extends SignerOrProvider> = T extends Provider ? ChildToParentMessageReader : ChildToParentMessageWriter;
/**
 * Base functionality for Child-to-Parent messages
 */
export declare class ChildToParentMessage {
    protected isClassic(e: ChildToParentTransactionEvent): e is EventArgs<ClassicChildToParentTransactionEvent>;
    /**
     * Instantiates a new `ChildToParentMessageWriter` or `ChildToParentMessageReader` object.
     *
     * @param {SignerOrProvider} parentSignerOrProvider Signer or provider to be used for executing or reading the Child-to-Parent message.
     * @param {ChildToParentTransactionEvent} event The event containing the data of the Child-to-Parent message.
     * @param {Provider} [parentProvider] Optional. Used to override the Provider which is attached to `ParentSignerOrProvider` in case you need more control. This will be a required parameter in a future major version update.
     */
    static fromEvent<T extends SignerOrProvider>(parentSignerOrProvider: T, event: ChildToParentTransactionEvent, parentProvider?: Provider): ChildToParentMessageReaderOrWriter<T>;
    /**
     * Get event logs for ChildToParent transactions.
     * @param childProvider
     * @param filter Block range filter
     * @param position The batchnumber indexed field was removed in nitro and a position indexed field was added.
     * For pre-nitro events the value passed in here will be used to find events with the same batchnumber.
     * For post nitro events it will be used to find events with the same position.
     * @param destination The parent destination of the ChildToParent message
     * @param hash The uniqueId indexed field was removed in nitro and a hash indexed field was added.
     * For pre-nitro events the value passed in here will be used to find events with the same uniqueId.
     * For post nitro events it will be used to find events with the same hash.
     * @param indexInBatch The index in the batch, only valid for pre-nitro events. This parameter is ignored post-nitro
     * @returns Any classic and nitro events that match the provided filters.
     */
    static getChildToParentEvents(childProvider: Provider, filter: {
        fromBlock: BlockTag;
        toBlock: BlockTag;
    }, position?: BigNumber, destination?: string, hash?: BigNumber, indexInBatch?: BigNumber): Promise<(ChildToParentTransactionEvent & {
        transactionHash: string;
    })[]>;
}
/**
 * Provides read-only access for Child-to-Parent messages
 */
export declare class ChildToParentMessageReader extends ChildToParentMessage {
    protected readonly parentProvider: Provider;
    private readonly classicReader?;
    private readonly nitroReader?;
    constructor(parentProvider: Provider, event: ChildToParentTransactionEvent);
    getOutboxProof(childProvider: Provider): Promise<classic.MessageBatchProofInfo | null | string[]>;
    /**
     * Get the status of this message
     * In order to check if the message has been executed proof info must be provided.
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
    waitUntilReadyToExecute(childProvider: Provider, retryDelay?: number): Promise<ChildToParentMessageStatus.EXECUTED | ChildToParentMessageStatus.CONFIRMED>;
    /**
     * Estimates the Parent block number in which this Child-to-Parent tx will be available for execution.
     * If the message can or already has been executed, this returns null
     * @param childProvider
     * @returns expected Parent block number where the Child-to-Parent message will be executable. Returns null if the message can or already has been executed
     */
    getFirstExecutableBlock(childProvider: Provider): Promise<BigNumber | null>;
}
/**
 * Provides read and write access for Child-to-Parent messages
 */
export declare class ChildToParentMessageWriter extends ChildToParentMessageReader {
    private readonly classicWriter?;
    private readonly nitroWriter?;
    /**
     * Instantiates a new `ChildToParentMessageWriter` object.
     *
     * @param {Signer} parentSigner The signer to be used for executing the Child-to-Parent message.
     * @param {ChildToParentTransactionEvent} event The event containing the data of the Child-to-Parent message.
     * @param {Provider} [parentProvider] Optional. Used to override the Provider which is attached to `parentSigner` in case you need more control. This will be a required parameter in a future major version update.
     */
    constructor(parentSigner: Signer, event: ChildToParentTransactionEvent, parentProvider?: Provider);
    /**
     * Executes the ChildToParentMessage on Parent chain.
     * Will throw an error if the outbox entry has not been created, which happens when the
     * corresponding assertion is confirmed.
     * @returns
     */
    execute(childProvider: Provider, overrides?: Overrides): Promise<ContractTransaction>;
}
