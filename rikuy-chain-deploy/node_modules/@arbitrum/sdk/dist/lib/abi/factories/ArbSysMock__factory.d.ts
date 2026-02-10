import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { ArbSysMock, ArbSysMockInterface } from "../ArbSysMock";
type ArbSysMockConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class ArbSysMock__factory extends ContractFactory {
    constructor(...args: ArbSysMockConstructorParams);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ArbSysMock>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): ArbSysMock;
    connect(signer: Signer): ArbSysMock__factory;
    static readonly contractName: "ArbSysMock";
    readonly contractName: "ArbSysMock";
    static readonly bytecode = "0x608060405234801561001057600080fd5b506101e2806100206000396000f3fe60806040526004361061001e5760003560e01c8063928c169a14610023575b600080fd5b6100366100313660046100a0565b610048565b60405190815260200160405180910390f35b600054610056816001610131565b6000556040517f9c649d9cf7e595acf74f208b61d2eba4614c03a5cde6e6f127f4cac54baf8183906100919033908790349088908890610158565b60405180910390a19392505050565b6000806000604084860312156100b557600080fd5b83356001600160a01b03811681146100cc57600080fd5b9250602084013567ffffffffffffffff808211156100e957600080fd5b818601915086601f8301126100fd57600080fd5b81358181111561010c57600080fd5b87602082850101111561011e57600080fd5b6020830194508093505050509250925092565b8082018082111561015257634e487b7160e01b600052601160045260246000fd5b92915050565b6001600160a01b038681168252851660208201526040810184905260806060820181905281018290526000828460a0840137600060a0848401015260a0601f19601f8501168301019050969550505050505056fea26469706673582212200afbec3fe690ddad35f287d32e8bbe3f4d1b1f2b2e23b8cec391dd2572dd0abd64736f6c63430008100033";
    static readonly abi: ({
        anonymous: boolean;
        inputs: {
            indexed: boolean;
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        type: string;
        outputs?: undefined;
        stateMutability?: undefined;
    } | {
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
        anonymous?: undefined;
    })[];
    static createInterface(): ArbSysMockInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): ArbSysMock;
}
export {};
