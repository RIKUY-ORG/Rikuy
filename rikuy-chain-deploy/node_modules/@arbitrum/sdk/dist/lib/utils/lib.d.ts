import { BigNumber } from 'ethers';
import { Provider } from '@ethersproject/abstract-provider';
import { TransactionReceipt, JsonRpcProvider } from '@ethersproject/providers';
import { ArbitrumNetwork } from '../dataEntities/networks';
export declare const wait: (ms: number) => Promise<void>;
export declare const getBaseFee: (provider: Provider) => Promise<BigNumber>;
/**
 * Waits for a transaction receipt if confirmations or timeout is provided
 * Otherwise tries to fetch straight away.
 * @param provider
 * @param txHash
 * @param confirmations
 * @param timeout
 * @returns
 */
export declare const getTransactionReceipt: (provider: Provider, txHash: string, confirmations?: number, timeout?: number) => Promise<TransactionReceipt | null>;
export declare const isDefined: <T>(val: T | null | undefined) => val is T;
export declare const isArbitrumChain: (provider: Provider) => Promise<boolean>;
type GetFirstBlockForL1BlockProps = {
    arbitrumProvider: JsonRpcProvider;
    forL1Block: number;
    allowGreater?: boolean;
    minArbitrumBlock?: number;
    maxArbitrumBlock?: number | 'latest';
};
/**
 * This function performs a binary search to find the first Arbitrum block that corresponds to a given L1 block number.
 * The function returns a Promise that resolves to a number if a block is found, or undefined otherwise.
 *
 * @param {JsonRpcProvider} arbitrumProvider - The Arbitrum provider to use for the search.
 * @param {number} forL1Block - The L1 block number to search for.
 * @param {boolean} [allowGreater=false] - Whether to allow the search to go past the specified `forL1Block`.
 * @param {number|string} minArbitrumBlock - The minimum Arbitrum block number to start the search from. Cannot be below the network's Nitro genesis block.
 * @param {number|string} [maxArbitrumBlock='latest'] - The maximum Arbitrum block number to end the search at. Can be a `number` or `'latest'`. `'latest'` is the current block.
 * @returns {Promise<number | undefined>} - A Promise that resolves to a number if a block is found, or undefined otherwise.
 */
export declare function getFirstBlockForL1Block({ arbitrumProvider, forL1Block, allowGreater, minArbitrumBlock, maxArbitrumBlock, }: GetFirstBlockForL1BlockProps): Promise<number | undefined>;
export declare const getBlockRangesForL1Block: (props: GetFirstBlockForL1BlockProps) => Promise<number[] | undefined[]>;
export declare function getNativeTokenDecimals({ parentProvider, childNetwork, }: {
    parentProvider: Provider;
    childNetwork: ArbitrumNetwork;
}): Promise<number>;
export declare function scaleFrom18DecimalsToNativeTokenDecimals({ amount, decimals, }: {
    amount: BigNumber;
    decimals: number;
}): BigNumber;
export declare function scaleFromNativeTokenDecimalsTo18Decimals({ amount, decimals, }: {
    amount: BigNumber;
    decimals: number;
}): BigNumber;
export {};
