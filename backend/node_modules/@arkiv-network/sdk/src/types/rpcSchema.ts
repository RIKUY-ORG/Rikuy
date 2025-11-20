import type { Hex, PublicRpcSchema } from "viem"
import type { MimeType } from "./mimeTypes"

export type RpcEntity = {
  key: Hex
  contentType: MimeType
  value: string
  expiresAt: bigint
  owner: Hex
  stringAttributes?: [{ key: string; value: string }]
  numericAttributes?: [{ key: string; value: number }]
}

export type RpcQueryOptions = {
  atBlock?: number
  includeData?: RpcIncludeData
  resultsPerPage?: number
  cursor?: string
}

export type RpcIncludeData = {
  key: boolean
  attributes: boolean
  payload: boolean
  contentType: boolean
  expiration: boolean
  owner: boolean
}

export type ArkivRpcSchema = [
  {
    Method: "golembase_getStorageValue"
    Parameters?: [entityId: Hex]
    ReturnType: string
  },
  {
    Method: "arkiv_query"
    Parameters?: [query: string, queryOptions?: RpcQueryOptions]
    ReturnType: {
      data: [RpcEntity]
      blockNumber: bigint
      cursor: string
    }
  },
  {
    Method: "arkiv_getBlockTiming"
    Parameters?: []
    ReturnType: {
      current_block: bigint
      current_block_time: number
      duration: number
    }
  },
  {
    Method: "arkiv_getEntityCount"
    Parameters?: []
    ReturnType: number
  },
]

export type PublicArkivRpcSchema = [...PublicRpcSchema, ...ArkivRpcSchema]
