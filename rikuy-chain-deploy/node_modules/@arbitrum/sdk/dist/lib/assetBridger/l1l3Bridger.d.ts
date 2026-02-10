import { Provider, TransactionRequest } from '@ethersproject/abstract-provider';
import { BigNumber, BigNumberish, Overrides, PayableOverrides, Signer, ethers } from 'ethers';
import { IERC20 } from '../abi/IERC20';
import { L2GatewayToken } from '../abi/L2GatewayToken';
import { IL1Teleporter } from '../abi/IL1Teleporter';
import { ArbitrumNetwork, Teleporter } from '../dataEntities/networks';
import { SignerOrProvider } from '../dataEntities/signerOrProvider';
import { ParentToChildTransactionRequest } from '../dataEntities/transactionRequest';
import { ParentToChildMessageReader } from '../message/ParentToChildMessage';
import { GasOverrides, PercentIncrease } from '../message/ParentToChildMessageGasEstimator';
import { ParentContractCallTransaction, ParentContractCallTransactionReceipt } from '../message/ParentTransaction';
import { Erc20Bridger } from './erc20Bridger';
import { OmitTyped } from '../utils/types';
import { IL2Forwarder } from '../abi/IL2Forwarder';
import { RetryableMessageParams } from '../dataEntities/message';
type PickedTransactionRequest = Required<Pick<TransactionRequest, 'to' | 'data' | 'value'>>;
export declare enum TeleportationType {
    /**
     * Teleporting to an ETH fee L3
     */
    Standard = 0,
    /**
     * Teleporting the fee token to a custom fee L3
     */
    OnlyGasToken = 1,
    /**
     * Teleporting a non-fee token to a custom fee L3
     */
    NonGasTokenToCustomGas = 2
}
export type TxRequestParams = {
    txRequest: PickedTransactionRequest;
    l1Signer: Signer;
    overrides?: PayableOverrides;
};
type RetryableGasValues = {
    gasLimit: BigNumber;
    maxSubmissionFee: BigNumber;
};
export type DepositRequestResult = {
    txRequest: PickedTransactionRequest;
    gasTokenAmount: BigNumber;
};
export type TeleporterRetryableGasOverride = {
    gasLimit?: PercentIncrease & {
        /**
         * Set a minimum max gas
         */
        min?: BigNumber;
    };
    maxSubmissionFee?: PercentIncrease;
};
export type TokenApproveParams = {
    /**
     * L1 address of the ERC20 token contract
     */
    erc20L1Address: string;
    /**
     * Amount to approve. Defaults to max int.
     */
    amount?: BigNumber;
};
export type Erc20L1L3DepositRequestRetryableOverrides = {
    /**
     * Optional L1 gas price override. Used to estimate submission fees.
     */
    l1GasPrice?: PercentIncrease;
    /**
     * Optional L2 gas price override
     */
    l2GasPrice?: PercentIncrease;
    /**
     * Optional L3 gas price override
     */
    l3GasPrice?: PercentIncrease;
    /**
     * L2ForwarderFactory retryable gas override
     */
    l2ForwarderFactoryRetryableGas?: TeleporterRetryableGasOverride;
    /**
     * L1 to L2 fee token bridge retryable gas override
     */
    l1l2GasTokenBridgeRetryableGas?: TeleporterRetryableGasOverride;
    /**
     * L1 to L2 token bridge retryable gas override
     */
    l1l2TokenBridgeRetryableGas?: TeleporterRetryableGasOverride;
    /**
     * L2 to L3 token bridge retryable gas override
     */
    l2l3TokenBridgeRetryableGas?: TeleporterRetryableGasOverride;
};
export type Erc20L1L3DepositRequestParams = {
    /**
     * Address of L1 token
     */
    erc20L1Address: string;
    /**
     * Amount of L1 token to send to L3
     */
    amount: BigNumber;
    /**
     * L2 provider
     */
    l2Provider: Provider;
    /**
     * L3 provider
     */
    l3Provider: Provider;
    /**
     * If the L3 uses a custom fee token, skip payment for L2 to L3 retryable even if the fee token is available on L1
     *
     * If payment is skipped, the teleportation will not be completed until the L2 to L3 retryable is manually redeemed
     *
     * Defaults to false
     */
    skipGasToken?: boolean;
    /**
     * Optional recipient on L3, defaults to signer's address
     */
    destinationAddress?: string;
    /**
     * Optional overrides for retryable gas parameters
     */
    retryableOverrides?: Erc20L1L3DepositRequestRetryableOverrides;
};
export type TxReference = {
    txHash: string;
} | {
    tx: ParentContractCallTransaction;
} | {
    txReceipt: ParentContractCallTransactionReceipt;
};
export type GetL1L3DepositStatusParams = {
    l1Provider: Provider;
    l2Provider: Provider;
    l3Provider: Provider;
} & TxReference;
export type Erc20L1L3DepositStatus = {
    /**
     * L1 to L2 token bridge message
     */
    l1l2TokenBridgeRetryable: ParentToChildMessageReader;
    /**
     * L1 to L2 fee token bridge message
     */
    l1l2GasTokenBridgeRetryable: ParentToChildMessageReader | undefined;
    /**
     * L2ForwarderFactory message
     */
    l2ForwarderFactoryRetryable: ParentToChildMessageReader;
    /**
     * L2 to L3 token bridge message
     */
    l2l3TokenBridgeRetryable: ParentToChildMessageReader | undefined;
    /**
     * Indicates that the L2ForwarderFactory call was front ran by another teleportation.
     *
     * This is true if:
     * - l1l2TokenBridgeRetryable status is REDEEMED; AND
     * - l2ForwarderFactoryRetryable status is FUNDS_DEPOSITED_ON_CHILD; AND
     * - L2Forwarder token balance is 0
     *
     * The first teleportation with l2ForwarderFactoryRetryable redemption *after* this teleportation's l1l2TokenBridgeRetryable redemption
     * is the one that completes this teleportation.
     *
     * If that subsequent teleportation is complete, this one is considered complete as well.
     */
    l2ForwarderFactoryRetryableFrontRan: boolean;
    /**
     * Whether the teleportation has completed.
     */
    completed: boolean;
};
export type EthL1L3DepositRequestParams = {
    /**
     * Amount of ETH to send to L3
     */
    amount: BigNumberish;
    /**
     * L2 provider
     */
    l2Provider: Provider;
    /**
     * L3 provider
     */
    l3Provider: Provider;
    /**
     * Optional recipient on L3, defaults to signer's address
     */
    destinationAddress?: string;
    /**
     * Optional fee refund address on L2, defaults to signer's address
     */
    l2RefundAddress?: string;
    /**
     * Optional gas overrides for L1 to L2 message
     */
    l2TicketGasOverrides?: Omit<GasOverrides, 'deposit'>;
    /**
     * Optional gas overrides for L2 to L3 message
     */
    l3TicketGasOverrides?: Omit<GasOverrides, 'deposit'>;
};
export type EthL1L3DepositStatus = {
    /**
     * L1 to L2 message
     */
    l2Retryable: ParentToChildMessageReader;
    /**
     * L2 to L3 message
     */
    l3Retryable: ParentToChildMessageReader | undefined;
    /**
     * Whether the teleportation has completed
     */
    completed: boolean;
};
/**
 * Base functionality for L1 to L3 bridging.
 */
