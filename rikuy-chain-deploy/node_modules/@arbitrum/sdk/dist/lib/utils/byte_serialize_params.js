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
exports.serializeParams = exports.argSerializerConstructor = exports.getAddressIndex = void 0;
const address_1 = require("@ethersproject/address");
const bytes_1 = require("@ethersproject/bytes");
const bignumber_1 = require("@ethersproject/bignumber");
const ArbAddressTable__factory_1 = require("../abi/factories/ArbAddressTable__factory");
const constants_1 = require("../dataEntities/constants");
const errors_1 = require("../dataEntities/errors");
exports.getAddressIndex = (() => {
    const addressToIndexMemo = {};
    let arbAddressTable;
    return async (address, signerOrProvider) => {
        if (addressToIndexMemo[address]) {
            return addressToIndexMemo[address];
        }
        arbAddressTable =
            arbAddressTable ||
                ArbAddressTable__factory_1.ArbAddressTable__factory.connect(constants_1.ARB_ADDRESS_TABLE_ADDRESS, signerOrProvider);
        const isRegistered = await arbAddressTable.addressExists(address);
        if (isRegistered) {
            const index = (await arbAddressTable.lookup(address)).toNumber();
            addressToIndexMemo[address] = index;
            return index;
        }
        else {
            return -1;
        }
    };
})();
/**
  to use:
  
  ```js
  const mySerializeParamsFunction = argSerializerConstructor("rpcurl")
  mySerializeParamsFunction(["4","5", "6"])
  ```
*/
const argSerializerConstructor = (arbProvider) => {
    return async (params) => {
        return await (0, exports.serializeParams)(params, async (address) => {
            return await (0, exports.getAddressIndex)(address, arbProvider);
        });
    };
};
exports.argSerializerConstructor = argSerializerConstructor;
const isAddress = (input) => typeof input === 'string' && (0, address_1.isAddress)(input);
const toUint = (val, bytes) => (0, bytes_1.hexZeroPad)(bignumber_1.BigNumber.from(val).toHexString(), bytes);
//  outputs string suitable for formatting
const formatPrimative = (value) => {
    if (isAddress(value)) {
        return value;
    }
    else if (typeof value === 'boolean') {
        return toUint(value ? 1 : 0, 1);
    }
    else if (typeof value === 'number' ||
        Number(value) ||
        bignumber_1.BigNumber.isBigNumber(value)) {
        return toUint(value, 32);
    }
    else {
        throw new errors_1.ArbSdkError('unsupported type');
    }
};
/**
 * @param params array of serializable types to
 * @param addressToIndex optional getter of address index registered in table
 */
const serializeParams = async (params, addressToIndex = () => new Promise(exec => exec(-1))) => {
    const formattedParams = [];
    for (const param of params) {
        // handle arrays
        if (Array.isArray(param)) {
            let paramArray = param;
            formattedParams.push(toUint(paramArray.length, 1));
            if (isAddress(paramArray[0])) {
                const indices = await Promise.all(paramArray.map(async (address) => await addressToIndex(address)));
                // If all addresses are registered, serialize as indices
                if (indices.every(i => i > -1)) {
                    paramArray = indices;
                    formattedParams.push(toUint(1, 1));
                    paramArray.forEach(value => {
                        formattedParams.push(toUint(value, 4));
                    });
                    // otherwise serialize as address
                }
                else {
                    formattedParams.push(toUint(0, 1));
                    paramArray.forEach(value => {
                        formattedParams.push(formatPrimative(value));
                    });
                }
            }
            else {
                paramArray.forEach(value => {
                    formattedParams.push(formatPrimative(value));
                });
            }
        }
        else {
            //  handle non-arrays
            if (isAddress(param)) {
                const index = await addressToIndex(param);
                if (index > -1) {
                    formattedParams.push(toUint(1, 1), toUint(index, 4));
                }
                else {
                    formattedParams.push(toUint(0, 1), formatPrimative(param));
                }
            }
            else {
                formattedParams.push(formatPrimative(param));
            }
        }
    }
    return (0, bytes_1.concat)(formattedParams);
};
exports.serializeParams = serializeParams;
