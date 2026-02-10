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
exports.ARB1_NITRO_GENESIS_L2_BLOCK = exports.ARB1_NITRO_GENESIS_L1_BLOCK = exports.DEFAULT_DEPOSIT_TIMEOUT = exports.SEVEN_DAYS_IN_SECONDS = exports.CUSTOM_TOKEN_IS_ENABLED = exports.DISABLED_GATEWAY = exports.ADDRESS_ALIAS_OFFSET = exports.ARB_MINIMUM_BLOCK_TIME_IN_SECONDS = exports.ARB_STATISTICS = exports.ARB_GAS_INFO = exports.ARB_OWNER_PUBLIC = exports.ARB_ADDRESS_TABLE_ADDRESS = exports.ARB_RETRYABLE_TX_ADDRESS = exports.ARB_SYS_ADDRESS = exports.NODE_INTERFACE_ADDRESS = void 0;
exports.NODE_INTERFACE_ADDRESS = '0x00000000000000000000000000000000000000C8';
exports.ARB_SYS_ADDRESS = '0x0000000000000000000000000000000000000064';
exports.ARB_RETRYABLE_TX_ADDRESS = '0x000000000000000000000000000000000000006E';
exports.ARB_ADDRESS_TABLE_ADDRESS = '0x0000000000000000000000000000000000000066';
exports.ARB_OWNER_PUBLIC = '0x000000000000000000000000000000000000006B';
exports.ARB_GAS_INFO = '0x000000000000000000000000000000000000006C';
exports.ARB_STATISTICS = '0x000000000000000000000000000000000000006F';
exports.ARB_MINIMUM_BLOCK_TIME_IN_SECONDS = 0.25;
/**
 * The offset added to an L1 address to get the corresponding L2 address
 */
exports.ADDRESS_ALIAS_OFFSET = '0x1111000000000000000000000000000000001111';
/**
 * Address of the gateway a token will be assigned to if it is disabled
 */
exports.DISABLED_GATEWAY = '0x0000000000000000000000000000000000000001';
/**
 * If a custom token is enabled for arbitrum it will implement a function called
 * isArbitrumEnabled which returns this value. Intger: 0xa4b1
 */
exports.CUSTOM_TOKEN_IS_ENABLED = 42161;
exports.SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
/**
 * How long to wait (in milliseconds) for a deposit to arrive before timing out a request.
 *
 * Finalisation on mainnet can be up to 2 epochs = 64 blocks.
 * We add 10 minutes for the system to create and redeem the ticket, plus some extra buffer of time.
 *
 * Total timeout: 30 minutes.
 */
exports.DEFAULT_DEPOSIT_TIMEOUT = 30 * 60 * 1000;
/**
 * The L1 block at which Nitro was activated for Arbitrum One.
 *
 * @see https://etherscan.io/block/15447158
 */
exports.ARB1_NITRO_GENESIS_L1_BLOCK = 15447158;
/**
 * The L2 block at which Nitro was activated for Arbitrum One.
 *
 * @see https://arbiscan.io/block/22207817
 */
exports.ARB1_NITRO_GENESIS_L2_BLOCK = 22207817;
