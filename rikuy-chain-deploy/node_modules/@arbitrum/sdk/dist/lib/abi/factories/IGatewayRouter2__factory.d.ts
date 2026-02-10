import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IGatewayRouter2, IGatewayRouter2Interface } from "../IGatewayRouter2";
export declare class IGatewayRouter2__factory {
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
    static createInterface(): IGatewayRouter2Interface;
    static connect(address: string, signerOrProvider: Signer | Provider): IGatewayRouter2;
}
