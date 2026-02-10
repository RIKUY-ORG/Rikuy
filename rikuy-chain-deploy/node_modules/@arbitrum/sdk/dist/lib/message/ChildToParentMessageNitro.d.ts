import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { BlockTag } from '@ethersproject/abstract-provider';
import { L2ToL1TxEvent as ChildToParentTxEvent } from '../abi/ArbSys';
import { ContractTransaction, Overrides } from 'ethers';
import { SignerOrProvider } from '../dataEntities/signerOrProvider';
import { EventArgs } from '../dataEntities/event';
import { ChildToParentMessageStatus } from '../dataEntities/message';
/**
 * Conditional type for Signer or Provider. If T is of type Provider
 * then ChildToParentMessageReaderOrWriter<T> will be of type ChildToParentMessageReader.
 * If T is of type Signer then ChildToParentMessageReaderOrWriter<T> will be of
 * type ChildToParentMessageWriter.
 */
export type ChildToParentMessageReaderOrWriterNitro<T extends SignerOrProvider> = T extends Provider ? ChildToParentMessageReaderNitro : ChildToParentMessageWriterNitro;
/**
 * Base functionality for nitro Child->Parent messages
 */
export declare class ChildToParentMessageNitro {
    readonly event: EventArgs<ChildToParentTxEvent>;
    protected constructor(event: EventArgs<ChildToParentTxEvent>);
    /**
     * Instantiates a new `ChildToParentMessageWriterNitro` or `ChildToParentMessageReaderNitro` object.
     *
     * @param {SignerOrProvider} parentSignerOrProvider Signer or provider to be used for executing or reading the Child-to-Parent message.
     * @param {EventArgs<ChildToParentTxEvent>} event The event containing the data of the Child-to-Parent message.
     * @param {Provider} [parentProvider] Optional. Used to override the Provider which is attached to `parentSignerOrProvider` in case you need more control. This will be a required parameter in a future major version update.
     */
    static fromEvent<T extends SignerOrProvider>(parentSignerOrProvider: T, event: EventArgs<ChildToParentTxEvent>, parentProvider?: Provider): ChildToParentMessageReaderOrWriterNitro<T>;
    static getChildToParentEvents(childProvider: Provider, filter: {
        fromBlock: BlockTag;
        toBlock: BlockTag;
    }, position?: BigNumber, destination?: string, hash?: BigNumber): Promise<(EventArgs<ChildToParentTxEvent> & {
        transactionHash: string;
    })[]>;
}
/**
 * Provides read-only access nitro for child-to-parent-messages
 */
export declare class ChildToParentMessageReaderNitro extends ChildToParentMessageNitro {
    protected readonly parentProvider: Provider;
    protected sendRootHash?: string;
    protected sendRootSize?: BigNumber;
    protected sendRootConfirmed?: boolean;
    protected outboxAddress?: string;
    protected l1BatchNumber?: number;
    constructor(parentProvider: Provider, event: EventArgs<ChildToParentTxEvent>);
    getOutboxProof(childProvider: Provider): Promise<string[]>;
    /**
     * Check if this message has already been executed in the Outbox
     */
    protected hasExecuted(childProvider: Provider): Promise<boolean>;
    /**
     * Get the status of this message
     * In order to check if the message has been executed proof info must be provided.
     * @returns
     */
    status(childProvider: Provider): Promise<ChildToParentMessageStatus>;
    private parseNodeCreatedAssertion;
    private parseAssertionCreatedEvent;
    private isAssertionCreatedLog;
    private getBlockFromAssertionLog;
    private isBoldRollupUserLogic;
    private getBlockFromAssertionId;
    protected getBatchNumber(childProvider: Provider): Promise<number | undefined>;
    protected getSendProps(childProvider: Provider): Promise<{
        sendRootSize: BigNumber | undefined;
        sendRootHash: string | undefined;
        sendRootConfirmed: boolean | undefined;
    }>;
    /**
     * Waits until the outbox entry has been created, and will not return until it has been.
     * WARNING: Outbox entries are only created when the corresponding node is confirmed. Which
     * can take 1 week+, so waiting here could be a very long operation.
     * @param retryDelay
     * @returns outbox entry status (either executed or confirmed but not pending)
     */
    waitUntilReadyToExecute(childProvider: Provider, retryDelay?: number): Promise<ChildToParentMessageStatus.EXECUTED | ChildToParentMessageStatus.CONFIRMED>;
    /**
     * Check whether the provided network has a BoLD rollup
     * @param arbitrumNetwork
     * @param parentProvider
     * @returns
     */
    private isBold;
    /**
     * If the local network is not currently bold, checks if the remote network is bold
     * and if so updates the local network with a new rollup address
     * @param arbitrumNetwork
     * @returns The rollup contract, bold or legacy
     */
    private getRollupAndUpdateNetwork;
    /**
     * Estimates the L1 block number in which this L2 to L1 tx will be available for execution.
     * If the message can or already has been executed, this returns null
     * @param childProvider
     * @returns expected parent chain block number where the child chain to parent chain message will be executable. Returns null if the message can be or already has been executed
     */
    getFirstExecutableBlock(childProvider: Provider): Promise<BigNumber | null>;
}
/**
 * Provides read and write access for nitro child-to-Parent-messages
 */
export declare class ChildToParentMessageWriterNitro extends ChildToParentMessageReaderNitro {
    private readonly parentSigner;
    /**
     * Instantiates a new `ChildToParentMessageWriterNitro` object.
     *
     * @param {Signer} parentSigner The signer to be used for executing the Child-to-Parent message.
     * @param {EventArgs<ChildToParentTxEvent>} event The event containing the data of the Child-to-Parent message.
     * @param {Provider} [parentProvider] Optional. Used to override the Provider which is attached to `parentSigner` in case you need more control. This will be a required parameter in a future major version update.
     */
    constructor(parentSigner: Signer, event: EventArgs<ChildToParentTxEvent>, parentProvider?: Provider);
    /**
     * Executes the ChildToParentMessage on Parent Chain.
     * Will throw an error if the outbox entry has not been created, which happens when the
     * corresponding assertion is confirmed.
     * @returns
     */
    execute(childProvider: Provider, overrides?: Overrides): Promise<ContractTransaction>;
}
