import { Signer } from '@ethersproject/abstract-signer';
import { Provider, TransactionRequest } from '@ethersproject/abstract-provider';
import { PayableOverrides, Overrides } from '@ethersproject/contracts';
import { BigNumber } from 'ethers';
import { AssetBridger } from './assetBridger';
import { ParentEthDepositTransaction, ParentContractCallTransaction } from '../message/ParentTransaction';
import { ChildContractTransaction } from '../message/ChildTransaction';
import { GasOverrides } from '../message/ParentToChildMessageGasEstimator';
import { ParentToChildTransactionRequest, ChildToParentTransactionRequest } from '../dataEntities/transactionRequest';
import { OmitTyped } from '../utils/types';
export type ApproveGasTokenParams = {
    /**
     * Amount to approve. Defaults to max int.
     */
    amount?: BigNumber;
    /**
     * Transaction overrides
     */
    overrides?: PayableOverrides;
};
export type ApproveGasTokenTxRequest = {
    /**
     * Transaction request
     */
    txRequest: Required<Pick<TransactionRequest, 'to' | 'data' | 'value'>>;
    /**
     * Transaction overrides
     */
    overrides?: Overrides;
};
export type ApproveGasTokenParamsOrTxRequest = ApproveGasTokenParams | ApproveGasTokenTxRequest;
type WithParentSigner<T extends ApproveGasTokenParamsOrTxRequest> = T & {
    parentSigner: Signer;
};
export interface EthWithdrawParams {
    /**
     * The amount of ETH or tokens to be withdrawn
     */
    amount: BigNumber;
    /**
     * The parent network address to receive the value.
     */
    destinationAddress: string;
    /**
     * The address of the withdrawal sender
     */
    from: string;
    /**
     * Transaction overrides
     */
    overrides?: PayableOverrides;
}
export type EthDepositParams = {
    /**
     * Parent network provider or signer
     */
    parentSigner: Signer;
    /**
     * The amount of ETH or tokens to be deposited
     */
    amount: BigNumber;
    /**
     * Transaction overrides
     */
    overrides?: PayableOverrides;
};
export type EthDepositToParams = EthDepositParams & {
    /**
     * Child network provider
     */
    childProvider: Provider;
    /**
     * Child network address of the entity receiving the funds
     */
    destinationAddress: string;
    /**
     * Overrides for the retryable ticket parameters
     */
    retryableGasOverrides?: GasOverrides;
};
export type ParentToChildTxReqAndSigner = ParentToChildTransactionRequest & {
    parentSigner: Signer;
    overrides?: Overrides;
};
export type ChildToParentTxReqAndSigner = ChildToParentTransactionRequest & {
    childSigner: Signer;
    overrides?: Overrides;
};
type EthDepositRequestParams = OmitTyped<EthDepositParams, 'overrides' | 'parentSigner'> & {
    from: string;
};
type EthDepositToRequestParams = OmitTyped<EthDepositToParams, 'overrides' | 'parentSigner'> & {
    /**
     * Parent network provider
     */
    parentProvider: Provider;
    /**
     * Address that is depositing the ETH
     */
    from: string;
};
/**
 * Bridger for moving either ETH or custom gas tokens back and forth between parent and child networks
 */
export declare class EthBridger extends AssetBridger<EthDepositParams | EthDepositToParams | ParentToChildTxReqAndSigner, EthWithdrawParams | ChildToParentTxReqAndSigner> {
    /**
     * Instantiates a new EthBridger from a child network Provider
     * @param childProvider
     * @returns
     */
    static fromProvider(childProvider: Provider): Promise<EthBridger>;
    /**
     * Asserts that the provided argument is of type `ApproveGasTokenParams` and not `ApproveGasTokenTxRequest`.
     * @param params
     */
    private isApproveGasTokenParams;
    /**
     * Creates a transaction request for approving the custom gas token to be spent by the inbox on the parent network
     * @param params
     */
    getApproveGasTokenRequest(params?: ApproveGasTokenParams): Required<Pick<TransactionRequest, 'to' | 'data' | 'value'>>;
    /**
     * Approves the custom gas token to be spent by the Inbox on the parent network.
     * @param params
     */
    approveGasToken(params: WithParentSigner<ApproveGasTokenParamsOrTxRequest>): Promise<import("@ethersproject/abstract-provider").TransactionResponse>;
    /**
     * Gets transaction calldata for a tx request for depositing ETH or custom gas token
     * @param params
     * @returns
     */
    private getDepositRequestData;
    /**
     * Gets tx request for depositing ETH or custom gas token
     * @param params
     * @returns
     */
    getDepositRequest(params: EthDepositRequestParams): Promise<OmitTyped<ParentToChildTransactionRequest, 'retryableData'>>;
    /**
     * Deposit ETH from Parent onto Child network
     * @param params
     * @returns
     */
    deposit(params: EthDepositParams | ParentToChildTxReqAndSigner): Promise<ParentEthDepositTransaction>;
    /**
     * Get a transaction request for an ETH deposit to a different child network address using Retryables
     * @param params
     * @returns
     */
    getDepositToRequest(params: EthDepositToRequestParams): Promise<ParentToChildTransactionRequest>;
    /**
     * Deposit ETH from parent network onto a different child network address
     * @param params
     * @returns
     */
    depositTo(params: EthDepositToParams | (ParentToChildTxReqAndSigner & {
        childProvider: Provider;
    })): Promise<ParentContractCallTransaction>;
    /**
     * Get a transaction request for an eth withdrawal
     * @param params
     * @returns
     */
    getWithdrawalRequest(params: EthWithdrawParams): Promise<ChildToParentTransactionRequest>;
    /**
     * Withdraw ETH from child network onto parent network
     * @param params
     * @returns
     */
    withdraw(params: (EthWithdrawParams & {
        childSigner: Signer;
    }) | ChildToParentTxReqAndSigner): Promise<ChildContractTransaction>;
}
export {};