declare class BaseL1L3Bridger {
    readonly l1Network: {
        chainId: number;
    };
    readonly l2Network: ArbitrumNetwork;
    readonly l3Network: ArbitrumNetwork;
    readonly defaultGasPricePercentIncrease: BigNumber;
    readonly defaultGasLimitPercentIncrease: BigNumber;
    constructor(l3Network: ArbitrumNetwork);
    /**
     * Check the signer/provider matches the l1Network, throws if not
     * @param sop
     */
    protected _checkL1Network(sop: SignerOrProvider): Promise<void>;
    /**
     * Check the signer/provider matches the l2Network, throws if not
     * @param sop
     */
    protected _checkL2Network(sop: SignerOrProvider): Promise<void>;
    /**
     * Check the signer/provider matches the l3Network, throws if not
     * @param sop
     */
    protected _checkL3Network(sop: SignerOrProvider): Promise<void>;
    protected _percentIncrease(num: BigNumber, increase: BigNumber): BigNumber;
    protected _getTxHashFromTxRef(txRef: TxReference): string;
    protected _getTxFromTxRef(txRef: TxReference, provider: Provider): Promise<ParentContractCallTransaction>;
    protected _getTxReceiptFromTxRef(txRef: TxReference, provider: Provider): Promise<ParentContractCallTransactionReceipt>;
}
/**
 * Bridger for moving ERC20 tokens from L1 to L3
 */
