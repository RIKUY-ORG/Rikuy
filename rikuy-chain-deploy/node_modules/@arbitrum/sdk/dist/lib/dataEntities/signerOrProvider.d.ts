import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
export type SignerOrProvider = Signer | Provider;
/**
 * Utility functions for signer/provider union types
 */
export declare class SignerProviderUtils {
    static isSigner(signerOrProvider: SignerOrProvider): signerOrProvider is Signer;
    /**
     * If signerOrProvider is a provider then return itself.
     * If signerOrProvider is a signer then return signer.provider
     * @param signerOrProvider
     * @returns
     */
    static getProvider(signerOrProvider: SignerOrProvider): Provider | undefined;
    static getProviderOrThrow(signerOrProvider: SignerOrProvider): Provider;
    /**
     * Check if the signer has a connected provider
     * @param signer
     */
    static signerHasProvider(signer: Signer): signer is Signer & {
        provider: Provider;
    };
    /**
     * Checks that the signer/provider that's provider matches the chain id
     * Throws if not.
     * @param signerOrProvider
     * @param chainId
     */
    static checkNetworkMatches(signerOrProvider: SignerOrProvider, chainId: number): Promise<void>;
}
