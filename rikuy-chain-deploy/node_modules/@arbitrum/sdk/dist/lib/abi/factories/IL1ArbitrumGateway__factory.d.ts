import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IL1ArbitrumGateway, IL1ArbitrumGatewayInterface } from "../IL1ArbitrumGateway";
export declare class IL1ArbitrumGateway__factory {
    static readonly abi: {
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
    }[];
    static createInterface(): IL1ArbitrumGatewayInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IL1ArbitrumGateway;
}
