import type { Hex, TransactionReceipt } from "viem"
import type { ArkivClient } from "../../clients/baseClient"
import type { TxParams } from "../../types"
import { opsToTxData, sendArkivTransaction } from "../../utils/arkivTransactions"
import type { CreateEntityParameters } from "./createEntity"
import type { DeleteEntityParameters } from "./deleteEntity"
import type { ExtendEntityParameters } from "./extendEntity"
import type { UpdateEntityParameters } from "./updateEntity"

/**
 * Parameters for the mutateEntities function.
 * - creates: The creates to perform.
 * - updates: The updates to perform.
 * - deletes: The deletes to perform.
 * - extensions: The extensions to perform.
 */
export type MutateEntitiesParameters = {
  creates?: CreateEntityParameters[]
  updates?: UpdateEntityParameters[]
  deletes?: DeleteEntityParameters[]
  extensions?: ExtendEntityParameters[]
}

function parseReceipt(receipt: TransactionReceipt, params: MutateEntitiesParameters) {
  const createdEntities: Hex[] = []
  const updatedEntities: Hex[] = []
  const deletedEntities: Hex[] = []
  const extendedEntities: Hex[] = []
  const totalCreates = params.creates?.length ?? 0
  const totalUpdates = params.updates?.length ?? 0
  const totalDeletes = params.deletes?.length ?? 0

  // iterate over all logs and parse the event
  // each odd log is the interested ones, logs goes in order like: creates, deleted, updates, extends
  for (let i = 0; i < receipt.logs.length; i++) {
    const log = receipt.logs[i]
    if (i % 2 === 1) continue

    const index = i / 2
    if (index < totalCreates) {
      createdEntities.push(log.topics[1] as Hex)
    } else if (index < totalCreates + totalDeletes) {
      deletedEntities.push(log.topics[1] as Hex)
    } else if (index < totalCreates + totalUpdates + totalDeletes) {
      updatedEntities.push(log.topics[1] as Hex)
    } else {
      extendedEntities.push(log.topics[1] as Hex)
    }
  }

  return { createdEntities, updatedEntities, deletedEntities, extendedEntities }
}

/**
 * Return type for the mutateEntities function.
 * - txHash: The transaction hash.
 * - createdEntities: The keys of the created entities.
 * - updatedEntities: The keys of the updated entities.
 * - deletedEntities: The keys of the deleted entities.
 * - extendedEntities: The keys of the extended entities.
 */
export type MutateEntitiesReturnType = {
  txHash: string
  createdEntities: Hex[]
  updatedEntities: Hex[]
  deletedEntities: Hex[]
  extendedEntities: Hex[]
}
export async function mutateEntities(
  client: ArkivClient,
  data: MutateEntitiesParameters,
  txParams?: TxParams,
): Promise<MutateEntitiesReturnType> {
  if (!data.creates && !data.updates && !data.deletes && !data.extensions) {
    throw new Error("No operations to perform")
  }

  const txData = opsToTxData({
    creates: data.creates ?? [],
    updates: data.updates ?? [],
    deletes: data.deletes ?? [],
    extensions: data.extensions ?? [],
  })

  const receipt = await sendArkivTransaction(client, txData, txParams)

  console.debug("Receipt from mutateEntities", receipt)

  const { createdEntities, updatedEntities, deletedEntities, extendedEntities } = parseReceipt(
    receipt,
    data,
  )
  return {
    txHash: receipt.transactionHash,
    createdEntities,
    updatedEntities,
    deletedEntities,
    extendedEntities,
  }
}
