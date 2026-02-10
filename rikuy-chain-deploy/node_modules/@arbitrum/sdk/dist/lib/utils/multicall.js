/*
 * Copyright 2021, Offchain Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-env node */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiCaller = void 0;
const ethers_1 = require("ethers");
const ERC20__factory_1 = require("../abi/factories/ERC20__factory");
const Multicall2__factory_1 = require("../abi/factories/Multicall2__factory");
const networks_1 = require("../dataEntities/networks");
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
//\\\\\ TOKEN CONDITIONAL TYPES \\\\\\\
//\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
/**
 * Util for executing multi calls against the MultiCallV2 contract
 */
class MultiCaller {
    constructor(provider, 
    /**
     * Address of multicall contract
     */
    address) {
        this.provider = provider;
        this.address = address;
    }
    /**
     * Finds the correct multicall address for the given provider and instantiates a multicaller
     * @param provider
     * @returns
     */
    static async fromProvider(provider) {
        return new MultiCaller(provider, await (0, networks_1.getMulticallAddress)(provider));
    }
    /**
     * Get the call input for the current block number
     * @returns
     */
    getBlockNumberInput() {
        const iFace = Multicall2__factory_1.Multicall2__factory.createInterface();
        return {
            targetAddr: this.address,
            encoder: () => iFace.encodeFunctionData('getBlockNumber'),
            decoder: (returnData) => iFace.decodeFunctionResult('getBlockNumber', returnData)[0],
        };
    }
    /**
     * Get the call input for the current block timestamp
     * @returns
     */
    getCurrentBlockTimestampInput() {
        const iFace = Multicall2__factory_1.Multicall2__factory.createInterface();
        return {
            targetAddr: this.address,
            encoder: () => iFace.encodeFunctionData('getCurrentBlockTimestamp'),
            decoder: (returnData) => iFace.decodeFunctionResult('getCurrentBlockTimestamp', returnData)[0],
        };
    }
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
    async multiCall(params, requireSuccess) {
        const defaultedRequireSuccess = requireSuccess || false;
        const multiCall = Multicall2__factory_1.Multicall2__factory.connect(this.address, this.provider);
        const args = params.map(p => ({
            target: p.targetAddr,
            callData: p.encoder(),
        }));
        const outputs = await multiCall.callStatic.tryAggregate(defaultedRequireSuccess, args);
        return outputs.map(({ success, returnData }, index) => {
            if (success && returnData && returnData != '0x') {
                return params[index].decoder(returnData);
            }
            return undefined;
        });
    }
    async getTokenData(erc20Addresses, options) {
        // if no options are supplied, then we just multicall for the names
        const defaultedOptions = options || { name: true };
        const erc20Iface = ERC20__factory_1.ERC20__factory.createInterface();
        const isBytes32 = (data) => ethers_1.utils.isHexString(data) && ethers_1.utils.hexDataLength(data) === 32;
        const input = [];
        for (const t of erc20Addresses) {
            if (defaultedOptions.allowance) {
                input.push({
                    targetAddr: t,
                    encoder: () => erc20Iface.encodeFunctionData('allowance', [
                        defaultedOptions.allowance.owner,
                        defaultedOptions.allowance.spender,
                    ]),
                    decoder: (returnData) => erc20Iface.decodeFunctionResult('allowance', returnData)[0],
                });
            }
            if (defaultedOptions.balanceOf) {
                input.push({
                    targetAddr: t,
                    encoder: () => erc20Iface.encodeFunctionData('balanceOf', [
                        defaultedOptions.balanceOf.account,
                    ]),
                    decoder: (returnData) => erc20Iface.decodeFunctionResult('balanceOf', returnData)[0],
                });
            }
            if (defaultedOptions.decimals) {
                input.push({
                    targetAddr: t,
                    encoder: () => erc20Iface.encodeFunctionData('decimals'),
                    decoder: (returnData) => erc20Iface.decodeFunctionResult('decimals', returnData)[0],
                });
            }
            if (defaultedOptions.name) {
                input.push({
                    targetAddr: t,
                    encoder: () => erc20Iface.encodeFunctionData('name'),
                    decoder: (returnData) => {
                        // Maker doesn't follow the erc20 spec and returns bytes32 data.
                        // https://etherscan.io/token/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2#readContract
                        if (isBytes32(returnData)) {
                            return ethers_1.utils.parseBytes32String(returnData);
                        }
                        else
                            return erc20Iface.decodeFunctionResult('name', returnData)[0];
                    },
                });
            }
            if (defaultedOptions.symbol) {
                input.push({
                    targetAddr: t,
                    encoder: () => erc20Iface.encodeFunctionData('symbol'),
                    decoder: (returnData) => {
                        // Maker doesn't follow the erc20 spec and returns bytes32 data.
                        // https://etherscan.io/token/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2#readContract
                        if (isBytes32(returnData)) {
                            return ethers_1.utils.parseBytes32String(returnData);
                        }
                        else
                            return erc20Iface.decodeFunctionResult('symbol', returnData)[0];
                    },
                });
            }
        }
        const res = await this.multiCall(input);
        let i = 0;
        const tokens = [];
        while (i < res.length) {
            tokens.push({
                allowance: defaultedOptions.allowance
                    ? res[i++]
                    : undefined,
                balance: defaultedOptions.balanceOf
                    ? res[i++]
                    : undefined,
                decimals: defaultedOptions.decimals ? res[i++] : undefined,
                name: defaultedOptions.name ? res[i++] : undefined,
                symbol: defaultedOptions.symbol ? res[i++] : undefined,
            });
        }
        return tokens;
    }
}
exports.MultiCaller = MultiCaller;
