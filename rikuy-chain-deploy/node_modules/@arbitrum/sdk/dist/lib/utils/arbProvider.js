"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArbitrumProvider = void 0;
const providers_1 = require("@ethersproject/providers");
class ArbFormatter extends providers_1.Formatter {
    getDefaultFormats() {
        // formats was already initialised in super, so we can just access here
        const superFormats = super.getDefaultFormats();
        const bigNumber = this.bigNumber.bind(this);
        const hash = this.hash.bind(this);
        const number = this.number.bind(this);
        const arbBlockProps = {
            sendRoot: hash,
            sendCount: bigNumber,
            l1BlockNumber: number,
        };
        const arbReceiptFormat = Object.assign(Object.assign({}, superFormats.receipt), { l1BlockNumber: number, gasUsedForL1: bigNumber });
        return Object.assign(Object.assign({}, superFormats), { receipt: arbReceiptFormat, block: Object.assign(Object.assign({}, superFormats.block), arbBlockProps), blockWithTransactions: Object.assign(Object.assign({}, superFormats.blockWithTransactions), arbBlockProps) });
    }
    receipt(value) {
        return super.receipt(value);
    }
    block(block) {
        return super.block(block);
    }
    blockWithTransactions(block) {
        // ethersjs chose the wrong type for the super - it should have been BlockWithTransactions
        // but was instead just Block. This means that when we override we cant use ArbBlockWithTransactions
        // but must instead use just ArbBlock.
        return super.blockWithTransactions(block);
    }
}
/**
 * Arbitrum specific formats
 */
class ArbitrumProvider extends providers_1.Web3Provider {
    /**
     * Arbitrum specific formats
     * @param provider Must be connected to an Arbitrum network
     * @param network Must be an Arbitrum network
     */
    constructor(provider, network) {
        super(provider.send.bind(provider), network);
    }
    static getFormatter() {
        return this.arbFormatter;
    }
    async getTransactionReceipt(transactionHash) {
        return (await super.getTransactionReceipt(transactionHash));
    }
    async getBlockWithTransactions(blockHashOrBlockTag) {
        return (await super.getBlockWithTransactions(blockHashOrBlockTag));
    }
    async getBlock(blockHashOrBlockTag) {
        return (await super.getBlock(blockHashOrBlockTag));
    }
}
exports.ArbitrumProvider = ArbitrumProvider;
ArbitrumProvider.arbFormatter = new ArbFormatter();
