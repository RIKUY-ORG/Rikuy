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
exports.MissingProviderArbSdkError = exports.ArbSdkError = void 0;
/**
 * Errors originating in Arbitrum SDK
 */
class ArbSdkError extends Error {
    constructor(message, inner) {
        super(message);
        this.inner = inner;
        if (inner) {
            this.stack += '\nCaused By: ' + inner.stack;
        }
    }
}
exports.ArbSdkError = ArbSdkError;
/**
 * Thrown when a signer does not have a connected provider
 */
class MissingProviderArbSdkError extends ArbSdkError {
    constructor(signerName) {
        super(`${signerName} does not have a connected provider and one is required.`);
    }
}
exports.MissingProviderArbSdkError = MissingProviderArbSdkError;
