import { TransactionReceipt } from '@ethersproject/providers';
import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { ContractTransaction } from '@ethersproject/contracts';
import { BigNumber } from '@ethersproject/bignumber';
import { SignerOrProvider } from '../dataEntities/signerOrProvider';
import { Overrides } from 'ethers';
import { RedeemTransaction } from './ChildTransaction';
import { RetryableMessageParams } from '../dataEntities/message';
export declare enum ParentToChildMessageStatus {
    /**
     * The retryable ticket has yet to be created
     */
    NOT_YET_CREATED = 1,
    /**
     * An attempt was made to create the retryable ticket, but it failed.
     * This could be due to not enough submission cost being paid by the Parent transaction
     */
    CREATION_FAILED = 2,
    /**
     * The retryable ticket has been created but has not been redeemed. This could be due to the
     * auto redeem failing, or if the params (max chain gas price) * (max chain gas) = 0 then no auto
     * redeem tx is ever issued. An auto redeem is also never issued for ETH deposits.
     * A manual redeem is now required.
     */
    FUNDS_DEPOSITED_ON_CHILD = 3,
    /**
     * The retryable ticket has been redeemed (either by auto, or manually) and the
     * chain transaction has been executed
     */
    REDEEMED = 4,
    /**
     * The message has either expired or has been canceled. It can no longer be redeemed.
     */
    EXPIRED = 5
}
export declare enum EthDepositMessageStatus {
    /**
     * ETH is not deposited on Chain yet
     */
    PENDING = 1,
    /**
     * ETH is deposited successfully on Chain
     */
    DEPOSITED = 2
}
/**
 * Conditional type for Signer or Provider. If T is of type Provider
 * then ParentToChildMessageReaderOrWriter<T> will be of type ParentToChildMessageReader.
 * If T is of type Signer then ParentToChildMessageReaderOrWriter<T> will be of
 * type ParentToChildMessageWriter.
 */
export type ParentToChildMessageReaderOrWriter<T extends SignerOrProvider> = T extends Provider ? ParentToChildMessageReader : ParentToChildMessageWriter;
export declare abstract class ParentToChildMessage {
    readonly chainId: number;
    readonly sender: string;
    readonly messageNumber: BigNumber;
    readonly parentBaseFee: BigNumber;
    readonly messageData: RetryableMessageParams;
    /**
     * When messages are sent from Parent to Child a retryable ticket is created on the child chain.
     * The retryableCreationId can be used to retrieve information about the success or failure of the
     * creation of the retryable ticket.
     */
    readonly retryableCreationId: string;
    /**
     * The submit retryable transactions use the typed transaction envelope 2718.
     * The id of these transactions is the hash of the RLP encoded transaction.
     * @param childChainId
     * @param fromAddress the aliased address that called the Parent inbox as emitted in the bridge event.
     * @param messageNumber
     * @param parentBaseFee
     * @param destAddress
     * @param childCallValue
     * @param parentCallValue
     * @param maxSubmissionFee
     * @param excessFeeRefundAddress refund address specified in the retryable creation. Note the Parent inbox aliases this address if it is a Parent smart contract. The user is expected to provide this value already aliased when needed.
     * @param callValueRefundAddress refund address specified in the retryable creation. Note the Parent inbox aliases this address if it is a Parent smart contract. The user is expected to provide this value already aliased when needed.
     * @param gasLimit
     * @param maxFeePerGas
     * @param data
     * @returns
     */
    static calculateSubmitRetryableId(childChainId: number, fromAddress: string, messageNumber: BigNumber, parentBaseFee: BigNumber, destAddress: string, childCallValue: BigNumber, parentCallValue: BigNumber, maxSubmissionFee: BigNumber, excessFeeRefundAddress: string, callValueRefundAddress: string, gasLimit: BigNumber, maxFeePerGas: BigNumber, data: string): string;
    static fromEventComponents<T extends SignerOrProvider>(chainSignerOrProvider: T, chainId: number, sender: string, messageNumber: BigNumber, parentBaseFee: BigNumber, messageData: RetryableMessageParams): ParentToChildMessageReaderOrWriter<T>;
    protected constructor(chainId: number, sender: string, messageNumber: BigNumber, parentBaseFee: BigNumber, messageData: RetryableMessageParams);
}
/**
 * If the status is redeemed, childTxReceipt is populated.
 * For all other statuses childTxReceipt is not populated
 */
