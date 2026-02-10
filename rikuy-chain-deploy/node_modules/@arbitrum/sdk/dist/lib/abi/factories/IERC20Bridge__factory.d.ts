import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IERC20Bridge, IERC20BridgeInterface } from "../IERC20Bridge";
export declare class IERC20Bridge__factory {
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
    static createInterface(): IERC20BridgeInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IERC20Bridge;
}
