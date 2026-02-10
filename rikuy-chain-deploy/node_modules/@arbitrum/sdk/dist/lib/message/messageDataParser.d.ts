import { BigNumber } from '@ethersproject/bignumber';
export declare class SubmitRetryableMessageDataParser {
    /**
     * Parse the event data emitted in the InboxMessageDelivered event
     * for messages of type L1MessageType_submitRetryableTx
     * @param eventData The data field in InboxMessageDelivered for messages of kind L1MessageType_submitRetryableTx
     * @returns
     */
    parse(eventData: string): {
        destAddress: string;
        l2CallValue: BigNumber;
        l1Value: BigNumber;
        maxSubmissionFee: BigNumber;
        excessFeeRefundAddress: string;
        callValueRefundAddress: string;
        gasLimit: BigNumber;
        maxFeePerGas: BigNumber;
        data: string;
    };
}