export declare class Erc20L1L3Bridger extends BaseL1L3Bridger {
    /**
     * Addresses of teleporter contracts on L2
     */
    readonly teleporter: Teleporter;
    /**
     * Default gas limit for L2ForwarderFactory.callForwarder of 1,000,000
     *
     * Measured Standard: 361746
     *
     * Measured OnlyGasToken: 220416
     *
     * Measured NonGasTokenToCustomGas: 373449
     */
    readonly l2ForwarderFactoryDefaultGasLimit: BigNumber;
    readonly skipL1GasTokenMagic: string;
    /**
     * If the L3 network uses a custom (non-eth) fee token, this is the address of that token on L2
     */
    readonly l2GasTokenAddress: string | undefined;
    protected readonly l2Erc20Bridger: Erc20Bridger;
    protected readonly l3Erc20Bridger: Erc20Bridger;
    /**
     * If the L3 network uses a custom fee token, this is the address of that token on L1
     */
    protected _l1FeeTokenAddress: string | undefined;
    constructor(l3Network: ArbitrumNetwork);
    /**
     * If the L3 network uses a custom gas token, return the address of that token on L1.
     * If the fee token is not available on L1, does not use 18 decimals on L1 and L2, or the L3 network uses ETH for fees, throw.
     */
    getGasTokenOnL1(l1Provider: Provider, l2Provider: Provider): Promise<string>;
    /**
     * Get the corresponding L2 token address for the provided L1 token
     */
    getL2Erc20Address(erc20L1Address: string, l1Provider: Provider): Promise<string>;
    /**
     * Get the corresponding L3 token address for the provided L1 token
     */
    getL3Erc20Address(erc20L1Address: string, l1Provider: Provider, l2Provider: Provider): Promise<string>;
    /**
     * Given an L1 token's address, get the address of the token's L1 <-> L2 gateway on L1
     */
    getL1L2GatewayAddress(erc20L1Address: string, l1Provider: Provider): Promise<string>;
    /**
     * Get the address of the L2 <-> L3 gateway on L2 given an L1 token address
     */
    getL2L3GatewayAddress(erc20L1Address: string, l1Provider: Provider, l2Provider: Provider): Promise<string>;
    /**
     * Get the L1 token contract at the provided address
     * Note: This function just returns a typed ethers object for the provided address, it doesn't
     * check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity
     * of any of the underlying functions on that contract.
     */
    getL1TokenContract(l1TokenAddr: string, l1Provider: Provider): IERC20;
    /**
     * Get the L2 token contract at the provided address
     * Note: This function just returns a typed ethers object for the provided address, it doesn't
     * check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity
     * of any of the underlying functions on that contract.
     */
    getL2TokenContract(l2TokenAddr: string, l2Provider: Provider): L2GatewayToken;
    /**
     * Get the L3 token contract at the provided address
     * Note: This function just returns a typed ethers object for the provided address, it doesn't
     * check the underlying form of the contract bytecode to see if it's an erc20, and doesn't ensure the validity
     * of any of the underlying functions on that contract.
     */
    getL3TokenContract(l3TokenAddr: string, l3Provider: Provider): L2GatewayToken;
    /**
     * Whether the L1 token has been disabled on the L1 <-> L2 router given an L1 token address
     */
    l1TokenIsDisabled(l1TokenAddress: string, l1Provider: Provider): Promise<boolean>;
    /**
     * Whether the L2 token has been disabled on the L2 <-> L3 router given an L2 token address
     */
    l2TokenIsDisabled(l2TokenAddress: string, l2Provider: Provider): Promise<boolean>;
    /**
     * Given some L2Forwarder parameters, get the address of the L2Forwarder contract
     */
    l2ForwarderAddress(owner: string, routerOrInbox: string, destinationAddress: string, l1OrL2Provider: Provider): Promise<string>;
    /**
     * Get a tx request to approve tokens for teleportation.
     * The tokens will be approved for L1Teleporter.
     */
    getApproveTokenRequest(params: TokenApproveParams): Promise<PickedTransactionRequest>;
    /**
     * Approve tokens for teleportation.
     * The tokens will be approved for L1Teleporter.
     */
    approveToken(params: (TokenApproveParams & {
        l1Signer: Signer;
        overrides?: Overrides;
    }) | TxRequestParams): Promise<ethers.ContractTransaction>;
    /**
     * Get a tx request to approve the L3's fee token for teleportation.
     * The tokens will be approved for L1Teleporter.
     * Will throw if the L3 network uses ETH for fees or the fee token doesn't exist on L1.
     */
    getApproveGasTokenRequest(params: {
        l1Provider: Provider;
        l2Provider: Provider;
        amount?: BigNumber;
    }): Promise<PickedTransactionRequest>;
    /**
     * Approve the L3's fee token for teleportation.
     * The tokens will be approved for L1Teleporter.
     * Will throw if the L3 network uses ETH for fees or the fee token doesn't exist on L1.
     */
    approveGasToken(params: {
        l1Signer: Signer;
        l2Provider: Provider;
        amount?: BigNumber;
        overrides?: Overrides;
    } | TxRequestParams): Promise<ethers.ContractTransaction>;
    /**
     * Get a tx request for teleporting some tokens from L1 to L3.
     * Also returns the amount of fee tokens required for teleportation.
     */
    getDepositRequest(params: Erc20L1L3DepositRequestParams & ({
        from: string;
        l1Provider: Provider;
    } | {
        l1Signer: Signer;
    })): Promise<DepositRequestResult>;
    /**
     * Execute a teleportation of some tokens from L1 to L3.
     */
    deposit(params: (Erc20L1L3DepositRequestParams & {
        l1Signer: Signer;
        overrides?: PayableOverrides;
    }) | TxRequestParams): Promise<ParentContractCallTransaction>;
    /**
     * Given a teleportation tx, get the L1Teleporter parameters, L2Forwarder parameters, and L2Forwarder address
     */
    getDepositParameters(params: {
        l1Provider: Provider;
        l2Provider: Provider;
    } & TxReference): Promise<{
        teleportParams: IL1Teleporter.TeleportParamsStruct;
        l2ForwarderParams: IL2Forwarder.L2ForwarderParamsStruct;
        l2ForwarderAddress: Promise<string>;
    }>;
    /**
     * Fetch the cross chain messages and their status
     *
     * Can provide either the txHash, the tx, or the txReceipt
     */
    getDepositStatus(params: GetL1L3DepositStatusParams): Promise<Erc20L1L3DepositStatus>;
    /**
     * Get the type of teleportation from the l1Token and l3FeeTokenL1Addr teleport parameters
     */
    teleportationType(partialTeleportParams: Pick<IL1Teleporter.TeleportParamsStruct, 'l3FeeTokenL1Addr' | 'l1Token'>): TeleportationType;
    /**
     * Estimate the gasLimit and maxSubmissionFee for a token bridge retryable
     */
    protected _getTokenBridgeGasEstimates(params: {
        parentProvider: Provider;
        childProvider: Provider;
        parentGasPrice: BigNumber;
        parentErc20Address: string;
        parentGatewayAddress: string;
        from: string;
        to: string;
        amount: BigNumber;
        isWeth: boolean;
    }): Promise<RetryableGasValues>;
    /**
     * Estimate the gasLimit and maxSubmissionFee for the L1 to L2 token bridge leg of a teleportation
     */
    protected _getL1L2TokenBridgeGasEstimates(params: {
        l1Token: string;
        amount: BigNumberish;
        l1GasPrice: BigNumber;
        l2ForwarderAddress: string;
        l1Provider: Provider;
        l2Provider: Provider;
    }): Promise<RetryableGasValues>;
    /**
     * Estimate the gasLimit and maxSubmissionFee for the L1 to L2 fee token bridge leg of a teleportation
     */
    protected _getL1L2FeeTokenBridgeGasEstimates(params: {
        l1GasPrice: BigNumber;
        feeTokenAmount: BigNumber;
        l3FeeTokenL1Addr: string;
        l2ForwarderAddress: string;
        l1Provider: Provider;
        l2Provider: Provider;
    }): Promise<RetryableGasValues>;
    /**
     * Estimate the gasLimit and maxSubmissionFee for L2ForwarderFactory.callForwarder leg of a teleportation.
     * Gas limit is hardcoded to 1,000,000
     */
    protected _getL2ForwarderFactoryGasEstimates(l1GasPrice: BigNumber, l1Provider: Provider): Promise<RetryableGasValues>;
    /**
     * Estimate the gasLimit and maxSubmissionFee for the L2 -> L3 leg of a teleportation.
     */
    protected _getL2L3BridgeGasEstimates(params: {
        partialTeleportParams: OmitTyped<IL1Teleporter.TeleportParamsStruct, 'gasParams'>;
        l2GasPrice: BigNumber;
        l1Provider: Provider;
        l2Provider: Provider;
        l3Provider: Provider;
        l2ForwarderAddress: string;
    }): Promise<RetryableGasValues>;
    /**
     * Given TeleportParams without the gas parameters, return TeleportParams with gas parameters populated.
     * Does not modify the input parameters.
     */
    protected _fillPartialTeleportParams(partialTeleportParams: OmitTyped<IL1Teleporter.TeleportParamsStruct, 'gasParams'>, retryableOverrides: Erc20L1L3DepositRequestRetryableOverrides, l1Provider: Provider, l2Provider: Provider, l3Provider: Provider): Promise<{
        teleportParams: {
            gasParams: IL1Teleporter.RetryableGasParamsStruct;
            to: string;
            amount: BigNumberish;
            l1Token: string;
            l3FeeTokenL1Addr: string;
            l1l2Router: string;
            l2l3RouterOrInbox: string;
        };
        costs: [BigNumber, BigNumber, number, IL1Teleporter.RetryableGasCostsStructOutput] & {
            ethAmount: BigNumber;
            feeTokenAmount: BigNumber;
            teleportationType: number;
            costs: IL1Teleporter.RetryableGasCostsStructOutput;
        };
    }>;
    /**
     * @returns The size of the calldata for a call to L2ForwarderFactory.callForwarder
     */
    protected _l2ForwarderFactoryCalldataSize(): number;
    /**
     * Given raw calldata for a teleport tx, decode the teleport parameters
     */
    protected _decodeTeleportCalldata(data: string): IL1Teleporter.TeleportParamsStruct;
    /**
     * Given raw calldata for a callForwarder call, decode the parameters
     */
    protected _decodeCallForwarderCalldata(data: string): IL2Forwarder.L2ForwarderParamsStruct;
    protected _getL1ToL2Messages(l1TxReceipt: ParentContractCallTransactionReceipt, l2Provider: Provider): Promise<{
        l1l2TokenBridgeRetryable: ParentToChildMessageReader;
        l1l2GasTokenBridgeRetryable: ParentToChildMessageReader | undefined;
        l2ForwarderFactoryRetryable: ParentToChildMessageReader;
    }>;
}
/**
 * Bridge ETH from L1 to L3 using a double retryable ticket
 */
