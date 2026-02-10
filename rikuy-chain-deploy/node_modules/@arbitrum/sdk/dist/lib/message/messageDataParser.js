"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitRetryableMessageDataParser = void 0;
const address_1 = require("@ethersproject/address");
const abi_1 = require("@ethersproject/abi");
const bytes_1 = require("@ethersproject/bytes");
class SubmitRetryableMessageDataParser {
    /**
     * Parse the event data emitted in the InboxMessageDelivered event
     * for messages of type L1MessageType_submitRetryableTx
     * @param eventData The data field in InboxMessageDelivered for messages of kind L1MessageType_submitRetryableTx
     * @returns
     */
    parse(eventData) {
        // decode the data field - is been packed so we cant decode the bytes field this way
        const parsed = abi_1.defaultAbiCoder.decode([
            'uint256', // dest
            'uint256', // l2 call balue
            'uint256', // msg val
            'uint256', // max submission
            'uint256', // excess fee refund addr
            'uint256', // call value refund addr
            'uint256', // max gas
            'uint256', // gas price bid
            'uint256', // data length
        ], eventData);
        const addressFromBigNumber = (bn) => (0, address_1.getAddress)((0, bytes_1.hexZeroPad)(bn.toHexString(), 20));
        const destAddress = addressFromBigNumber(parsed[0]);
        const l2CallValue = parsed[1];
        const l1Value = parsed[2];
        const maxSubmissionFee = parsed[3];
        const excessFeeRefundAddress = addressFromBigNumber(parsed[4]);
        const callValueRefundAddress = addressFromBigNumber(parsed[5]);
        const gasLimit = parsed[6];
        const maxFeePerGas = parsed[7];
        const callDataLength = parsed[8];
        const data = '0x' +
            eventData.substring(eventData.length - callDataLength.mul(2).toNumber());
        return {
            destAddress,
            l2CallValue,
            l1Value,
            maxSubmissionFee: maxSubmissionFee,
            excessFeeRefundAddress,
            callValueRefundAddress,
            gasLimit,
            maxFeePerGas,
            data,
        };
    }
}
exports.SubmitRetryableMessageDataParser = SubmitRetryableMessageDataParser;
