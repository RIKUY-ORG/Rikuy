"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignerProviderUtils = void 0;
const errors_1 = require("../dataEntities/errors");
const lib_1 = require("../utils/lib");
/**
 * Utility functions for signer/provider union types
 */
class SignerProviderUtils {
    static isSigner(signerOrProvider) {
        return (0, lib_1.isDefined)(signerOrProvider.signMessage);
    }
    /**
     * If signerOrProvider is a provider then return itself.
     * If signerOrProvider is a signer then return signer.provider
     * @param signerOrProvider
     * @returns
     */
    static getProvider(signerOrProvider) {
        return this.isSigner(signerOrProvider)
            ? signerOrProvider.provider
            : signerOrProvider;
    }
    static getProviderOrThrow(signerOrProvider) {
        const maybeProvider = this.getProvider(signerOrProvider);
        if (!maybeProvider)
            throw new errors_1.MissingProviderArbSdkError('signerOrProvider');
        return maybeProvider;
    }
    /**
     * Check if the signer has a connected provider
     * @param signer
     */
    static signerHasProvider(signer) {
        return (0, lib_1.isDefined)(signer.provider);
    }
    /**
     * Checks that the signer/provider that's provider matches the chain id
     * Throws if not.
     * @param signerOrProvider
     * @param chainId
     */
    static async checkNetworkMatches(signerOrProvider, chainId) {
        const provider = this.getProvider(signerOrProvider);
        if (!provider)
            throw new errors_1.MissingProviderArbSdkError('signerOrProvider');
        const providerChainId = (await provider.getNetwork()).chainId;
        if (providerChainId !== chainId) {
            throw new errors_1.ArbSdkError(`Signer/provider chain id: ${providerChainId} doesn't match provided chain id: ${chainId}.`);
        }
    }
}
exports.SignerProviderUtils = SignerProviderUtils;
