import { JsonRpcProvider, Formatter, BlockTag, Web3Provider } from '@ethersproject/providers';
import { Networkish } from '@ethersproject/networks';
import { ArbBlock, ArbBlockWithTransactions, ArbTransactionReceipt } from '../dataEntities/rpc';
/**
 * Arbitrum specific formats
 */
export declare class ArbitrumProvider extends Web3Provider {
    private static arbFormatter;
    /**
     * Arbitrum specific formats
     * @param provider Must be connected to an Arbitrum network
     * @param network Must be an Arbitrum network
     */
    constructor(provider: JsonRpcProvider, network?: Networkish);
    static getFormatter(): Formatter;
    getTransactionReceipt(transactionHash: string | Promise<string>): Promise<ArbTransactionReceipt>;
    getBlockWithTransactions(blockHashOrBlockTag: BlockTag | Promise<BlockTag>): Promise<ArbBlockWithTransactions>;
    getBlock(blockHashOrBlockTag: BlockTag | Promise<BlockTag>): Promise<ArbBlock>;
}
