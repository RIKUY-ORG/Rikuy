import { Signer, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { AddressMappingTest, AddressMappingTestInterface } from "../AddressMappingTest";
type AddressMappingTestConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class AddressMappingTest__factory extends ContractFactory {
    constructor(...args: AddressMappingTestConstructorParams);
    deploy(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<AddressMappingTest>;
    getDeployTransaction(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): TransactionRequest;
    attach(address: string): AddressMappingTest;
    connect(signer: Signer): AddressMappingTest__factory;
    static readonly contractName: "AddressMappingTest";
    readonly contractName: "AddressMappingTest";
    static readonly bytecode = "0x608060405234801561001057600080fd5b5060c78061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063dac3dea914602d575b600080fd5b604760383660046063565b61111061111160901b01190190565b6040516001600160a01b03909116815260200160405180910390f35b600060208284031215607457600080fd5b81356001600160a01b0381168114608a57600080fd5b939250505056fea26469706673582212207f4ba200c3bf493bad903c37c302d4ee944fdf05b387adcaeaed4692f9977c9264736f6c63430008100033";
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
    static createInterface(): AddressMappingTestInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): AddressMappingTest;
}
export {};
