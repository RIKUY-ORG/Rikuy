import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IL1OrbitCustomGateway, IL1OrbitCustomGatewayInterface } from "../IL1OrbitCustomGateway";
export declare class IL1OrbitCustomGateway__factory {
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
    static createInterface(): IL1OrbitCustomGatewayInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IL1OrbitCustomGateway;
}
