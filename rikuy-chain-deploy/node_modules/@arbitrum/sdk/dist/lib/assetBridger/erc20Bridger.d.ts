import { Signer } from '@ethersproject/abstract-signer';
import { Provider, BlockTag, TransactionRequest } from '@ethersproject/abstract-provider';
import { PayableOverrides, Overrides } from '@ethersproject/contracts';
import { BigNumber, ethers } from 'ethers';
import { ERC20 } from '../abi/ERC20';
import { L2GatewayToken } from '../abi/L2GatewayToken';
import { WithdrawalInitiatedEvent } from '../abi/L2ArbitrumGateway';
import { GatewaySetEvent } from '../abi/L1GatewayRouter';
import { GasOverrides } from '../message/ParentToChildMessageGasEstimator';
import { ArbitrumNetwork, TokenBridge } from '../dataEntities/networks';
import { EthDepositParams, EthWithdrawParams } from './ethBridger';
import { AssetBridger } from './assetBridger';
import { ParentContractCallTransaction, ParentContractTransaction } from '../message/ParentTransaction';
import { ChildContractTransaction } from '../message/ChildTransaction';
import { ChildToParentTransactionRequest, ParentToChildTransactionRequest } from '../dataEntities/transactionRequest';
import { OmitTyped } from '../utils/types';
import { EventArgs } from '../dataEntities/event';
export interface TokenApproveParams {
    /**
     * Parent network address of the ERC20 token contract
     */
    erc20ParentAddress: string;
    /**
     * Amount to approve. Defaults to max int.
     */
    amount?: BigNumber;
    /**
     * Transaction overrides
     */
    overrides?: PayableOverrides;
}
export interface Erc20DepositParams extends EthDepositParams {
    /**
     * A child provider
     */
    childProvider: Provider;
    /**
     * Parent network address of the token ERC20 contract
     */
    erc20ParentAddress: string;
    /**
     * Child network address of the entity receiving the funds. Defaults to the l1FromAddress
     */
    destinationAddress?: string;
    /**
     * The maximum cost to be paid for submitting the transaction
     */
    maxSubmissionCost?: BigNumber;
    /**
     * The address to return the any gas that was not spent on fees
     */
    excessFeeRefundAddress?: string;
    /**
     * The address to refund the call value to in the event the retryable is cancelled, or expires
     */
    callValueRefundAddress?: string;
    /**
     * Overrides for the retryable ticket parameters
     */
    retryableGasOverrides?: GasOverrides;
    /**
     * Transaction overrides
     */
    overrides?: Overrides;
}
export interface Erc20WithdrawParams extends EthWithdrawParams {
    /**
     * Parent network address of the token ERC20 contract
     */
    erc20ParentAddress: string;
}
export type ParentToChildTxReqAndSignerProvider = ParentToChildTransactionRequest & {
    parentSigner: Signer;
    childProvider: Provider;
    overrides?: Overrides;
};
export type ChildToParentTxReqAndSigner = ChildToParentTransactionRequest & {
    childSigner: Signer;
    overrides?: Overrides;
};
type SignerTokenApproveParams = TokenApproveParams & {
    parentSigner: Signer;
};
type ProviderTokenApproveParams = TokenApproveParams & {
    parentProvider: Provider;
};
export type ApproveParamsOrTxRequest = SignerTokenApproveParams | {
    txRequest: Required<Pick<TransactionRequest, 'to' | 'data' | 'value'>>;
    parentSigner: Signer;
    overrides?: Overrides;
};
/**
 * The deposit request takes the same args as the actual deposit. Except we don't require a signer object
 * only a provider
 */
type DepositRequest = OmitTyped<Erc20DepositParams, 'overrides' | 'parentSigner'> & {
    parentProvider: Provider;
    /**
     * Address that is depositing the assets
     */
    from: string;
};
/**
 * Bridger for moving ERC20 tokens back and forth between parent-to-child
 */
