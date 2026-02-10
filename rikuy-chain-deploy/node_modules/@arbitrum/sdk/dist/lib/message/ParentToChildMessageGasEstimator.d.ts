import { Provider } from '@ethersproject/abstract-provider';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { BytesLike } from 'ethers';
import { RetryableData } from '../dataEntities/retryableData';
import { ParentToChildTransactionRequest } from '../dataEntities/transactionRequest';
import { OmitTyped } from '../utils/types';
import { ParentToChildMessageGasParams, ParentToChildMessageNoGasParams } from './ParentToChildMessageCreator';
/**
 * An optional big number percentage increase
 */
export type PercentIncrease = {
    /**
     * If provided, will override the estimated base
     */
    base?: BigNumber;
    /**
     * How much to increase the base by. If not provided system defaults may be used.
     */
    percentIncrease?: BigNumber;
};
export interface GasOverrides {
    gasLimit?: PercentIncrease & {
        /**
         * Set a minimum max gas
         */
        min?: BigNumber;
    };
    maxSubmissionFee?: PercentIncrease;
    maxFeePerGas?: PercentIncrease;
    /**
     * funds deposited along with the retryable (ie the msg.value that called the inbox)
     */
    deposit?: Pick<PercentIncrease, 'base'>;
}
export declare class ParentToChildMessageGasEstimator {
    readonly childProvider: Provider;
    constructor(childProvider: Provider);
    private percentIncrease;
    private applySubmissionPriceDefaults;
    private applyMaxFeePerGasDefaults;
    private applyGasLimitDefaults;
    /**
     * Return the fee, in wei, of submitting a new retryable tx with a given calldata size.
     * @param parentProvider
     * @param parentBaseFee
     * @param callDataSize
     * @param options
     * @returns
     */
    estimateSubmissionFee(parentProvider: Provider, parentBaseFee: BigNumber, callDataSize: BigNumber | number, options?: PercentIncrease): Promise<ParentToChildMessageGasParams['maxSubmissionCost']>;
    /**
     * Estimate the amount of child chain gas required for putting the transaction in the L2 inbox, and executing it.
     * @param retryableData object containing retryable ticket data
     * @param senderDeposit we dont know how much gas the transaction will use when executing
     * so by default we supply a dummy amount of call value that will definately be more than we need
     * @returns
     */
    estimateRetryableTicketGasLimit({ from, to, l2CallValue: l2CallValue, excessFeeRefundAddress, callValueRefundAddress, data, }: ParentToChildMessageNoGasParams, senderDeposit?: BigNumber): Promise<ParentToChildMessageGasParams['gasLimit']>;
    /**
     * Provides an estimate for the child chain maxFeePerGas, adding some margin to allow for gas price variation
     * @param options
     * @returns
     */
    estimateMaxFeePerGas(options?: PercentIncrease): Promise<ParentToChildMessageGasParams['maxFeePerGas']>;
    /**
     * Checks if the estimate is valid when compared with a new one
     * @param estimates Original estimate
     * @param reEstimates Estimate to compare against
     * @returns
     */
    static isValid(estimates: ParentToChildMessageGasParams, reEstimates: ParentToChildMessageGasParams): Promise<boolean>;
    /**
     * Get gas limit, gas price and submission price estimates for sending a Parent->Child message
     * @param retryableData Data of retryable ticket transaction
     * @param parentBaseFee Current parent chain base fee
     * @param parentProvider
     * @param options
     * @returns
     */
    estimateAll(retryableEstimateData: ParentToChildMessageNoGasParams, parentBaseFee: BigNumber, parentProvider: Provider, options?: GasOverrides): Promise<ParentToChildMessageGasParams>;
    /**
     * Transactions that make a Parent->Child message need to estimate L2 gas parameters
     * This function does that, and populates those parameters into a transaction request
     * @param dataFunc
     * @param parentProvider
     * @param gasOverrides
     * @returns
     */
    populateFunctionParams(
    /**
     * Function that will internally make a Parent->Child transaction
     * Will initially be called with dummy values to trigger a special revert containing
     * the real params. Then called again with the real params to form the final data to be submitted
     */
    dataFunc: (params: OmitTyped<ParentToChildMessageGasParams, 'deposit'>) => ParentToChildTransactionRequest['txRequest'], parentProvider: Provider, gasOverrides?: GasOverrides): Promise<{
        estimates: ParentToChildMessageGasParams;
        retryable: RetryableData;
        data: BytesLike;
        to: string;
        value: BigNumberish;
    }>;
}
