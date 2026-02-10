import { TransactionReceipt } from '@ethersproject/providers';
import { BigNumber } from '@ethersproject/bignumber';
import { Log } from '@ethersproject/abstract-provider';
import { ContractTransaction, providers } from 'ethers';
import { SignerOrProvider } from '../dataEntities/signerOrProvider';
import { ChildToParentMessageReaderOrWriter, ChildToParentTransactionEvent } from './ChildToParentMessage';
import { RedeemScheduledEvent } from '../abi/ArbRetryableTx';
import { EventArgs } from '../dataEntities/event';
export interface ChildContractTransaction extends ContractTransaction {
    wait(confirmations?: number): Promise<ChildTransactionReceipt>;
}
export interface RedeemTransaction extends ChildContractTransaction {
    waitForRedeem: () => Promise<TransactionReceipt>;
}
/**
 * Extension of ethers-js TransactionReceipt, adding Arbitrum-specific functionality
 */
export declare class ChildTransactionReceipt implements TransactionReceipt {
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
     * Get {@link ChildToParentTransactionEvent} events created by this transaction
     * @returns
     */
    getChildToParentEvents(): ChildToParentTransactionEvent[];
    /**
     * Get event data for any redeems that were scheduled in this transaction
     * @returns
     */
    getRedeemScheduledEvents(): EventArgs<RedeemScheduledEvent>[];
    /**
     * Get any child-to-parent-messages created by this transaction
     * @param parentSignerOrProvider
     */
    getChildToParentMessages<T extends SignerOrProvider>(parentSignerOrProvider: T): Promise<ChildToParentMessageReaderOrWriter<T>[]>;
    /**
     * Get number of parent chain confirmations that the batch including this tx has
     * @param childProvider
     * @returns number of confirmations of batch including tx, or 0 if no batch included this tx
     */
    getBatchConfirmations(childProvider: providers.JsonRpcProvider): Promise<BigNumber>;
    /**
     * Get the number of the batch that included this tx (will throw if no such batch exists)
     * @param childProvider
     * @returns number of batch in which tx was included, or errors if no batch includes the current tx
     */
    getBatchNumber(childProvider: providers.JsonRpcProvider): Promise<BigNumber>;
    /**
     * Whether the data associated with this transaction has been
     * made available on parent chain
     * @param childProvider
     * @param confirmations The number of confirmations on the batch before data is to be considered available
     * @returns
     */
    isDataAvailable(childProvider: providers.JsonRpcProvider, confirmations?: number): Promise<boolean>;
    /**
     * Replaces the wait function with one that returns an L2TransactionReceipt
     * @param contractTransaction
     * @returns
     */
    static monkeyPatchWait: (contractTransaction: ContractTransaction) => ChildContractTransaction;
    /**
     * Adds a waitForRedeem function to a redeem transaction
     * @param redeemTx
     * @param childProvider
     * @returns
     */
    static toRedeemTransaction(redeemTx: ChildContractTransaction, childProvider: providers.Provider): RedeemTransaction;
}