export declare class Erc20Bridger extends AssetBridger<Erc20DepositParams | ParentToChildTxReqAndSignerProvider, OmitTyped<Erc20WithdrawParams, 'from'> | ChildToParentTransactionRequest> {
    static MAX_APPROVAL: BigNumber;
    static MIN_CUSTOM_DEPOSIT_GAS_LIMIT: BigNumber;
    readonly childNetwork: ArbitrumNetwork & {
        tokenBridge: TokenBridge;
    };
    /**
     * Bridger for moving ERC20 tokens back and forth between parent-to-child
     */
    constructor(childNetwork: ArbitrumNetwork);
    /**
     * Instantiates a new Erc20Bridger from a child provider
     * @param childProvider
     * @returns
     */
    static fromProvider(childProvider: Provider): Promise<Erc20Bridger>;
    /**
     * Get the address of the parent gateway for this token
     * @param erc20ParentAddress
     * @param parentProvider
     * @returns
     */
    getParentGatewayAddress(erc20ParentAddress: string, parentProvider: Provider): Promise<string>;
    /**
     * Get the address of the child gateway for this token
     * @param erc20ParentAddress
     * @param childProvider
     * @returns
     */
    getChildGatewayAddress(erc20ParentAddress: string, childProvider: Provider): Promise<string>;
    /**
     * Creates a transaction request for approving the custom gas token to be spent by the relevant gateway on the parent network
     * @param params
     */
    getApproveGasTokenRequest(params: ProviderTokenApproveParams): Promise<Required<Pick<TransactionRequest, 'to' | 'data' | 'value'>>>;
    /**
     * Approves the custom gas token to be spent by the relevant gateway on the parent network
     * @param params
     */
    approveGasToken(params: ApproveParamsOrTxRequest): Promise<ethers.ContractTransaction>;
    /**
     * Get a tx request to approve tokens for deposit to the bridge.
     * The tokens will be approved for the relevant gateway.
     * @param params
     * @returns
     */
    getApproveTokenRequest(params: ProviderTokenApproveParams): Promise<Required<Pick<TransactionRequest, 'to' | 'data' | 'value'>>>;
    protected isApproveParams(params: ApproveParamsOrTxRequest): params is SignerTokenApproveParams;
    /**
     * Approve tokens for deposit to the bridge. The tokens will be approved for the relevant gateway.
     * @param params
     * @returns
     */
    approveToken(params: ApproveParamsOrTxRequest): Promise<ethers.ContractTransaction>;
    /**
     * Get the child network events created by a withdrawal
     * @param childProvider
     * @param gatewayAddress
     * @param parentTokenAddress
     * @param fromAddress
     * @param filter
     * @returns
     */
    getWithdrawalEvents(childProvider: Provider, gatewayAddress: string, filter: {
        fromBlock: BlockTag;
        toBlock: BlockTag;
    }, parentTokenAddress?: string, fromAddress?: string, toAddress?: string): Promise<(EventArgs<WithdrawalInitiatedEvent> & {
        txHash: string;
    })[]>;
    /**
     * Does the provided address look like a weth gateway
     * @param potentialWethGatewayAddress
     * @param parentProvider
     * @returns
     */
    private looksLikeWethGateway;
    /**
     * Is this a known or unknown WETH gateway
     * @param gatewayAddress
     * @param parentProvider
     * @returns
     */
    private isWethGateway;
    /**
     * Get the child network token contract at the provided address
     * Note: This function just returns a typed ethers object for the provided address, it doesn't
     * check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity
     * of any of the underlying functions on that contract.
     * @param childProvider
     * @param childTokenAddr
     * @returns
     */
    getChildTokenContract(childProvider: Provider, childTokenAddr: string): L2GatewayToken;
    /**
     * Get the parent token contract at the provided address
     * Note: This function just returns a typed ethers object for the provided address, it doesnt
     * check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity
     * of any of the underlying functions on that contract.
     * @param parentProvider
     * @param parentTokenAddr
     * @returns
     */
    getParentTokenContract(parentProvider: Provider, parentTokenAddr: string): ERC20;
    /**
     * Get the corresponding child network token address for the provided parent network token
     * @param erc20ParentAddress
     * @param parentProvider
     * @returns
     */
    getChildErc20Address(erc20ParentAddress: string, parentProvider: Provider): Promise<string>;
    /**
     * Get the corresponding parent network address for the provided child network token
     * Validates the returned address against the child network router to ensure it is correctly mapped to the provided erc20ChildChainAddress
     * @param erc20ChildChainAddress
     * @param childProvider
     * @returns
     */
    getParentErc20Address(erc20ChildChainAddress: string, childProvider: Provider): Promise<string>;
    /**
     * Whether the token has been disabled on the router
     * @param parentTokenAddress
     * @param parentProvider
     * @returns
     */
    isDepositDisabled(parentTokenAddress: string, parentProvider: Provider): Promise<boolean>;
    private applyDefaults;
    /**
     * Get the call value for the deposit transaction request
     * @param depositParams
     * @returns
     */
    private getDepositRequestCallValue;
    /**
     * Get the `data` param for call to `outboundTransfer`
     * @param depositParams
     * @returns
     */
    private getDepositRequestOutboundTransferInnerData;
    /**
     * Get the arguments for calling the deposit function
     * @param params
     * @returns
     */
    getDepositRequest(params: DepositRequest): Promise<ParentToChildTransactionRequest>;
    /**
     * Execute a token deposit from parent to child network
     * @param params
     * @returns
     */
    deposit(params: Erc20DepositParams | ParentToChildTxReqAndSignerProvider): Promise<ParentContractCallTransaction>;
    /**
     * Get the arguments for calling the token withdrawal function
     * @param params
     * @returns
     */
    getWithdrawalRequest(params: Erc20WithdrawParams): Promise<ChildToParentTransactionRequest>;
    /**
     * Withdraw tokens from child to parent network
     * @param params
     * @returns
     */
    withdraw(params: (OmitTyped<Erc20WithdrawParams, 'from'> & {
        childSigner: Signer;
    }) | ChildToParentTxReqAndSigner): Promise<ChildContractTransaction>;
    /**
     * Checks if the token has been properly registered on both gateways. Mostly useful for tokens that use a custom gateway.
     *
     * @param {Object} params
     * @param {string} params.erc20ParentAddress
     * @param {Provider} params.parentProvider
     * @param {Provider} params.childProvider
     * @returns
     */
    isRegistered({ erc20ParentAddress, parentProvider, childProvider, }: {
        erc20ParentAddress: string;
        parentProvider: Provider;
        childProvider: Provider;
    }): Promise<boolean>;
}
/**
 * A token and gateway pair
 */
