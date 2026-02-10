import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IOrbitGatewayRouter, IOrbitGatewayRouterInterface } from "../IOrbitGatewayRouter";
export declare class IOrbitGatewayRouter__factory {
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
    static createInterface(): IOrbitGatewayRouterInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IOrbitGatewayRouter;
}
