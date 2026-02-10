"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Address = void 0;
const address_1 = require("@ethersproject/address");
const ethers_1 = require("ethers");
const constants_1 = require("./constants");
const errors_1 = require("./errors");
/**
 * Ethereum/Arbitrum address class
 */
class Address {
    /**
     * Ethereum/Arbitrum address class
     * @param value A valid Ethereum address. Doesn't need to be checksum cased.
     */
    constructor(value) {
        this.value = value;
        this.ADDRESS_ALIAS_OFFSET_BIG_INT = BigInt(constants_1.ADDRESS_ALIAS_OFFSET);
        this.ADDRESS_BIT_LENGTH = 160;
        this.ADDRESS_NIBBLE_LENGTH = this.ADDRESS_BIT_LENGTH / 4;
        if (!ethers_1.utils.isAddress(value))
            throw new errors_1.ArbSdkError(`'${value}' is not a valid address`);
    }
    alias(address, forward) {
        // we use BigInts in here to allow for proper under/overflow behaviour
        // BigInt.asUintN calculates the correct positive modulus
        return (0, address_1.getAddress)('0x' +
            BigInt.asUintN(this.ADDRESS_BIT_LENGTH, forward
                ? BigInt(address) + this.ADDRESS_ALIAS_OFFSET_BIG_INT
                : BigInt(address) - this.ADDRESS_ALIAS_OFFSET_BIG_INT)
                .toString(16)
                .padStart(this.ADDRESS_NIBBLE_LENGTH, '0'));
    }
    /**
     * Find the L2 alias of an L1 address
     * @returns
     */
    applyAlias() {
        return new Address(this.alias(this.value, true));
    }
    /**
     * Find the L1 alias of an L2 address
     * @returns
     */
    undoAlias() {
        return new Address(this.alias(this.value, false));
    }
    equals(other) {
        return this.value.toLowerCase() === other.value.toLowerCase();
    }
}
exports.Address = Address;
