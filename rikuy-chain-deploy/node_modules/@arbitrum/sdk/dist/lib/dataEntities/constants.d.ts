export declare const NODE_INTERFACE_ADDRESS = "0x00000000000000000000000000000000000000C8";
export declare const ARB_SYS_ADDRESS = "0x0000000000000000000000000000000000000064";
export declare const ARB_RETRYABLE_TX_ADDRESS = "0x000000000000000000000000000000000000006E";
export declare const ARB_ADDRESS_TABLE_ADDRESS = "0x0000000000000000000000000000000000000066";
export declare const ARB_OWNER_PUBLIC = "0x000000000000000000000000000000000000006B";
export declare const ARB_GAS_INFO = "0x000000000000000000000000000000000000006C";
export declare const ARB_STATISTICS = "0x000000000000000000000000000000000000006F";
export declare const ARB_MINIMUM_BLOCK_TIME_IN_SECONDS = 0.25;
/**
 * The offset added to an L1 address to get the corresponding L2 address
 */
export declare const ADDRESS_ALIAS_OFFSET = "0x1111000000000000000000000000000000001111";
/**
 * Address of the gateway a token will be assigned to if it is disabled
 */
export declare const DISABLED_GATEWAY = "0x0000000000000000000000000000000000000001";
/**
 * If a custom token is enabled for arbitrum it will implement a function called
 * isArbitrumEnabled which returns this value. Intger: 0xa4b1
 */
export declare const CUSTOM_TOKEN_IS_ENABLED = 42161;
export declare const SEVEN_DAYS_IN_SECONDS: number;
/**
 * How long to wait (in milliseconds) for a deposit to arrive before timing out a request.
 *
 * Finalisation on mainnet can be up to 2 epochs = 64 blocks.
 * We add 10 minutes for the system to create and redeem the ticket, plus some extra buffer of time.
 *
 * Total timeout: 30 minutes.
 */
export declare const DEFAULT_DEPOSIT_TIMEOUT: number;
/**
 * The L1 block at which Nitro was activated for Arbitrum One.
 *
 * @see https://etherscan.io/block/15447158
 */
export declare const ARB1_NITRO_GENESIS_L1_BLOCK = 15447158;
/**
 * The L2 block at which Nitro was activated for Arbitrum One.
 *
 * @see https://arbiscan.io/block/22207817
 */
export declare const ARB1_NITRO_GENESIS_L2_BLOCK = 22207817;
