import type {
  Account,
  Address,
  Chain,
  Client,
  ParseAccount,
  Prettify,
  PublicClientConfig,
  RpcSchema,
  Transport,
} from "viem"
import { createClient, publicActions } from "viem"
import type { ArkivRpcSchema } from "../types/rpcSchema"
import { type PublicArkivActions, publicArkivActions } from "./decorators/arkivPublic"

export type PublicArkivClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = ArkivRpcSchema,
> = Prettify<
  Client<transport, chain, accountOrAddress, rpcSchema, PublicArkivActions<transport, chain>>
>

/**
 * Creates a Public Client with a given [Transport](https://viem.sh/docs/clients/intro) configured for a [Chain](https://viem.sh/docs/clients/chains).
 *
 * - Docs: https://docs.golemdb.io/ts-sdk/clients/public
 *
 * A Public Client is an interface to "public" [Ethereum JSON-RPC API](https://ethereum.org/en/developers/docs/apis/json-rpc/), [Arkiv JSON-RPC API](https://docs.golemdb.io/json-rpc/), and [Kaolin JSON-RPC API](https://kaolin.holesky.golemdb.io/rpc) methods such as retrieving block numbers, transactions, reading from smart contracts, etc through [Public Actions](/docs/actions/public/introduction).
 *
 * @param config - {@link PublicClientConfig}
 * @returns A Arkiv Public Client. {@link PublicArkivClient}
 *
 * @example
 * import { createPublicClient, http } from 'arkiv'
 * import { kaolin } from 'arkiv/chains'
 *
 * const client = createPublicClient({
 *   chain: kaolin,
 *   transport: http(),
 * })
 */
export function createPublicClient<
  transport extends Transport,
  chain extends Chain | undefined = undefined,
  accountOrAddress extends Account | Address | undefined = undefined,
  rpcSchema extends RpcSchema | undefined = ArkivRpcSchema,
>(
  parameters: PublicClientConfig<transport, chain, accountOrAddress, rpcSchema>,
): PublicArkivClient<transport, chain, ParseAccount<accountOrAddress>, rpcSchema> {
  const { key = "public", name = "Public Client" } = parameters
  const client = createClient({
    ...parameters,
    key,
    name,
  })

  return client.extend(publicArkivActions).extend(publicActions) as unknown as PublicArkivClient<
    transport,
    chain,
    ParseAccount<accountOrAddress>,
    rpcSchema
  >
}
