import type { Hex } from "viem"
import type { ArkivClient } from "../../clients/baseClient"
import type { TxParams } from "../../types"
import { opsToTxData, sendArkivTransaction } from "../../utils/arkivTransactions"

/**
 * Parameters for the deleteEntity function.
 * - entityKey: The key of the entity to delete.
 */
export type DeleteEntityParameters = {
  entityKey: Hex
}

/**
 * Return type for the deleteEntity function.
 * - entityKey: The key of the entity.
 * - txHash: The transaction hash.
 */
export type DeleteEntityReturnType = {
  entityKey: Hex
  txHash: string
}

export async function deleteEntity(
  client: ArkivClient,
  data: DeleteEntityParameters,
  txParams?: TxParams,
): Promise<DeleteEntityReturnType> {
  console.debug("deleteEntity", data)
  const txData = opsToTxData({ deletes: [data] })
  const receipt = await sendArkivTransaction(client, txData, txParams)

  console.debug("Receipt from deleteEntity", receipt)

  return {
    txHash: receipt.transactionHash,
    entityKey: data.entityKey,
  }
}
