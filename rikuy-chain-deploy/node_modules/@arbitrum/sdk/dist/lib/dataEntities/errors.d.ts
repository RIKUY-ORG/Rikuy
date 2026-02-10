/**
 * Errors originating in Arbitrum SDK
 */
export declare class ArbSdkError extends Error {
    readonly inner?: Error | undefined;
    constructor(message: string, inner?: Error | undefined);
}
/**
 * Thrown when a signer does not have a connected provider
 */
export declare class MissingProviderArbSdkError extends ArbSdkError {
    constructor(signerName: string);
}
