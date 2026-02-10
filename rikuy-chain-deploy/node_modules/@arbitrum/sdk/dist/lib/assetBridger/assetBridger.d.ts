import { ParentContractTransaction } from '../message/ParentTransaction';
import { ChildContractTransaction } from '../message/ChildTransaction';
import { ArbitrumNetwork } from '../dataEntities/networks';
import { SignerOrProvider } from '../dataEntities/signerOrProvider';
/**
 * Base for bridging assets from parent-to-child and back
 */
export declare abstract class AssetBridger<DepositParams, WithdrawParams> {
    readonly childNetwork: ArbitrumNetwork;
    /**
     * In case of a chain that uses ETH as its native/gas token, this is either `undefined` or the zero address
     *
     * In case of a chain that uses an ERC-20 token from the parent network as its native/gas token, this is the address of said token on the parent network
     */
    readonly nativeToken?: string;
    constructor(childNetwork: ArbitrumNetwork);
    /**
     * Check the signer/provider matches the parent network, throws if not
     * @param sop
     */
    protected checkParentNetwork(sop: SignerOrProvider): Promise<void>;
    /**
     * Check the signer/provider matches the child network, throws if not
     * @param sop
     */
    protected checkChildNetwork(sop: SignerOrProvider): Promise<void>;
    /**
     * Whether the chain uses ETH as its native/gas token
     * @returns {boolean}
     */
    protected get nativeTokenIsEth(): boolean;
    /**
     * Transfer assets from parent-to-child
     * @param params
     */
    abstract deposit(params: DepositParams): Promise<ParentContractTransaction>;
    /**
     * Transfer assets from child-to-parent
     * @param params
     */
    abstract withdraw(params: WithdrawParams): Promise<ChildContractTransaction>;
}
