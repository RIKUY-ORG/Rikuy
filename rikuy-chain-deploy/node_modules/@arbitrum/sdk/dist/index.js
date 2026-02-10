/*
 * Copyright 2019-2021, Offchain Labs, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-env node */
'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaleFromNativeTokenDecimalsTo18Decimals = exports.scaleFrom18DecimalsToNativeTokenDecimals = exports.isChildToParentTransactionRequest = exports.isParentToChildTransactionRequest = exports.Address = exports.RetryableDataTools = exports.ChildToParentMessageStatus = exports.constants = exports.ArbitrumProvider = exports.EventFetcher = exports.InboxTools = exports.mapL2NetworkTokenBridgeToTokenBridge = exports.mapL2NetworkToArbitrumNetwork = exports.registerCustomArbitrumNetwork = exports.getChildrenForNetwork = exports.getArbitrumNetworkInformationFromRollup = exports.getArbitrumNetworks = exports.getArbitrumNetwork = exports.MultiCaller = exports.argSerializerConstructor = exports.ParentToChildMessageGasEstimator = exports.ParentToChildMessageStatus = exports.ParentToChildMessageWriter = exports.ParentToChildMessageReaderClassic = exports.ParentToChildMessageReader = exports.ParentToChildMessage = exports.EthDepositMessageStatus = exports.EthDepositMessage = exports.ParentTransactionReceipt = exports.ParentContractCallTransactionReceipt = exports.ParentEthDepositTransactionReceipt = exports.ChildToParentMessageReader = exports.ChildToParentMessageWriter = exports.ChildToParentMessage = exports.ChildTransactionReceipt = exports.AdminErc20Bridger = exports.Erc20Bridger = exports.EthBridger = exports.Erc20L1L3Bridger = exports.EthL1L3Bridger = void 0;
var l1l3Bridger_1 = require("./lib/assetBridger/l1l3Bridger");
Object.defineProperty(exports, "EthL1L3Bridger", { enumerable: true, get: function () { return l1l3Bridger_1.EthL1L3Bridger; } });
Object.defineProperty(exports, "Erc20L1L3Bridger", { enumerable: true, get: function () { return l1l3Bridger_1.Erc20L1L3Bridger; } });
var ethBridger_1 = require("./lib/assetBridger/ethBridger");
Object.defineProperty(exports, "EthBridger", { enumerable: true, get: function () { return ethBridger_1.EthBridger; } });
var erc20Bridger_1 = require("./lib/assetBridger/erc20Bridger");
Object.defineProperty(exports, "Erc20Bridger", { enumerable: true, get: function () { return erc20Bridger_1.Erc20Bridger; } });
Object.defineProperty(exports, "AdminErc20Bridger", { enumerable: true, get: function () { return erc20Bridger_1.AdminErc20Bridger; } });
var ChildTransaction_1 = require("./lib/message/ChildTransaction");
Object.defineProperty(exports, "ChildTransactionReceipt", { enumerable: true, get: function () { return ChildTransaction_1.ChildTransactionReceipt; } });
var ChildToParentMessage_1 = require("./lib/message/ChildToParentMessage");
Object.defineProperty(exports, "ChildToParentMessage", { enumerable: true, get: function () { return ChildToParentMessage_1.ChildToParentMessage; } });
Object.defineProperty(exports, "ChildToParentMessageWriter", { enumerable: true, get: function () { return ChildToParentMessage_1.ChildToParentMessageWriter; } });
Object.defineProperty(exports, "ChildToParentMessageReader", { enumerable: true, get: function () { return ChildToParentMessage_1.ChildToParentMessageReader; } });
var ParentTransaction_1 = require("./lib/message/ParentTransaction");
Object.defineProperty(exports, "ParentEthDepositTransactionReceipt", { enumerable: true, get: function () { return ParentTransaction_1.ParentEthDepositTransactionReceipt; } });
Object.defineProperty(exports, "ParentContractCallTransactionReceipt", { enumerable: true, get: function () { return ParentTransaction_1.ParentContractCallTransactionReceipt; } });
Object.defineProperty(exports, "ParentTransactionReceipt", { enumerable: true, get: function () { return ParentTransaction_1.ParentTransactionReceipt; } });
var ParentToChildMessage_1 = require("./lib/message/ParentToChildMessage");
Object.defineProperty(exports, "EthDepositMessage", { enumerable: true, get: function () { return ParentToChildMessage_1.EthDepositMessage; } });
Object.defineProperty(exports, "EthDepositMessageStatus", { enumerable: true, get: function () { return ParentToChildMessage_1.EthDepositMessageStatus; } });
Object.defineProperty(exports, "ParentToChildMessage", { enumerable: true, get: function () { return ParentToChildMessage_1.ParentToChildMessage; } });
Object.defineProperty(exports, "ParentToChildMessageReader", { enumerable: true, get: function () { return ParentToChildMessage_1.ParentToChildMessageReader; } });
Object.defineProperty(exports, "ParentToChildMessageReaderClassic", { enumerable: true, get: function () { return ParentToChildMessage_1.ParentToChildMessageReaderClassic; } });
Object.defineProperty(exports, "ParentToChildMessageWriter", { enumerable: true, get: function () { return ParentToChildMessage_1.ParentToChildMessageWriter; } });
Object.defineProperty(exports, "ParentToChildMessageStatus", { enumerable: true, get: function () { return ParentToChildMessage_1.ParentToChildMessageStatus; } });
var ParentToChildMessageGasEstimator_1 = require("./lib/message/ParentToChildMessageGasEstimator");
Object.defineProperty(exports, "ParentToChildMessageGasEstimator", { enumerable: true, get: function () { return ParentToChildMessageGasEstimator_1.ParentToChildMessageGasEstimator; } });
var byte_serialize_params_1 = require("./lib/utils/byte_serialize_params");
Object.defineProperty(exports, "argSerializerConstructor", { enumerable: true, get: function () { return byte_serialize_params_1.argSerializerConstructor; } });
var multicall_1 = require("./lib/utils/multicall");
Object.defineProperty(exports, "MultiCaller", { enumerable: true, get: function () { return multicall_1.MultiCaller; } });
var networks_1 = require("./lib/dataEntities/networks");
Object.defineProperty(exports, "getArbitrumNetwork", { enumerable: true, get: function () { return networks_1.getArbitrumNetwork; } });
Object.defineProperty(exports, "getArbitrumNetworks", { enumerable: true, get: function () { return networks_1.getArbitrumNetworks; } });
Object.defineProperty(exports, "getArbitrumNetworkInformationFromRollup", { enumerable: true, get: function () { return networks_1.getArbitrumNetworkInformationFromRollup; } });
Object.defineProperty(exports, "getChildrenForNetwork", { enumerable: true, get: function () { return networks_1.getChildrenForNetwork; } });
Object.defineProperty(exports, "registerCustomArbitrumNetwork", { enumerable: true, get: function () { return networks_1.registerCustomArbitrumNetwork; } });
Object.defineProperty(exports, "mapL2NetworkToArbitrumNetwork", { enumerable: true, get: function () { return networks_1.mapL2NetworkToArbitrumNetwork; } });
Object.defineProperty(exports, "mapL2NetworkTokenBridgeToTokenBridge", { enumerable: true, get: function () { return networks_1.mapL2NetworkTokenBridgeToTokenBridge; } });
var inbox_1 = require("./lib/inbox/inbox");
Object.defineProperty(exports, "InboxTools", { enumerable: true, get: function () { return inbox_1.InboxTools; } });
var eventFetcher_1 = require("./lib/utils/eventFetcher");
Object.defineProperty(exports, "EventFetcher", { enumerable: true, get: function () { return eventFetcher_1.EventFetcher; } });
var arbProvider_1 = require("./lib/utils/arbProvider");
Object.defineProperty(exports, "ArbitrumProvider", { enumerable: true, get: function () { return arbProvider_1.ArbitrumProvider; } });
exports.constants = __importStar(require("./lib/dataEntities/constants"));
var message_1 = require("./lib/dataEntities/message");
Object.defineProperty(exports, "ChildToParentMessageStatus", { enumerable: true, get: function () { return message_1.ChildToParentMessageStatus; } });
var retryableData_1 = require("./lib/dataEntities/retryableData");
Object.defineProperty(exports, "RetryableDataTools", { enumerable: true, get: function () { return retryableData_1.RetryableDataTools; } });
var address_1 = require("./lib/dataEntities/address");
Object.defineProperty(exports, "Address", { enumerable: true, get: function () { return address_1.Address; } });
var transactionRequest_1 = require("./lib/dataEntities/transactionRequest");
Object.defineProperty(exports, "isParentToChildTransactionRequest", { enumerable: true, get: function () { return transactionRequest_1.isParentToChildTransactionRequest; } });
Object.defineProperty(exports, "isChildToParentTransactionRequest", { enumerable: true, get: function () { return transactionRequest_1.isChildToParentTransactionRequest; } });
var lib_1 = require("./lib/utils/lib");
Object.defineProperty(exports, "scaleFrom18DecimalsToNativeTokenDecimals", { enumerable: true, get: function () { return lib_1.scaleFrom18DecimalsToNativeTokenDecimals; } });
Object.defineProperty(exports, "scaleFromNativeTokenDecimalsTo18Decimals", { enumerable: true, get: function () { return lib_1.scaleFromNativeTokenDecimalsTo18Decimals; } });
