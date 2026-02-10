"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockRangesForL1Block = exports.isArbitrumChain = exports.isDefined = exports.getTransactionReceipt = exports.getBaseFee = exports.wait = void 0;
exports.getFirstBlockForL1Block = getFirstBlockForL1Block;
exports.getNativeTokenDecimals = getNativeTokenDecimals;
exports.scaleFrom18DecimalsToNativeTokenDecimals = scaleFrom18DecimalsToNativeTokenDecimals;
exports.scaleFromNativeTokenDecimalsTo18Decimals = scaleFromNativeTokenDecimalsTo18Decimals;
const ethers_1 = require("ethers");
const errors_1 = require("../dataEntities/errors");
const arbProvider_1 = require("./arbProvider");
const ArbSys__factory_1 = require("../abi/factories/ArbSys__factory");
const constants_1 = require("../dataEntities/constants");
const networks_1 = require("../dataEntities/networks");
const ERC20__factory_1 = require("../abi/factories/ERC20__factory");
const wait = (ms) => new Promise(res => setTimeout(res, ms));
exports.wait = wait;
const getBaseFee = async (provider) => {
    const baseFee = (await provider.getBlock('latest')).baseFeePerGas;
    if (!baseFee) {
        throw new errors_1.ArbSdkError('Latest block did not contain base fee, ensure provider is connected to a network that supports EIP 1559.');
    }
    return baseFee;
};
exports.getBaseFee = getBaseFee;
/**
 * Waits for a transaction receipt if confirmations or timeout is provided
 * Otherwise tries to fetch straight away.
 * @param provider
 * @param txHash
 * @param confirmations
 * @param timeout
 * @returns
 */