interface TokenAndGateway {
    tokenAddr: string;
    gatewayAddr: string;
}
/**
 * Admin functionality for the token bridge
 */
export declare class AdminErc20Bridger extends Erc20Bridger {
    private percentIncrease;
    getApproveGasTokenForCustomTokenRegistrationRequest(params: ProviderTokenApproveParams): Required<Pick<TransactionRequest, 'to' | 'data' | 'value'>>;
    approveGasTokenForCustomTokenRegistration(params: ApproveParamsOrTxRequest): Promise<ethers.ContractTransaction>;
    /**
     * Register a custom token on the Arbitrum bridge
     * See https://developer.offchainlabs.com/docs/bridging_assets#the-arbitrum-generic-custom-gateway for more details
     * @param parentTokenAddress Address of the already deployed parent token. Must inherit from https://developer.offchainlabs.com/docs/sol_contract_docs/md_docs/arb-bridge-peripherals/tokenbridge/ethereum/icustomtoken.
     * @param childTokenAddress Address of the already deployed child token. Must inherit from https://developer.offchainlabs.com/docs/sol_contract_docs/md_docs/arb-bridge-peripherals/tokenbridge/arbitrum/iarbtoken.
     * @param parentSigner The signer with the rights to call `registerTokenOnL2` on the parent token
     * @param childProvider Arbitrum rpc provider
     * @returns
     */
    registerCustomToken(parentTokenAddress: string, childTokenAddress: string, parentSigner: Signer, childProvider: Provider): Promise<ParentContractTransaction>;
    /**
     * Get all the gateway set events on the Parent gateway router
     * @param parentProvider The provider for the parent network
     * @param filter An object containing fromBlock and toBlock to filter events
     * @returns An array of GatewaySetEvent event arguments
     */
    getParentGatewaySetEvents(parentProvider: Provider, filter: {
        fromBlock: BlockTag;
        toBlock: BlockTag;
    }): Promise<EventArgs<GatewaySetEvent>[]>;
    /**
     * Get all the gateway set events on the child gateway router
     * @param childProvider The provider for the child network
     * @param filter An object containing fromBlock and toBlock to filter events
     * @param customNetworkChildGatewayRouter Optional address of the custom network child gateway router
     * @returns An array of GatewaySetEvent event arguments
     * @throws {ArbSdkError} If the network is custom and customNetworkChildGatewayRouter is not provided
     */
    getChildGatewaySetEvents(childProvider: Provider, filter: {
        fromBlock: BlockTag;
        toBlock: BlockTag;
    }, customNetworkChildGatewayRouter?: string): Promise<EventArgs<GatewaySetEvent>[]>;
    /**
     * Register the provided token addresses against the provided gateways
     * @param parentSigner
     * @param childProvider
     * @param tokenGateways
     * @returns
     */
    setGateways(parentSigner: Signer, childProvider: Provider, tokenGateways: TokenAndGateway[], options?: GasOverrides): Promise<ParentContractCallTransaction>;
}
export {};
