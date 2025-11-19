import { bytesToString, type Hex } from "viem"
import type { MimeType } from "../types"
import type { Attribute } from "./attributes"

export class Entity {
  key: Hex
  owner: Hex
  expiresAtBlock: bigint
  payload: Uint8Array
  attributes: Attribute[]
  contentType: MimeType

  constructor(
    key: Hex,
    contentType: MimeType,
    owner: Hex,
    expiresAtBlock: bigint,
    payload: Uint8Array,
    attributes: Attribute[],
  ) {
    this.key = key
    this.owner = owner
    this.expiresAtBlock = expiresAtBlock
    this.payload = payload
    this.attributes = attributes
    this.contentType = contentType
  }

  toText(): string {
    return bytesToString(this.payload)
  }

  toJson(): any {
    return JSON.parse(bytesToString(this.payload))
  }
}
