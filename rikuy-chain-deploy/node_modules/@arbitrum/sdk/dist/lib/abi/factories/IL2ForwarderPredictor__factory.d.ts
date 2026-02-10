import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IL2ForwarderPredictor, IL2ForwarderPredictorInterface } from "../IL2ForwarderPredictor";
export declare class IL2ForwarderPredictor__factory {
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
    static createInterface(): IL2ForwarderPredictorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): IL2ForwarderPredictor;
}
