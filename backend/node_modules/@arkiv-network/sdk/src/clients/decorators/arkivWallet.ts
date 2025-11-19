import type { Account, Chain, Client, Transport, WalletActions } from "viem"
import type {
  ChangeOwnershipParameters,
  ChangeOwnershipReturnType,
} from "../../actions/wallet/changeOwnership"
import { changeOwnership } from "../../actions/wallet/changeOwnership"
import {
  type CreateEntityParameters,
  type CreateEntityReturnType,
  createEntity,
} from "../../actions/wallet/createEntity"
import type {
  DeleteEntityParameters,
  DeleteEntityReturnType,
} from "../../actions/wallet/deleteEntity"
import { deleteEntity } from "../../actions/wallet/deleteEntity"
import type {
  ExtendEntityParameters,
  ExtendEntityReturnType,
} from "../../actions/wallet/extendEntity"
import { extendEntity } from "../../actions/wallet/extendEntity"
import type {
  MutateEntitiesParameters,
  MutateEntitiesReturnType,
} from "../../actions/wallet/mutateEntities"
import { mutateEntities } from "../../actions/wallet/mutateEntities"
import type {
  UpdateEntityParameters,
  UpdateEntityReturnType,
} from "../../actions/wallet/updateEntity"
import { updateEntity } from "../../actions/wallet/updateEntity"
import type { Entity, TxParams } from "../../types"
import type { PublicArkivActions } from "./arkivPublic"

