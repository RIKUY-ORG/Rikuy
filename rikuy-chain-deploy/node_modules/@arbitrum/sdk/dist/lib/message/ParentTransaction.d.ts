import { TransactionReceipt } from '@ethersproject/providers';
import { Log, Provider } from '@ethersproject/abstract-provider';
import { ContractTransaction } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { ParentToChildMessageReaderOrWriter, ParentToChildMessageReaderClassic, ParentToChildMessageWaitForStatusResult, EthDepositMessage, EthDepositMessageWaitForStatusResult } from './ParentToChildMessage';
import { SignerOrProvider } from '../dataEntities/signerOrProvider';
import { InboxMessageDeliveredEvent } from '../abi/Inbox';
import { MessageDeliveredEvent } from '../abi/Bridge';
import { EventArgs } from '../dataEntities/event';
export interface ParentContractTransaction<TReceipt extends ParentTransactionReceipt = ParentTransactionReceipt> extends ContractTransaction {
    wait(confirmations?: number): Promise<TReceipt>;
}
export type ParentEthDepositTransaction = ParentContractTransaction<ParentEthDepositTransactionReceipt>;
export type ParentContractCallTransaction = ParentContractTransaction<ParentContractCallTransactionReceipt>;
export declare class ParentTransactionReceipt implements TransactionReceipt {
    readonly to: string;
    readonly from: string;
    readonly contractAddress: string;
    readonly transactionIndex: number;
    readonly root?: string;
    readonly gasUsed: BigNumber;
    readonly logsBloom: string;
    readonly blockHash: string;
    readonly transactionHash: string;
    readonly logs: Array<Log>;
    readonly blockNumber: number;
    readonly confirmations: number;
    readonly cumulativeGasUsed: BigNumber;
    readonly effectiveGasPrice: BigNumber;
    readonly byzantium: boolean;
    readonly type: number;
    readonly status?: number;
    constructor(tx: TransactionReceipt);
    /**
     * Check if is a classic transaction
     * @param childSignerOrProvider
     */
    isClassic<T extends SignerOrProvider>(childSignerOrProvider: T): Promise<boolean>;
    /**
     * Get any MessageDelivered events that were emitted during this transaction
     * @returns
     */
    getMessageDeliveredEvents(): EventArgs<MessageDeliveredEvent>[];
    /**
     * Get any InboxMessageDelivered events that were emitted during this transaction
     * @returns
     */
    getInboxMessageDeliveredEvents(): {
        messageNum: BigNumber;
        data: string;
    }[];
    /**
     * Get combined data for any InboxMessageDelivered and MessageDelivered events
     * emitted during this transaction
     * @returns
     */
    getMessageEvents(): {
        inboxMessageEvent: EventArgs<InboxMessageDeliveredEvent>;
        bridgeMessageEvent: EventArgs<MessageDeliveredEvent>;
    }[];
    /**
     * Get any eth deposit messages created by this transaction
     * @param childProvider
     */
    getEthDeposits(childProvider: Provider): Promise<EthDepositMessage[]>;
    /**
     * Get classic parent-to-child messages created by this transaction
     * @param childProvider
     */
    getParentToChildMessagesClassic(childProvider: Provider): Promise<ParentToChildMessageReaderClassic[]>;
    /**
     * Get any parent-to-child messages created by this transaction
     * @param childSignerOrProvider
     */
    getParentToChildMessages<T extends SignerOrProvider>(childSignerOrProvider: T): Promise<ParentToChildMessageReaderOrWriter<T>[]>;
    /**
     * Get any token deposit events created by this transaction
     * @returns
     */
    getTokenDepositEvents(): {
        l1Token: string;
        _from: string;
        _to: string;
        _sequenceNumber: BigNumber;
        _amount: BigNumber;
    }[];
    /**
     * Replaces the wait function with one that returns a {@link ParentTransactionReceipt}
     * @param contractTransaction
     * @returns
     */
    static monkeyPatchWait: (contractTransaction: ContractTransaction) => ParentContractTransaction;
    /**
     * Replaces the wait function with one that returns a {@link ParentEthDepositTransactionReceipt}
     * @param contractTransaction
     * @returns
     */
    static monkeyPatchEthDepositWait: (contractTransaction: ContractTransaction) => ParentEthDepositTransaction;
    /**
     * Replaces the wait function with one that returns a {@link ParentContractCallTransactionReceipt}
     * @param contractTransaction
     * @returns
     */
    static monkeyPatchContractCallWait: (contractTransaction: ContractTransaction) => ParentContractCallTransaction;
}
/**
 * A {@link ParentTransactionReceipt} with additional functionality that only exists
 * if the transaction created a single eth deposit.
 */
export declare class ParentEthDepositTransactionReceipt extends ParentTransactionReceipt {
    /**
     * Wait for the funds to arrive on the child chain
     * @param confirmations Amount of confirmations the retryable ticket and the auto redeem receipt should have
     * @param timeout Amount of time to wait for the retryable ticket to be created
     * Defaults to 15 minutes, as by this time all transactions are expected to be included on the child chain. Throws on timeout.
     * @returns The wait result contains `complete`, a `status`, the ParentToChildMessage and optionally the `childTxReceipt`
     * If `complete` is true then this message is in the terminal state.
     * For eth deposits complete this is when the status is FUNDS_DEPOSITED, EXPIRED or REDEEMED.
     */
    waitForChildTransactionReceipt(childProvider: Provider, confirmations?: number, timeout?: number): Promise<{
        complete: boolean;
        message: EthDepositMessage;
    } & EthDepositMessageWaitForStatusResult>;
}
/**
 * A {@link ParentTransactionReceipt} with additional functionality that only exists
 * if the transaction created a single call to a child chain contract - this includes
 * token deposits.
 */
export declare class ParentContractCallTransactionReceipt extends ParentTransactionReceipt {
    /**
     * Wait for the transaction to arrive and be executed on the child chain
     * @param confirmations Amount of confirmations the retryable ticket and the auto redeem receipt should have
     * @param timeout Amount of time to wait for the retryable ticket to be created
     * Defaults to 15 minutes, as by this time all transactions are expected to be included on the child chain. Throws on timeout.
     * @returns The wait result contains `complete`, a `status`, a {@link ParentToChildMessage} and optionally the `childTxReceipt`.
     * If `complete` is true then this message is in the terminal state.
     * For contract calls this is true only if the status is REDEEMED.
     */
    waitForChildTransactionReceipt<T extends SignerOrProvider>(childSignerOrProvider: T, confirmations?: number, timeout?: number): Promise<{
        complete: boolean;
        message: ParentToChildMessageReaderOrWriter<T>;
    } & ParentToChildMessageWaitForStatusResult>;
}
