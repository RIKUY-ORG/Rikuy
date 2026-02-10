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
exports.EventFetcher = void 0;
const ethers_1 = require("ethers");
/**
 * Fetches and parses blockchain logs
 */
class EventFetcher {
    constructor(provider) {
        this.provider = provider;
    }
    /**
     * Fetch logs and parse logs
     * @param contractFactory A contract factory for generating a contract of type TContract at the addr
     * @param topicGenerator Generator function for creating
     * @param filter Block and address filter parameters
     * @returns
     */
    async getEvents(contractFactory, topicGenerator, filter) {
        const contract = contractFactory.connect(filter.address || ethers_1.constants.AddressZero, this.provider);
        const eventFilter = topicGenerator(contract);
        const fullFilter = Object.assign(Object.assign({}, eventFilter), { address: filter.address, fromBlock: filter.fromBlock, toBlock: filter.toBlock });
        const logs = await this.provider.getLogs(fullFilter);
        return logs
            .filter(l => l.removed === false)
            .map(l => {
            const pLog = contract.interface.parseLog(l);
            return {
                event: pLog.args,
                topic: pLog.topic,
                name: pLog.name,
                blockNumber: l.blockNumber,
                blockHash: l.blockHash,
                transactionHash: l.transactionHash,
                address: l.address,
                topics: l.topics,
                data: l.data,
            };
        });
    }
}
exports.EventFetcher = EventFetcher;
