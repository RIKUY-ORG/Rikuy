/*
 * Copyright 2021, Offchain Labs, Inc.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetBridger = void 0;
const networks_1 = require("../dataEntities/networks");
const signerOrProvider_1 = require("../dataEntities/signerOrProvider");
/**
 * Base for bridging assets from parent-to-child and back
 */
class AssetBridger {
    constructor(childNetwork) {
        this.childNetwork = childNetwork;
        this.nativeToken = childNetwork.nativeToken;
    }
    /**
     * Check the signer/provider matches the parent network, throws if not
     * @param sop
     */
    async checkParentNetwork(sop) {
        await signerOrProvider_1.SignerProviderUtils.checkNetworkMatches(sop, this.childNetwork.parentChainId);
    }
    /**
     * Check the signer/provider matches the child network, throws if not
     * @param sop
     */
    async checkChildNetwork(sop) {
        await signerOrProvider_1.SignerProviderUtils.checkNetworkMatches(sop, this.childNetwork.chainId);
    }
    /**
     * Whether the chain uses ETH as its native/gas token
     * @returns {boolean}
     */
    get nativeTokenIsEth() {
        return (0, networks_1.isArbitrumNetworkNativeTokenEther)(this.childNetwork);
    }
}
exports.AssetBridger = AssetBridger;