const getTransactionReceipt = async (provider, txHash, confirmations, timeout) => {
    if (confirmations || timeout) {
        try {
            const receipt = await provider.waitForTransaction(txHash, confirmations, timeout);
            return receipt || null;
        }
        catch (err) {
            if (err.message.includes('timeout exceeded')) {
                // return null
                return null;
            }
            else
                throw err;
        }
    }
    else {
        const receipt = await provider.getTransactionReceipt(txHash);
        return receipt || null;
    }
};
exports.getTransactionReceipt = getTransactionReceipt;
const isDefined = (val) => typeof val !== 'undefined' && val !== null;
exports.isDefined = isDefined;
const isArbitrumChain = async (provider) => {
    try {
        await ArbSys__factory_1.ArbSys__factory.connect(constants_1.ARB_SYS_ADDRESS, provider).arbOSVersion();
    }
    catch (error) {
        return false;
    }
    return true;
};
exports.isArbitrumChain = isArbitrumChain;
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
async function getFirstBlockForL1Block({ arbitrumProvider, forL1Block, allowGreater = false, minArbitrumBlock, maxArbitrumBlock = 'latest', }) {
    if (!(await (0, exports.isArbitrumChain)(arbitrumProvider))) {
        // Provider is L1.
        return forL1Block;
    }
    const arbProvider = new arbProvider_1.ArbitrumProvider(arbitrumProvider);
    const currentArbBlock = await arbProvider.getBlockNumber();
    const arbitrumChainId = (await arbProvider.getNetwork()).chainId;
    const nitroGenesisBlock = (0, networks_1.getNitroGenesisBlock)(arbitrumChainId);
    async function getL1Block(forL2Block) {
        const { l1BlockNumber } = await arbProvider.getBlock(forL2Block);
        return l1BlockNumber;
    }
    if (!minArbitrumBlock) {
        minArbitrumBlock = nitroGenesisBlock;
    }
    if (maxArbitrumBlock === 'latest') {
        maxArbitrumBlock = currentArbBlock;
    }
    if (minArbitrumBlock >= maxArbitrumBlock) {
        throw new Error(`'minArbitrumBlock' (${minArbitrumBlock}) must be lower than 'maxArbitrumBlock' (${maxArbitrumBlock}).`);
    }
    if (minArbitrumBlock < nitroGenesisBlock) {
        throw new Error(`'minArbitrumBlock' (${minArbitrumBlock}) cannot be below the Nitro genesis block, which is ${nitroGenesisBlock} for the current network.`);
    }
    let start = minArbitrumBlock;
    let end = maxArbitrumBlock;
    let resultForTargetBlock;
    let resultForGreaterBlock;
    while (start <= end) {
        // Calculate the midpoint of the current range.
        const mid = start + Math.floor((end - start) / 2);
        const l1Block = await getL1Block(mid);
        // If the midpoint matches the target, we've found a match.
        // Adjust the range to search for the first occurrence.
        if (l1Block === forL1Block) {
            end = mid - 1;
        }
        else if (l1Block < forL1Block) {
            start = mid + 1;
        }
        else {
            end = mid - 1;
        }
        // Stores last valid Arbitrum block corresponding to the current, or greater, L1 block.
        if (l1Block) {
            if (l1Block === forL1Block) {
                resultForTargetBlock = mid;
            }
            if (allowGreater && l1Block > forL1Block) {
                resultForGreaterBlock = mid;
            }
        }
    }
    return resultForTargetBlock !== null && resultForTargetBlock !== void 0 ? resultForTargetBlock : resultForGreaterBlock;
}
const getBlockRangesForL1Block = async (props) => {
    const arbProvider = new arbProvider_1.ArbitrumProvider(props.arbitrumProvider);
    const currentArbitrumBlock = await arbProvider.getBlockNumber();
    if (!props.maxArbitrumBlock || props.maxArbitrumBlock === 'latest') {
        props.maxArbitrumBlock = currentArbitrumBlock;
    }
    const result = await Promise.all([
        getFirstBlockForL1Block(Object.assign(Object.assign({}, props), { allowGreater: false })),
        getFirstBlockForL1Block(Object.assign(Object.assign({}, props), { forL1Block: props.forL1Block + 1, allowGreater: true })),
    ]);
    if (!result[0]) {
        // If there's no start of the range, there won't be the end either.
        return [undefined, undefined];
    }
    if (result[0] && result[1]) {
        // If both results are defined, we can assume that the previous Arbitrum block for the end of the range will be for 'forL1Block'.
        return [result[0], result[1] - 1];
    }
    return [result[0], props.maxArbitrumBlock];
};
exports.getBlockRangesForL1Block = getBlockRangesForL1Block;
async function getNativeTokenDecimals({ parentProvider, childNetwork, }) {
    const nativeTokenAddress = childNetwork.nativeToken;
    if (!nativeTokenAddress || nativeTokenAddress === ethers_1.constants.AddressZero) {
        return 18;
    }
    const nativeTokenContract = ERC20__factory_1.ERC20__factory.connect(nativeTokenAddress, parentProvider);
    try {
        return await nativeTokenContract.decimals();
    }
    catch (_a) {
        return 0;
    }
}
function scaleFrom18DecimalsToNativeTokenDecimals({ amount, decimals, }) {
    // do nothing for 18 decimals
    if (decimals === 18) {
        return amount;
    }
    if (decimals < 18) {
        const scaledAmount = amount.div(ethers_1.BigNumber.from(10).pow(ethers_1.BigNumber.from(18 - decimals)));
        // round up if necessary
        if (scaledAmount
            .mul(ethers_1.BigNumber.from(10).pow(ethers_1.BigNumber.from(18 - decimals)))
            .lt(amount)) {
            return scaledAmount.add(ethers_1.BigNumber.from(1));
        }
        return scaledAmount;
    }
    // decimals > 18
    return amount.mul(ethers_1.BigNumber.from(10).pow(ethers_1.BigNumber.from(decimals - 18)));
}
function scaleFromNativeTokenDecimalsTo18Decimals({ amount, decimals, }) {
    if (decimals < 18) {
        return amount.mul(ethers_1.BigNumber.from(10).pow(18 - decimals));
    }
    else if (decimals > 18) {
        return amount.div(ethers_1.BigNumber.from(10).pow(decimals - 18));
    }
    return amount;
}
