/**
 * Ethereum/Arbitrum address class
 */
export declare class Address {
    readonly value: string;
    private readonly ADDRESS_ALIAS_OFFSET_BIG_INT;
    private readonly ADDRESS_BIT_LENGTH;
    private readonly ADDRESS_NIBBLE_LENGTH;
    /**
     * Ethereum/Arbitrum address class
     * @param value A valid Ethereum address. Doesn't need to be checksum cased.
     */
    constructor(value: string);
    private alias;
    /**
     * Find the L2 alias of an L1 address
     * @returns
     */
    applyAlias(): Address;
    /**
     * Find the L1 alias of an L2 address
     * @returns
     */
    undoAlias(): Address;
    equals(other: Address): boolean;
}