export type ParentToChildMessageWaitForStatusResult = {
    status: ParentToChildMessageStatus.REDEEMED;
    childTxReceipt: TransactionReceipt;
} | {
    status: Exclude<ParentToChildMessageStatus, ParentToChildMessageStatus.REDEEMED>;
};
export type EthDepositMessageWaitForStatusResult = {
    childTxReceipt: TransactionReceipt | null;
};
export declare class ParentToChildMessageReader extends ParentToChildMessage {
    readonly childProvider: Provider;
    private retryableCreationReceipt;
    constructor(childProvider: Provider, chainId: number, sender: string, messageNumber: BigNumber, parentBaseFee: BigNumber, messageData: RetryableMessageParams);
    /**
     * Try to get the receipt for the retryable ticket creation.
     * This is the Chain transaction that creates the retryable ticket.
     * If confirmations or timeout is provided, this will wait for the ticket to be created
     * @returns Null if retryable has not been created
     */
    getRetryableCreationReceipt(confirmations?: number, timeout?: number): Promise<TransactionReceipt | null>;
    /**
     * When retryable tickets are created, and gas is supplied to it, an attempt is
     * made to redeem the ticket straight away. This is called an auto redeem.
     * @returns TransactionReceipt of the auto redeem attempt if exists, otherwise null
     */
    getAutoRedeemAttempt(): Promise<TransactionReceipt | null>;
    /**
     * Receipt for the successful chain transaction created by this message.
     * @returns TransactionReceipt of the first successful redeem if exists, otherwise the current status of the message.
     */
    getSuccessfulRedeem(): Promise<ParentToChildMessageWaitForStatusResult>;
    /**
     * Has this message expired. Once expired the retryable ticket can no longer be redeemed.
     * @deprecated Will be removed in v3.0.0
     * @returns
     */
    isExpired(): Promise<boolean>;
    private retryableExists;
    status(): Promise<ParentToChildMessageStatus>;
    /**
     * Wait for the retryable ticket to be created, for it to be redeemed, and for the chainTx to be executed.
     * Note: The terminal status of a transaction that only does an eth deposit is FUNDS_DEPOSITED_ON_CHILD as
     * no Chain transaction needs to be executed, however the terminal state of any other transaction is REDEEMED
     * which represents that the retryable ticket has been redeemed and the Chain tx has been executed.
     * @param confirmations Amount of confirmations the retryable ticket and the auto redeem receipt should have
     * @param timeout Amount of time to wait for the retryable ticket to be created
     * Defaults to 15 minutes, as by this time all transactions are expected to be included on Chain. Throws on timeout.
     * @returns The wait result contains a status, and optionally the chainTxReceipt.
     * If the status is "REDEEMED" then a chainTxReceipt is also available on the result.
     * If the status has any other value then chainTxReceipt is not populated.
     */
    waitForStatus(confirmations?: number, timeout?: number): Promise<ParentToChildMessageWaitForStatusResult>;
    /**
     * The minimium lifetime of a retryable tx
     * @returns
     */
    static getLifetime(childProvider: Provider): Promise<BigNumber>;
    /**
     * Timestamp at which this message expires
     * @returns
     */
    getTimeout(): Promise<BigNumber>;
    /**
     * Address to which CallValue will be credited to on Chain if the retryable ticket times out or is cancelled.
     * The Beneficiary is also the address with the right to cancel a Retryable Ticket (if the ticket hasn’t been redeemed yet).
     * @returns
     */
    getBeneficiary(): Promise<string>;
}
export declare class ParentToChildMessageReaderClassic {
    private retryableCreationReceipt;
    readonly messageNumber: BigNumber;
    readonly retryableCreationId: string;
    readonly autoRedeemId: string;
    readonly childTxHash: string;
    readonly childProvider: Provider;
    constructor(childProvider: Provider, chainId: number, messageNumber: BigNumber);
    private calculateChainDerivedHash;
    /**
     * Try to get the receipt for the retryable ticket creation.
     * This is the Chain transaction that creates the retryable ticket.
     * If confirmations or timeout is provided, this will wait for the ticket to be created
     * @returns Null if retryable has not been created
     */
    getRetryableCreationReceipt(confirmations?: number, timeout?: number): Promise<TransactionReceipt | null>;
    status(): Promise<ParentToChildMessageStatus>;
}
export declare class ParentToChildMessageWriter extends ParentToChildMessageReader {
    readonly chainSigner: Signer;
    constructor(chainSigner: Signer, chainId: number, sender: string, messageNumber: BigNumber, parentBaseFee: BigNumber, messageData: RetryableMessageParams);
    /**
     * Manually redeem the retryable ticket.
     * Throws if message status is not ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD
     */
    redeem(overrides?: Overrides): Promise<RedeemTransaction>;
    /**
     * Cancel the retryable ticket.
     * Throws if message status is not ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD
     */
    cancel(overrides?: Overrides): Promise<ContractTransaction>;
    /**
     * Increase the timeout of a retryable ticket.
     * Throws if message status is not ParentToChildMessageStatus.FUNDS_DEPOSITED_ON_CHILD
     */
    keepAlive(overrides?: Overrides): Promise<ContractTransaction>;
}
/**
 * A message for Eth deposits from Parent to Child
 */
export declare class EthDepositMessage {
    private readonly childProvider;
    readonly childChainId: number;
    readonly messageNumber: BigNumber;
    readonly from: string;
    readonly to: string;
    readonly value: BigNumber;
    readonly childTxHash: string;
    private childTxReceipt;
    static calculateDepositTxId(childChainId: number, messageNumber: BigNumber, fromAddress: string, toAddress: string, value: BigNumber): string;
    /**
     * Parse the data field in
     * event InboxMessageDelivered(uint256 indexed messageNum, bytes data);
     * @param eventData
     * @returns destination and amount
     */
    private static parseEthDepositData;
    /**
     * Create an EthDepositMessage from data emitted in event when calling ethDeposit on Inbox.sol
     * @param childProvider
     * @param messageNumber The message number in the Inbox.InboxMessageDelivered event
     * @param senderAddr The sender address from Bridge.MessageDelivered event
     * @param inboxMessageEventData The data field from the Inbox.InboxMessageDelivered event
     * @returns
     */
    static fromEventComponents(childProvider: Provider, messageNumber: BigNumber, senderAddr: string, inboxMessageEventData: string): Promise<EthDepositMessage>;
    /**
     *
     * @param childProvider
     * @param childChainId
     * @param messageNumber
     * @param to Recipient address of the ETH on Chain
     * @param value
     */
    constructor(childProvider: Provider, childChainId: number, messageNumber: BigNumber, from: string, to: string, value: BigNumber);
    status(): Promise<EthDepositMessageStatus>;
    wait(confirmations?: number, timeout?: number): Promise<TransactionReceipt | null>;
}
