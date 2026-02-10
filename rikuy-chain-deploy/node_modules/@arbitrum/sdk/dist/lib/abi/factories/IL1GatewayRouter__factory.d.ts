import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IL1GatewayRouter, IL1GatewayRouterInterface } from "../IL1GatewayRouter";
export declare class IL1GatewayRouter__factory {
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
    static createInterface(): IL1GatewayRouterInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IL1GatewayRouter;
}
