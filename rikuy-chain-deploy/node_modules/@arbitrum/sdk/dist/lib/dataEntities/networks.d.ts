import { Provider } from '@ethersproject/abstract-provider';
import { SignerOrProvider } from './signerOrProvider';
import { Prettify } from '../utils/types';
/**
 * Represents an Arbitrum chain, e.g. Arbitrum One, Arbitrum Sepolia, or an L3 chain.
 */
export interface ArbitrumNetwork {
    /**
     * Name of the chain.
     */
    name: string;
    /**
     * Id of the chain.
     */
    chainId: number;
    /**
     * Chain id of the parent chain, i.e. the chain on which this chain settles to.
     */
    parentChainId: number;
    /**
     * The core contracts
     */
    ethBridge: EthBridge;
    /**
     * The token bridge contracts.
     */
    tokenBridge?: TokenBridge;
    /**
     * The teleporter contracts.
     */
    teleporter?: Teleporter;
    /**
     * The time allowed for validators to dispute or challenge state assertions. Measured in L1 blocks.
     */
    confirmPeriodBlocks: number;
    /**
     * Represents how long a retryable ticket lasts for before it expires (in seconds). Defaults to 7 days.
     */
    retryableLifetimeSeconds?: number;
    /**
     * In case of a chain that uses ETH as its native/gas token, this is either `undefined` or the zero address
     *
     * In case of a chain that uses an ERC-20 token from the parent chain as its native/gas token, this is the address of said token on the parent chain
     */
    nativeToken?: string;
    /**
     * Whether or not it is a testnet chain.
     */
    isTestnet: boolean;
    /**
     * Whether or not the chain was registered by the user.
     */
    isCustom: boolean;
    /**
     * Has the network been upgraded to bold. True if yes, otherwise undefined
     * This is a temporary property and will be removed in future if Bold is widely adopted and
     * the legacy challenge protocol is deprecated
     */
    isBold?: boolean;
}
/**
 * This type is only here for when you want to achieve backwards compatibility between SDK v3 and v4.
 *
 * Please see {@link ArbitrumNetwork} for the latest type.
 *
 * @deprecated since v4
 */
export type L2Network = Prettify<Omit<ArbitrumNetwork, 'chainId' | 'parentChainId' | 'tokenBridge'> & {
    chainID: number;
    partnerChainID: number;
    tokenBridge: L2NetworkTokenBridge;
}>;
export interface Teleporter {
    l1Teleporter: string;
    l2ForwarderFactory: string;
}
export interface TokenBridge {
    parentGatewayRouter: string;
    childGatewayRouter: string;
    parentErc20Gateway: string;
    childErc20Gateway: string;
    parentCustomGateway: string;
    childCustomGateway: string;
    parentWethGateway: string;
    childWethGateway: string;
    parentWeth: string;
    childWeth: string;
    parentProxyAdmin?: string;
    childProxyAdmin?: string;
    parentMultiCall: string;
    childMultiCall: string;
}
/**
 * This type is only here for when you want to achieve backwards compatibility between SDK v3 and v4.
 *
 * Please see {@link TokenBridge} for the latest type.
 *
 * @deprecated since v4
 */
export interface L2NetworkTokenBridge {
    l1GatewayRouter: string;
    l2GatewayRouter: string;
    l1ERC20Gateway: string;
    l2ERC20Gateway: string;
    l1CustomGateway: string;
    l2CustomGateway: string;
    l1WethGateway: string;
    l2WethGateway: string;
    l2Weth: string;
    l1Weth: string;
    l1ProxyAdmin: string;
    l2ProxyAdmin: string;
    l1MultiCall: string;
    l2Multicall: string;
}
export interface EthBridge {
    bridge: string;
    inbox: string;
    sequencerInbox: string;
    outbox: string;
    rollup: string;
    classicOutboxes?: {
        [addr: string]: number;
    };
}
/**
 * Determines if a chain is a parent of *any* other chain. Could be an L1 or an L2 chain.
 */
export declare const isParentNetwork: (parentChainOrChainId: ArbitrumNetwork | number) => boolean;
/**
 * Returns a list of children chains for the given chain or chain id.
 */
export declare const getChildrenForNetwork: (parentChainOrChainId: ArbitrumNetwork | number) => ArbitrumNetwork[];
/**
 * Returns the Arbitrum chain associated with the given signer, provider or chain id.
 *
 * @note Throws if the chain is not an Arbitrum chain.
 */
export declare function getArbitrumNetwork(chainId: number): ArbitrumNetwork;
export declare function getArbitrumNetwork(signerOrProvider: SignerOrProvider): Promise<ArbitrumNetwork>;
/**
 * Returns all Arbitrum networks registered in the SDK, both default and custom.
 */
export declare function getArbitrumNetworks(): ArbitrumNetwork[];
export type ArbitrumNetworkInformationFromRollup = Pick<ArbitrumNetwork, 'parentChainId' | 'confirmPeriodBlocks' | 'ethBridge' | 'nativeToken'>;
/**
 * Returns all the information about an Arbitrum network that can be fetched from its Rollup contract.
 *
 * @param rollupAddress Address of the Rollup contract on the parent chain
 * @param parentProvider Provider for the parent chain
 *
 * @returns An {@link ArbitrumNetworkInformationFromRollup} object
 */
export declare function getArbitrumNetworkInformationFromRollup(rollupAddress: string, parentProvider: Provider): Promise<ArbitrumNetworkInformationFromRollup>;
/**
 * Registers a custom Arbitrum network.
 *
 * @param network {@link ArbitrumNetwork} to be registered
 * @param options Additional options
 * @param options.throwIfAlreadyRegistered Whether or not the function should throw if the network is already registered, defaults to `false`
 */
export declare function registerCustomArbitrumNetwork(network: ArbitrumNetwork, options?: {
    throwIfAlreadyRegistered?: boolean;
}): ArbitrumNetwork;
export declare function getNitroGenesisBlock(arbitrumChainOrChainId: ArbitrumNetwork | number): 0 | 22207817;
export declare function getMulticallAddress(providerOrChainId: Provider | number): Promise<string>;
/**
 * Maps the old {@link L2Network.tokenBridge} (from SDK v3) to {@link ArbitrumNetwork.tokenBridge} (from SDK v4).
 */
export declare function mapL2NetworkTokenBridgeToTokenBridge(input: L2NetworkTokenBridge): TokenBridge;
/**
 * Maps the old {@link L2Network} (from SDK v3) to {@link ArbitrumNetwork} (from SDK v4).
 */
export declare function mapL2NetworkToArbitrumNetwork(l2Network: L2Network): ArbitrumNetwork;
/**
 * Asserts that the given object has a token bridge. This is useful because not all Arbitrum network
 * operations require a token bridge.
 *
 * @param network {@link ArbitrumNetwork} object
 * @throws ArbSdkError if the object does not have a token bridge
 */
export declare function assertArbitrumNetworkHasTokenBridge<T extends ArbitrumNetwork>(network: T): asserts network is T & {
    tokenBridge: TokenBridge;
};
export declare function isArbitrumNetworkNativeTokenEther(network: ArbitrumNetwork): boolean;
declare const resetNetworksToDefault: () => void;
export { resetNetworksToDefault };
