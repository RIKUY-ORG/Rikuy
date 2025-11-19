import type { Hex } from "viem"
import type { ArkivClient } from "../../clients/baseClient"
import type { TxParams } from "../../types"
import { opsToTxData, sendArkivTransaction } from "../../utils/arkivTransactions"

/**
 * Parameters for the extendEntity function.
 * - entityKey: The key of the entity to extend.
 * - expiresIn: The expires in of the entity in seconds.
 */
export type ExtendEntityParameters = {
  entityKey: Hex
  expiresIn: number
}

/**
 * Return type for the extendEntity function.
 * - entityKey: The key of the entity.
 * - txHash: The transaction hash.
 */
export type ExtendEntityReturnType = {
  entityKey: Hex
  txHash: string
}

export async function extendEntity(
  client: ArkivClient,
  data: ExtendEntityParameters,
  txParams?: TxParams,
): Promise<ExtendEntityReturnType> {
  console.debug("extendEntity", data)
  const txData = opsToTxData({ extensions: [data] })
  const receipt = await sendArkivTransaction(client, txData, txParams)

  console.debug("Receipt from extendEntity", receipt)

  return {
    txHash: receipt.transactionHash,
    entityKey: receipt.logs[0].topics[1] as Hex,
  }
}
