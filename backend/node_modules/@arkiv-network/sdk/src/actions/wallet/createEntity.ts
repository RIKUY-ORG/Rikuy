import type { Hex } from "viem"
import type { ArkivClient } from "../../clients/baseClient"
import type { Attribute, MimeType, TxParams } from "../../types"
import { opsToTxData, sendArkivTransaction } from "../../utils/arkivTransactions"

/**
 * Parameters for the createEntity function.
 * - payload: The payload of the entity.
 * - attributes: The attributes of the entity.
 * - contentType: The content type of the entity.
 * - expiresIn: The expires in of the entity in seconds.
 */
export type CreateEntityParameters = {
  payload: Uint8Array
  attributes: Attribute[]
  contentType: MimeType
  expiresIn: number
}

/**
 * Return type for the createEntity function.
 * - entityKey: The key of the entity.
 * - txHash: The transaction hash.
 */
export type CreateEntityReturnType = {
  entityKey: Hex
  txHash: string
}

export async function createEntity(
  client: ArkivClient,
  data: CreateEntityParameters,
  txParams?: TxParams,
): Promise<CreateEntityReturnType> {
  console.debug("createEntity", data)
  const txData = opsToTxData({ creates: [data] })
  const receipt = await sendArkivTransaction(client, txData, txParams)

  console.debug("Receipt from createEntity", receipt)

  return {
    txHash: receipt.transactionHash,
    entityKey: receipt.logs[0].topics[1] as Hex,
  }
}
