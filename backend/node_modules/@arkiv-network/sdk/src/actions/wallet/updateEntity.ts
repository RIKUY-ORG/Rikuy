import type { Hex } from "viem"
import type { ArkivClient } from "../../clients/baseClient"
import type { Attribute, MimeType, TxParams } from "../../types"
import { opsToTxData, sendArkivTransaction } from "../../utils/arkivTransactions"

/**
 * Parameters for the updateEntity function.
 * - entityKey: The key of the entity to update.
 * - payload: The payload of the entity.
 * - attributes: The attributes of the entity.
 * - contentType: The content type of the entity.
 * - expiresIn: The expires in of the entity in seconds.
 */
export type UpdateEntityParameters = {
  entityKey: Hex
  payload: Uint8Array
  attributes: Attribute[]
  contentType: MimeType
  expiresIn: number
}

/**
 * Return type for the updateEntity function.
 * - entityKey: The key of the entity.
 * - txHash: The transaction hash.
 */
export type UpdateEntityReturnType = {
  entityKey: Hex
  txHash: string
}

export async function updateEntity(
  client: ArkivClient,
  data: UpdateEntityParameters,
  txParams?: TxParams,
): Promise<UpdateEntityReturnType> {
  console.debug("updateEntity", data)
  const txData = opsToTxData({ updates: [data] })
  const receipt = await sendArkivTransaction(client, txData, txParams)

  console.debug("Receipt from updateEntity", receipt)

  return {
    txHash: receipt.transactionHash,
    entityKey: receipt.logs[0].topics[1] as Hex,
  }
}
