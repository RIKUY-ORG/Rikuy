import { BigNumber } from 'ethers';
export interface RetryableData {
    from: string;
    /**
     * The address to be called on L2
     */
    to: string;
    /**
     * The value to call the L2 address with
     */
    l2CallValue: BigNumber;
    /**
     * The total amount to deposit on L1 to cover L2 gas and L2 call value
     */
    deposit: BigNumber;
    /**
     * The maximum cost to be paid for submitting the transaction
     */
    maxSubmissionCost: BigNumber;
    /**
     * The address to return the any gas that was not spent on fees
     */
    excessFeeRefundAddress: string;
    /**
     * The address to refund the call value to in the event the retryable is cancelled, or expires
     */
    callValueRefundAddress: string;
    /**
     * The L2 gas limit
     */
    gasLimit: BigNumber;
    /**
     * The max gas price to pay on L2
     */
    maxFeePerGas: BigNumber;
    /**
     * The data to call the L2 address with
     */
    data: string;
}
/**
 * Tools for parsing retryable data from errors.
 * When calling createRetryableTicket on Inbox.sol special values
 * can be passed for gasLimit and maxFeePerGas. This causes the call to revert
 * with the info needed to estimate the gas needed for a retryable ticket using
 * L1ToL2GasPriceEstimator.
 */
export declare class RetryableDataTools {
    /**
     * The parameters that should be passed to createRetryableTicket in order to induce
     * a revert with retryable data
     */
    static ErrorTriggeringParams: {
        gasLimit: BigNumber;
        maxFeePerGas: BigNumber;
    };
    private static isErrorData;
    private static tryGetErrorData;
    /**
     * Try to parse a retryable data struct from the supplied ethersjs error, or any explicitly supplied error data
     * @param ethersJsErrorOrData
     * @returns
     */
    static tryParseError(ethersJsErrorOrData: Error | {
        errorData: string;
    } | string): RetryableData | null;
}
