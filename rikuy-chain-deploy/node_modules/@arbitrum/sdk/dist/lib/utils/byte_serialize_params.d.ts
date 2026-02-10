/**
#### Byte Serializing Solidity Arguments Schema

Arbitrum SDK includes methods for [serializing parameters](https://developer.offchainlabs.com/docs/special_features#parameter-byte-serialization) for a solidity method into a single byte array to minimize calldata. It uses the following schema:

#### address[]:

| field         | size (bytes)       | Description                                                             |
| ------------- | ------------------ | ----------------------------------------------------------------------- |
| length        | 1                  | Size of array                                                           |
| is-registered | 1                  | 1 = all registered, 0 = not all registered                              |
| addresses     | 4 or 20 (x length) | If is registered, left-padded 4-byte integers; otherwise, eth addresses |

#### non-address[]:

| field  | size (bytes) | Description              |
| ------ | ------------ | ------------------------ |
| length | 1            | Size of array            |
| items  | (variable)   | All items (concatenated) |

#### address:

| field         | size (bytes) | Description                                                       |
| ------------- | ------------ | ----------------------------------------------------------------- |
| is-registered | 1            | 1 = registered, 0 = not registered                                |
| address       | 4 or 20      | If registered, left-padded 4-byte integer; otherwise, eth address |

 * @module Byte-Serialization
 */
import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
type PrimativeType = string | number | boolean | BigNumber;
type PrimativeOrPrimativeArray = PrimativeType | PrimativeType[];
export declare const getAddressIndex: (address: string, signerOrProvider: Signer | Provider) => Promise<number>;
/**
  to use:
  
  ```js
  const mySerializeParamsFunction = argSerializerConstructor("rpcurl")
  mySerializeParamsFunction(["4","5", "6"])
  ```
*/
export declare const argSerializerConstructor: (arbProvider: Provider) => ((params: PrimativeOrPrimativeArray[]) => Promise<Uint8Array>);
/**
 * @param params array of serializable types to
 * @param addressToIndex optional getter of address index registered in table
 */
export declare const serializeParams: (params: PrimativeOrPrimativeArray[], addressToIndex?: (address: string) => Promise<number>) => Promise<Uint8Array>;
export {};
