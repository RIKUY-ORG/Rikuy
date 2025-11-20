import { type Hex, toBytes, toHex, toRlp } from "viem"
import type { ChangeOwnershipParameters } from "../actions/wallet/changeOwnership"
import type { CreateEntityParameters } from "../actions/wallet/createEntity"
import type { DeleteEntityParameters } from "../actions/wallet/deleteEntity"
import type { ExtendEntityParameters } from "../actions/wallet/extendEntity"
import type { UpdateEntityParameters } from "../actions/wallet/updateEntity"
import type { ArkivClient } from "../clients/baseClient"
import type { WalletArkivClient } from "../clients/createWalletClient"
import { ARKIV_ADDRESS, BLOCK_TIME } from "../consts"
import type { TxParams } from "../types"
import { compress } from "./compression"

export function opsToTxData({
  creates,
  updates,
  deletes,
  extensions,
  ownershipChanges,
}: {
  creates?: CreateEntityParameters[]
  updates?: UpdateEntityParameters[]
  deletes?: DeleteEntityParameters[]
  extensions?: ExtendEntityParameters[]
  ownershipChanges?: ChangeOwnershipParameters[]
}) {
  function formatAttributes<T extends string | number | bigint | boolean>(attribute: {
    key: string
    value: T
  }): [Hex, Hex] {
    return [toHex(attribute.key), toHex(attribute.value)]
  }

  const payload = [
    //creates
    (creates ?? []).map((item) => [
      toHex(item.expiresIn / BLOCK_TIME),
      toHex(item.contentType),
      toHex(item.payload),
      item.attributes
        .filter((attribute) => typeof attribute.value === "string")
        .map(formatAttributes),
      item.attributes
        .filter((attribute) => typeof attribute.value === "number")
        .map(formatAttributes),
    ]),
    //updates
    (updates ?? []).map((item) => [
      item.entityKey,
      toHex(item.contentType),
      toHex(item.expiresIn / BLOCK_TIME),
      toHex(item.payload),
      item.attributes
        .filter((attribute) => typeof attribute.value === "string")
        .map(formatAttributes),
      item.attributes
        .filter((attribute) => typeof attribute.value === "number")
        .map(formatAttributes),
    ]),
    //deletes
    (deletes ?? []).map((item) => item.entityKey),
    //extends
    (extensions ?? []).map((item) => [item.entityKey, toHex(item.expiresIn / BLOCK_TIME)]),
    //ownershipChanges TODO
    (ownershipChanges ?? []).map((item) => [item.entityKey, item.newOwner]),
  ]

  console.debug("txData to send as RLP", payload, payload.length)

  return toRlp(payload)
}

export async function sendArkivTransaction(client: ArkivClient, data: Hex, txParams?: TxParams) {
  if (!client.account) throw new Error("Account required")
  const walletClient = client as WalletArkivClient

  console.debug("Sending transaction", {
    account: client.account,
    chain: client.chain,
    to: ARKIV_ADDRESS,
    value: 0n,
    data,
    ...txParams,
  })

  const compressed = await compress(toBytes(data))
  const txHash = await walletClient.sendTransaction({
    account: client.account,
    chain: client.chain,
    to: ARKIV_ADDRESS,
    value: 0n,
    data: toHex(compressed),
    ...txParams,
  })

  const receipt = await walletClient.waitForTransactionReceipt({ hash: txHash })

  console.debug("Tx receipt", receipt)

  return receipt
}