export type WalletArkivActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
> = PublicArkivActions<transport, chain, account> &
  Pick<
    WalletActions<chain, account>,
    | "sendTransaction"
    | "sendTransactionSync"
    | "sendRawTransaction"
    | "sendRawTransactionSync"
    | "signMessage"
    | "signTransaction"
  > & {
    /**
     * Returns the entity with the given key.
     *
     * - Docs: https://docs.golemdb.io/ts-sdk/actions/public/getEntity
     *
     * @param args - {entityKey}
     * @returns The entity with the given key. {@link Entity}
     *
     * @example
     * import { createPublicClient, http } from 'arkiv'
     * import { kaolin } from 'arkiv/chains'
     *
     * const client = createPublicClient({
     *   chain: kaolin,
     *   transport: http(),
     * })
     * const { entityKey, txHash } = await client.createEntity({
     *   payload: toBytes(JSON.stringify({ entity: { entityType: "testType", entityId: "testId" } })),
     *   attributes: [{ key: "testKey", value: "testValue" }],
     *   expiresIn: 1000,
     * })
     * console.log("entityKey", entityKey)
     * console.log("txHash", txHash)
     * // {
     * //   entityKey: "0x123",
     * //   txHash: "0x123",
     * // }
     */
    createEntity: (
      data: CreateEntityParameters,
      txParams?: TxParams,
    ) => Promise<CreateEntityReturnType>

    /**
     * Updates the entity with the given key.
     *
     * - Docs: https://docs.golemdb.io/ts-sdk/actions/wallet/updateEntity
     * - JSON-RPC Methods: [`golembase_updateEntity`](https://docs.golemdb.io/dev/json-rpc-api/#golembase_updateEntity)
     *
     * @param args - {entityKey, data}
     * @returns The entity with the given key. {@link Entity}
     *
     * @example
     * import { createWalletClient, http } from 'arkiv'
     * import { kaolin } from 'arkiv/chains'
     *
     * const client = createWalletClient({
     *   chain: kaolin,
     *   transport: http(),
     * })
     */
    updateEntity: (
      data: UpdateEntityParameters,
      txParams?: TxParams,
    ) => Promise<UpdateEntityReturnType>

    /**
     * Deletes the entity with the given key.
     *
     * - Docs: https://docs.golemdb.io/ts-sdk/actions/wallet/deleteEntity
     * - JSON-RPC Methods: [`golembase_deleteEntity`](https://docs.golemdb.io/dev/json-rpc-api/#golembase_deleteEntity)
     *
     * @param args - {entityKey}
     * @returns The entity with the given key. {@link Entity}
     *
     * @example
     * import { createWalletClient, http } from 'arkiv'
     * import { kaolin } from 'arkiv/chains'
     *
     * const client = createWalletClient({
     *   chain: kaolin,
     *   transport: http(),
     * })
     * const { entityKey, txHash } = await client.deleteEntity({ entityKey: "0x123" })
     * console.log("entityKey", entityKey)
     * console.log("txHash", txHash)
     * // {
     * //   entityKey: "0x123",
     * //   txHash: "0x123",
     * // }
     */
    deleteEntity: (
      data: DeleteEntityParameters,
      txParams?: TxParams,
    ) => Promise<DeleteEntityReturnType>

    /**
     * Extends the entity with the given key.
     *
     * - Docs: https://docs.golemdb.io/ts-sdk/actions/wallet/extendEntity
     * - JSON-RPC Methods: [`golembase_extendEntity`](https://docs.golemdb.io/dev/json-rpc-api/#golembase_extendEntity)
     *
     * @param args - {entityKey, data}
     * @returns The entity with the given key. {@link Entity}
     *
     * @example
     * import { createWalletClient, http } from 'arkiv'
     * import { kaolin } from 'arkiv/chains'
     *
     * const client = createWalletClient({
     *   chain: kaolin,
     *   transport: http(),
     * })
     * const { entityKey, txHash } = await client.extendEntity("0x123", {
     *   expiresIn: 1000,
     * })
     * console.log("entityKey", entityKey)
     * console.log("txHash", txHash)
     * // {
     * //   entityKey: "0x123",
     * //   txHash: "0x123",
     * // }
     */
    extendEntity: (
      data: ExtendEntityParameters,
      txParams?: TxParams,
    ) => Promise<ExtendEntityReturnType>

    /**
     * Changes the ownership of the entity with the given address.
     *
     * - Docs: https://docs.golemdb.io/ts-sdk/actions/wallet/changeOwnership
     * - JSON-RPC Methods: [`golembase_ownershipChange`](https://docs.golemdb.io/dev/json-rpc-api/#golembase_ownershipChange)
     *
     * @param args - {entityKey, newOwner}
     * @returns The entity with the given address. {@link Entity}
     */
    changeOwnership: (
      data: ChangeOwnershipParameters,
      txParams?: TxParams,
    ) => Promise<ChangeOwnershipReturnType>

    /**
     * Mutates the entities with the given keys.
     *
     * - Docs: https://docs.golemdb.io/ts-sdk/actions/wallet/mutateEntities
     * - JSON-RPC Methods: [`golembase_mutateEntities`](https://docs.golemdb.io/dev/json-rpc-api/#golembase_mutateEntities)
     *
     * @param args - {data}
     * @returns The entity with the given key. {@link Entity}
     *
     * @example
     * import { createWalletClient, http } from 'arkiv'
     * import { kaolin } from 'arkiv/chains'
     *
     * const client = createWalletClient({
     *   chain: kaolin,
     *   transport: http(),
     * })
     * const { entityKey, txHash } = await client.mutateEntities({
     *   creates: [{
     *     payload: toBytes(JSON.stringify({ entity: { entityType: "testType", entityId: "testId" } })),
     *     attriubutes: [{ key: "testKey", value: "testValue" }],
     *     expiresIn: 1000,
     *   }],
     *   updates: [{
     *     entityKey: "0x123",
     *     payload: toBytes(JSON.stringify({ entity: { entityType: "testType", entityId: "testId" } })),
     *     attributes: [{ key: "testKey", value: "testValue" }],
     *     expiresIn: 1000,
     *   }],
     *   deletes: [{
     *     entityKey: "0x321",
     *   }],
     *   extensions: [{
     *     entityKey: "0x1234",
     *     expiresIn: 1000,
     *   }],
     * })
     * console.log("entityKey", entityKey)
     * console.log("txHash", txHash)
     * // {
     * //   entityKey: "0x123",
     * //   txHash: "0x123",
     * // }
     */
    mutateEntities: (
      data: MutateEntitiesParameters,
      txParams?: TxParams,
    ) => Promise<MutateEntitiesReturnType>
  }

export function walletArkivActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(client: Client<transport, chain, account>) {
  return {
    createEntity: (data: CreateEntityParameters, txParams?: TxParams) =>
      createEntity(client, data, txParams),
    updateEntity: (data: UpdateEntityParameters, txParams?: TxParams) =>
      updateEntity(client, data, txParams),
    deleteEntity: (data: DeleteEntityParameters, txParams?: TxParams) =>
      deleteEntity(client, data, txParams),
    extendEntity: (data: ExtendEntityParameters, txParams?: TxParams) =>
      extendEntity(client, data, txParams),
    changeOwnership: (data: ChangeOwnershipParameters, txParams?: TxParams) =>
      changeOwnership(client, data, txParams),
    mutateEntities: (data: MutateEntitiesParameters, txParams?: TxParams) =>
      mutateEntities(client, data, txParams),
  }
}
