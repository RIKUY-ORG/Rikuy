"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChildToParentMessageStatus = exports.InboxMessageKind = void 0;
/**
 * The inbox message kind as defined in:
 * https://github.com/OffchainLabs/nitro/blob/c7f3429e2456bf5ca296a49cec3bb437420bc2bb/contracts/src/libraries/MessageTypes.sol
 */
var InboxMessageKind;
(function (InboxMessageKind) {
    InboxMessageKind[InboxMessageKind["L1MessageType_submitRetryableTx"] = 9] = "L1MessageType_submitRetryableTx";
    InboxMessageKind[InboxMessageKind["L1MessageType_ethDeposit"] = 12] = "L1MessageType_ethDeposit";
    InboxMessageKind[InboxMessageKind["L2MessageType_signedTx"] = 4] = "L2MessageType_signedTx";
})(InboxMessageKind || (exports.InboxMessageKind = InboxMessageKind = {}));
var ChildToParentMessageStatus;
(function (ChildToParentMessageStatus) {
    /**
     * ArbSys.sendTxToL1 called, but assertion not yet confirmed
     */
    ChildToParentMessageStatus[ChildToParentMessageStatus["UNCONFIRMED"] = 0] = "UNCONFIRMED";
    /**
     * Assertion for outgoing message confirmed, but message not yet executed
     */
    ChildToParentMessageStatus[ChildToParentMessageStatus["CONFIRMED"] = 1] = "CONFIRMED";
    /**
     * Outgoing message executed (terminal state)
     */
    ChildToParentMessageStatus[ChildToParentMessageStatus["EXECUTED"] = 2] = "EXECUTED";
})(ChildToParentMessageStatus || (exports.ChildToParentMessageStatus = ChildToParentMessageStatus = {}));
