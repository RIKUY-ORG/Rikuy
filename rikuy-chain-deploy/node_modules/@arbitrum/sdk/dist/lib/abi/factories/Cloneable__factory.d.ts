import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Cloneable, CloneableInterface } from "../Cloneable";
type CloneableConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class Cloneable__factory extends ContractFactory {
    constructor(...args: CloneableConstructorParams);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<Cloneable>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): Cloneable;
    connect(signer: Signer): Cloneable__factory;
    static readonly contractName: "Cloneable";
    readonly contractName: "Cloneable";
    static readonly bytecode = "0x6080604052348015600f57600080fd5b506000805460ff19166001179055607d8061002b6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80636f791d2914602d575b600080fd5b60005460ff16604051901515815260200160405180910390f3fea2646970667358221220ef510c11c4274cdd4d4ff00619cde358fd74fd512d18771e80054c11ee8fa11264736f6c63430008100033";
    static readonly abi: ({
        inputs: never[];
        stateMutability: string;
        type: string;
        name?: undefined;
        outputs?: undefined;
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
    static createInterface(): CloneableInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): Cloneable;
}
export {};
