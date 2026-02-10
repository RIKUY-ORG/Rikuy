import { Signer } from '@ethersproject/abstract-signer';
import { Provider } from '@ethersproject/abstract-provider';
import { GasOverrides } from './ParentToChildMessageGasEstimator';
import { ParentContractTransaction } from './ParentTransaction';
import { PayableOverrides } from '@ethersproject/contracts';
import { ParentToChildTransactionRequest } from '../dataEntities/transactionRequest';
import { RetryableData } from '../dataEntities/retryableData';
import { OmitTyped, PartialPick } from '../utils/types';
type ParentToChildGasKeys = 'maxSubmissionCost' | 'maxFeePerGas' | 'gasLimit' | 'deposit';
export type ParentToChildMessageGasParams = Pick<RetryableData, ParentToChildGasKeys>;
export type ParentToChildMessageNoGasParams = OmitTyped<RetryableData, ParentToChildGasKeys>;
export type ParentToChildMessageParams = PartialPick<ParentToChildMessageNoGasParams, 'excessFeeRefundAddress' | 'callValueRefundAddress'>;
/**
 * Creates retryable tickets by directly calling the Inbox contract on Parent chain
 */
export declare class ParentToChildMessageCreator {
    readonly parentSigner: Signer;
    constructor(parentSigner: Signer);
    /**
     * Gets a current estimate for the supplied params
     * @param params
     * @param parentProvider
     * @param childProvider
     * @param retryableGasOverrides
     * @returns
     */
    protected static getTicketEstimate(params: ParentToChildMessageNoGasParams, parentProvider: Provider, childProvider: Provider, retryableGasOverrides?: GasOverrides): Promise<Pick<RetryableData, ParentToChildGasKeys>>;
    /**
     * Prepare calldata for a call to create a retryable ticket
     * @param params
     * @param estimates
     * @param excessFeeRefundAddress
     * @param callValueRefundAddress
     * @param nativeTokenIsEth
     * @returns
     */
    protected static getTicketCreationRequestCallData(params: ParentToChildMessageParams, estimates: Pick<RetryableData, ParentToChildGasKeys>, excessFeeRefundAddress: string, callValueRefundAddress: string, nativeTokenIsEth: boolean): string;
    /**
     * Generate a transaction request for creating a retryable ticket
     * @param params
     * @param parentProvider
     * @param childProvider
     * @param options
     * @returns
     */
    static getTicketCreationRequest(params: ParentToChildMessageParams, parentProvider: Provider, childProvider: Provider, options?: GasOverrides): Promise<ParentToChildTransactionRequest>;
    /**
     * Creates a retryable ticket by directly calling the Inbox contract on Parent chain
     */
    createRetryableTicket(params: (ParentToChildMessageParams & {
        overrides?: PayableOverrides;
    }) | (ParentToChildTransactionRequest & {
        overrides?: PayableOverrides;
    }), childProvider: Provider, options?: GasOverrides): Promise<ParentContractTransaction>;
}
export {};
