import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { EthVault, EthVaultInterface } from "../EthVault";
type EthVaultConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class EthVault__factory extends ContractFactory {
    constructor(...args: EthVaultConstructorParams);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<EthVault>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): EthVault;
    connect(signer: Signer): EthVault__factory;
    static readonly contractName: "EthVault";
    readonly contractName: "EthVault";
    static readonly bytecode = "0x60806040526000805534801561001457600080fd5b5060f3806100236000396000f3fe60806040526004361060305760003560e01c8063408def1e14603557806350b23fd214604757806354fd4d5014604d575b600080fd5b6045604036600460a5565b600055565b005b60456073565b348015605857600080fd5b50606160005481565b60405190815260200160405180910390f35b60405162461bcd60e51b815260206004820152600360248201526262796560e81b604482015260640160405180910390fd5b60006020828403121560b657600080fd5b503591905056fea26469706673582212207ebc17d77ebaabefad89161947016e1af2be3259ff0102b57344eb6ffc216b9064736f6c63430008090033";
    static readonly abi: ({
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: never[];
        stateMutability: string;
        type: string;
    } | {
        inputs: never[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    })[];
    static createInterface(): EthVaultInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): EthVault;
}
export {};
