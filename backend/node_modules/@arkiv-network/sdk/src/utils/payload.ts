import { toBytes } from "viem"

export function jsonToPayload(json: object): Uint8Array {
  return toBytes(JSON.stringify(json))
}

export function stringToPayload(data: string): Uint8Array {
  return toBytes(data)
}
