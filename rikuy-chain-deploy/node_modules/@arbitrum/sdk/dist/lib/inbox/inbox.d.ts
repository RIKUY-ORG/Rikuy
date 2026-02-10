import { Signer } from '@ethersproject/abstract-signer';
import { ContractTransaction, Overrides } from 'ethers';
import { TransactionRequest } from '@ethersproject/providers';
import { RequiredPick } from '../utils/types';
import { MessageDeliveredEvent } from '../abi/Bridge';
import { ArbitrumNetwork } from '../dataEntities/networks';
import { FetchedEvent } from '../utils/eventFetcher';
type ForceInclusionParams = FetchedEvent<MessageDeliveredEvent> & {
    delayedAcc: string;
};
type RequiredTransactionRequestType = RequiredPick<TransactionRequest, 'data' | 'value'>;
/**
 * Tools for interacting with the inbox and bridge contracts
 */
export declare class InboxTools {
    private readonly parentSigner;
    private readonly childChain;
    /**
     * Parent chain provider
     */
    private readonly parentProvider;
    constructor(parentSigner: Signer, childChain: ArbitrumNetwork);
    /**
     * Find the first (or close to first) block whose number
     * is below the provided number, and whose timestamp is below
     * the provided timestamp
     * @param blockNumber
     * @param blockTimestamp
     * @returns
     */
    private findFirstBlockBelow;
    private isContractCreation;
    /**
     * We should use nodeInterface to get the gas estimate is because we
     * are making a delayed inbox message which doesn't need parent calldata
     * gas fee part.
     */
    private estimateArbitrumGas;
    /**
     * Get a range of blocks within messages eligible for force inclusion emitted events
     * @param blockNumberRangeSize
     * @returns
     */
    private getForceIncludableBlockRange;
    /**
     * Look for force includable events in the search range blocks, if no events are found the search range is
     * increased incrementally up to the max search range blocks.
     * @param bridge
     * @param searchRangeBlocks
     * @param maxSearchRangeBlocks
     * @returns
     */
    private getEventsAndIncreaseRange;
    /**
     * Find the event of the latest message that can be force include
     * @param maxSearchRangeBlocks The max range of blocks to search in.
     * Defaults to 3 * 6545 ( = ~3 days) prior to the first eligible block
     * @param startSearchRangeBlocks The start range of block to search in.
     * Moves incrementally up to the maxSearchRangeBlocks. Defaults to 100;
     * @param rangeMultiplier The multiplier to use when increasing the block range
     * Defaults to 2.
     * @returns Null if non can be found.
     */
    getForceIncludableEvent(maxSearchRangeBlocks?: number, startSearchRangeBlocks?: number, rangeMultiplier?: number): Promise<ForceInclusionParams | null>;
    /**
     * Force includes all eligible messages in the delayed inbox.
     * The inbox contract doesn't allow a message to be force-included
     * until after a delay period has been completed.
     * @param messageDeliveredEvent Provide this to include all messages up to this one. Responsibility is on the caller to check the eligibility of this event.
     * @returns The force include transaction, or null if no eligible message were found for inclusion
     */
    forceInclude<T extends ForceInclusionParams | undefined>(messageDeliveredEvent?: T, overrides?: Overrides): Promise<T extends ForceInclusionParams ? ContractTransaction : ContractTransaction | null>;
    /**
     * Send Child Chain signed tx using delayed inbox, which won't alias the sender's address
     * It will be automatically included by the sequencer on Chain, if it isn't included
     * within 24 hours, you can force include it
     * @param signedTx A signed transaction which can be sent directly to chain,
     * you can call inboxTools.signChainMessage to get.
     * @returns The parent delayed inbox's transaction itself.
     */
    sendChildSignedTx(signedTx: string): Promise<ContractTransaction | null>;
    /**
     * Sign a transaction with msg.to, msg.value and msg.data.
     * You can use this as a helper to call inboxTools.sendChainSignedMessage
     * above.
     * @param txRequest A signed transaction which can be sent directly to chain,
     * tx.to, tx.data, tx.value must be provided when not contract creation, if
     * contractCreation is true, no need provide tx.to. tx.gasPrice and tx.nonce
     * can be overrided. (You can also send contract creation transaction by set tx.to
     * to zero address or null)
     * @param childSigner ethers Signer type, used to sign Chain transaction
     * @returns The parent delayed inbox's transaction signed data.
     */
    signChildTx(txRequest: RequiredTransactionRequestType, childSigner: Signer): Promise<string>;
}
export {};