export declare class EthL1L3Bridger extends BaseL1L3Bridger {
    constructor(l3Network: ArbitrumNetwork);
    /**
     * Get a tx request to deposit ETH to L3 via a double retryable ticket
     */
    getDepositRequest(params: EthL1L3DepositRequestParams & ({
        from: string;
        l1Provider: Provider;
    } | {
        l1Signer: Signer;
    })): Promise<ParentToChildTransactionRequest>;
    /**
     * Deposit ETH to L3 via a double retryable ticket
     */
    deposit(params: (EthL1L3DepositRequestParams & {
        l1Signer: Signer;
        overrides?: PayableOverrides;
    }) | TxRequestParams): Promise<ParentContractCallTransaction>;
    /**
     * Given an L1 transaction, get the retryable parameters for both l2 and l3 tickets
     */
    getDepositParameters(params: {
        l1Provider: Provider;
    } & TxReference): Promise<{
        l1l2TicketData: RetryableMessageParams;
        l2l3TicketData: RetryableMessageParams;
    }>;
    /**
     * Get the status of a deposit given an L1 tx receipt. Does not check if the tx is actually a deposit tx.
     *
     * @return Information regarding each step of the deposit
     * and `EthL1L3DepositStatus.completed` which indicates whether the deposit has fully completed.
     */
    getDepositStatus(params: GetL1L3DepositStatusParams): Promise<EthL1L3DepositStatus>;
    protected _decodeCreateRetryableTicket(data: string): OmitTyped<RetryableMessageParams, 'l1Value'>;
}
export {};
