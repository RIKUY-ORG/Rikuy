// Export all public APIs

export type {
  Account,
  Address,
  Chain,
  Hex,
  PublicClientConfig,
  RpcSchema,
  Transport,
} from "viem"
// Re-export commonly used viem types for convenience
export { http, toBytes, toHex, toRlp, webSocket } from "viem"
export type { ArkivClient } from "./clients/baseClient"
export type { PublicArkivClient } from "./clients/createPublicClient"
export { createPublicClient } from "./clients/createPublicClient"
export type { WalletArkivClient } from "./clients/createWalletClient"
export { createWalletClient } from "./clients/createWalletClient"
export type { Attribute } from "./types/attributes"
export type { Entity } from "./types/entity"
export type { ArkivRpcSchema } from "./types/rpcSchema"
