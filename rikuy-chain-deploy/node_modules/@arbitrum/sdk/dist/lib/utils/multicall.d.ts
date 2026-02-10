import { Provider } from '@ethersproject/abstract-provider';
import { BigNumber } from 'ethers';
import { Multicall2 } from '../abi/Multicall2';
/**
 * Input to multicall aggregator
 */
export type CallInput<T> = {
    /**
     * Address of the target contract to be called
     */
    targetAddr: string;
    /**
     * Function to produce encoded call data
     */
    encoder: () => string;
    /**
     * Function to decode the result of the call
     */
    decoder: (returnData: string) => T;
};
/**
 * For each item in T this DecoderReturnType<T> yields the return
 * type of the decoder property.
 * If we require success then the result cannot be undefined
 */
type DecoderReturnType<T extends CallInput<unknown>[], TRequireSuccess extends boolean> = {
    [P in keyof T]: T[P] extends CallInput<unknown> ? TRequireSuccess extends true ? ReturnType<T[P]['decoder']> : ReturnType<T[P]['decoder']> | undefined : never;
};
type AllowanceInputOutput<T> = T extends {
    allowance: {
        owner: string;
        spender: string;
    };
} ? {
    allowance: BigNumber | undefined;
} : Record<string, never>;
type BalanceInputOutput<T> = T extends {
    balanceOf: {
        account: string;
    };
} ? {
    balance: BigNumber | undefined;
} : Record<string, never>;
type DecimalsInputOutput<T> = T extends {
    decimals: true;
} ? {
    decimals: number | undefined;
} : Record<string, never>;
type NameInputOutput<T> = T extends {
    name: true;
} ? {
    name: string | undefined;
} : Record<string, never>;
type SymbolInputOutput<T> = T extends {
    symbol: true;
} ? {
    symbol: string | undefined;
} : Record<string, never>;
type TokenMultiInput = {
    balanceOf?: {
        account: string;
    };
    allowance?: {
        owner: string;
        spender: string;
    };
    symbol?: true;
    decimals?: true;
    name?: true;
};
type TokenInputOutput<T> = T extends TokenMultiInput ? AllowanceInputOutput<T> & BalanceInputOutput<T> & DecimalsInputOutput<T> & NameInputOutput<T> & SymbolInputOutput<T> : {
    name: string;
};
/**
 * Util for executing multi calls against the MultiCallV2 contract
 */
export declare class MultiCaller {
    private readonly provider;
    /**
     * Address of multicall contract
     */
    readonly address: string;
    constructor(provider: Provider, 
    /**
     * Address of multicall contract
     */
    address: string);
    /**
     * Finds the correct multicall address for the given provider and instantiates a multicaller
     * @param provider
     * @returns
     */
    static fromProvider(provider: Provider): Promise<MultiCaller>;
    /**
     * Get the call input for the current block number
     * @returns
     */
    getBlockNumberInput(): CallInput<Awaited<ReturnType<Multicall2['getBlockNumber']>>>;
    /**
     * Get the call input for the current block timestamp
     * @returns
     */
    getCurrentBlockTimestampInput(): CallInput<Awaited<ReturnType<Multicall2['getCurrentBlockTimestamp']>>>;
    /**
     * Executes a multicall for the given parameters
     * Return values are order the same as the inputs.
     * If a call failed undefined is returned instead of the value.
     *
     * To get better type inference when the individual calls are of different types
     * create your inputs as a tuple and pass the tuple in. The return type will be
     * a tuple of the decoded return types. eg.
     *
     *
     * ```typescript
     *   const inputs: [
     *     CallInput<Awaited<ReturnType<ERC20['functions']['balanceOf']>>[0]>,
     *     CallInput<Awaited<ReturnType<ERC20['functions']['name']>>[0]>
     *   ] = [
     *     {
     *       targetAddr: token.address,
     *       encoder: () => token.interface.encodeFunctionData('balanceOf', ['']),
     *       decoder: (returnData: string) =>
     *         token.interface.decodeFunctionResult('balanceOf', returnData)[0],
     *     },
     *     {
     *       targetAddr: token.address,
     *       encoder: () => token.interface.encodeFunctionData('name'),
     *       decoder: (returnData: string) =>
     *         token.interface.decodeFunctionResult('name', returnData)[0],
     *     },
     *   ]
     *
     *   const res = await multiCaller.call(inputs)
     * ```
     * @param provider
     * @param params
     * @param requireSuccess Fail the whole call if any internal call fails
     * @returns
     */
    multiCall<T extends CallInput<unknown>[], TRequireSuccess extends boolean>(params: T, requireSuccess?: TRequireSuccess): Promise<DecoderReturnType<T, TRequireSuccess>>;
    /**
     * Multicall for token properties. Will collect all the requested properies for each of the
     * supplied token addresses.
     * @param erc20Addresses
     * @param options Defaults to just 'name'
     * @returns
     */
    getTokenData<T extends TokenMultiInput | undefined>(erc20Addresses: string[], options?: T): Promise<TokenInputOutput<T>[]>;
}
export {};
