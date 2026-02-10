import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { L1MintableToken, L1MintableTokenInterface } from "../L1MintableToken";
export declare class L1MintableToken__factory {
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
    static createInterface(): L1MintableTokenInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): L1MintableToken;
}
