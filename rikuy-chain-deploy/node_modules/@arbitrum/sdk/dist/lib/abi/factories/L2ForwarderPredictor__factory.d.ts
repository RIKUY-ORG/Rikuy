import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { L2ForwarderPredictor, L2ForwarderPredictorInterface } from "../L2ForwarderPredictor";
export declare class L2ForwarderPredictor__factory {
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
    static createInterface(): L2ForwarderPredictorInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): L2ForwarderPredictor;
}
