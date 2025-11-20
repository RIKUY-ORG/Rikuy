import type { Account, Chain, Client, Hex, PublicActions, Transport } from "viem"
import { getBlockTiming } from "../../actions/public/getBlockTiming"
import { getEntity } from "../../actions/public/getEntity"
import { getEntityCount } from "../../actions/public/getEntityCount"
import { query } from "../../actions/public/query"
import { subscribeEntityEvents } from "../../actions/public/subscribeEntityEvents"
import { QueryBuilder } from "../../query/queryBuilder"
import type { Entity } from "../../types/entity"
import type {
  OnEntityCreatedEvent,
  OnEntityDeletedEvent,
  OnEntityExpiredEvent,
  OnEntityExpiresInExtendedEvent,
  OnEntityUpdatedEvent,
} from "../../types/events"

export type PublicArkivActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
> = Pick<
  PublicActions<transport, chain, account>,
  | "getBalance"
  | "getBlock"
  | "getBlockNumber"
  | "getChainId"
  | "getLogs"
  | "getTransaction"
  | "getTransactionCount"
  | "getTransactionReceipt"
  | "waitForTransactionReceipt"
  | "watchEvent"
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
   * const entity = await client.getEntity("0x123")
   * // {
   * //   key: "0x123",
   * //   value: "0x123",
   * // }
   */
  getEntity: (key: Hex) => Promise<Entity>

  /**
   * Returns a QueryBuilder instance for building and executing queries.
   * The QueryBuilder object follows the Builder pattern, allowing you to chain methods to build a query and then execute it.
   *
   * - Docs: https://docs.golemdb.io/ts-sdk/actions/public/query
   *
   * @returns A QueryBuilder instance for building and executing queries. {@link QueryBuilder}
   *
   * @example
   * import { createPublicClient, http } from 'arkiv'
   * import { kaolin } from 'arkiv/chains'
   *
   * const client = createPublicClient({
   *   chain: kaolin,
   *   transport: http(),
   * })
   * const query = client.buildQuery()
   * const entities = await query.where("key", "=", "value").ownedBy("0x123").fetch()
   *
   */
  buildQuery: () => QueryBuilder

  /**
   * Returns a QueryResult instance for fetching the results of a raw query.
   * @returns A QueryResult instance for fetching the results of a raw query. {@link QueryResult}
   *
   * @example
   * import { createPublicClient, http } from 'arkiv'
   * import { kaolin } from 'arkiv/chains'
   *
   * const client = createPublicClient({
   *   chain: kaolin,
   *   transport: http(),
   * })
   * const queryResult = client.query('key = value && $owner = 0x123')
   *
   */
  query: (query: string) => Promise<Entity[]>

  /**
   * Returns the number of entities in the DBChain.
   * @returns The number of entities in the DBChain. {@link number}
   *
   * @example
   * import { createPublicClient, http } from 'arkiv'
   * import { kaolin } from 'arkiv/chains'
   *
   * const client = createPublicClient({
   *   chain: kaolin,
   *   transport: http(),
   * })
   * const entityCount = await client.getEntityCount()
   * // entityCount = 0
   */
  getEntityCount: () => Promise<number>

  /**
   * Returns the current block timing.
   * @returns The current block timing. {@link GetBlockTimingReturnType}
   *
   * @example
   * import { createPublicClient, http } from 'arkiv'
   * import { kaolin } from 'arkiv/chains'
   *
   * const client = createPublicClient({
   *   chain: kaolin,
   *   transport: http(),
   * })
   * const blockTiming = await client.getBlockTiming()
   * // {
   * //   currentBlock: 10n, // block number
   * //   currentBlockTime: 1234567890, // block timestamp
   * //   blockDuration: 2, // in seconds
   * // }
   */
  getBlockTiming: () => Promise<{
    currentBlock: bigint
    currentBlockTime: number
    blockDuration: number
  }>

  subscribeEntityEvents: (
    {
      onError,
      onEntityCreated,
      onEntityUpdated,
      onEntityDeleted,
      onEntityExpiresInExtended,
    }: {
      onError?: (error: Error) => void
      onEntityCreated?: (event: OnEntityCreatedEvent) => void
      onEntityUpdated?: (event: OnEntityUpdatedEvent) => void
      onEntityDeleted?: (event: OnEntityDeletedEvent) => void
      onEntityExpired?: (event: OnEntityExpiredEvent) => void
      onEntityExpiresInExtended?: (event: OnEntityExpiresInExtendedEvent) => void
    },
    pollingInterval?: number,
    fromBlock?: bigint,
  ) => Promise<() => void>
}

export function publicArkivActions<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
>(client: Client<transport, chain, account>) {
  return {
    getEntity: (key: Hex) => getEntity(client, key),
    query: (rawQuery: string) => query(client, rawQuery),
    buildQuery: () => new QueryBuilder(client),
    getBlockTiming: () => getBlockTiming(client),
    getEntityCount: () => getEntityCount(client),
    subscribeEntityEvents: (
      {
        onError,
        onEntityCreated,
        onEntityUpdated,
        onEntityDeleted,
        onEntityExpired,
        onEntityExpiresInExtended,
      }: {
        onError?: (error: Error) => void
        onEntityCreated?: (event: OnEntityCreatedEvent) => void
        onEntityUpdated?: (event: OnEntityUpdatedEvent) => void
        onEntityDeleted?: (event: OnEntityDeletedEvent) => void
        onEntityExpired?: (event: OnEntityExpiredEvent) => void
        onEntityExpiresInExtended?: (event: OnEntityExpiresInExtendedEvent) => void
      },
      pollingInterval?: number,
      fromBlock?: bigint,
    ) =>
      subscribeEntityEvents(
        client,
        {
          onError,
          onEntityCreated,
          onEntityUpdated,
          onEntityDeleted,
          onEntityExpired,
          onEntityExpiresInExtended,
        },
        pollingInterval,
        fromBlock,
      ),
  }
}
