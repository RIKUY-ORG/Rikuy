"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErc20ParentAddressFromParentToChildTxRequest = void 0;
const L1GatewayRouter__factory_1 = require("../abi/factories/L1GatewayRouter__factory");
const getErc20ParentAddressFromParentToChildTxRequest = (txReq) => {
    const { txRequest: { data }, } = txReq;
    const iGatewayRouter = L1GatewayRouter__factory_1.L1GatewayRouter__factory.createInterface();
    try {
        const decodedData = iGatewayRouter.decodeFunctionData('outboundTransfer', data);
        return decodedData['_token'];
    }
    catch (_a) {
        try {
            const decodedData = iGatewayRouter.decodeFunctionData('outboundTransferCustomRefund', data);
            return decodedData['_token'];
        }
        catch (_b) {
            throw new Error('data signature not matching deposits methods');
        }
    }
};
exports.getErc20ParentAddressFromParentToChildTxRequest = getErc20ParentAddressFromParentToChildTxRequest;
