import type { Account, Chain, Client, RpcSchema, Transport } from "viem"
import type { ArkivRpcSchema } from "../types/rpcSchema"

export type ArkivClient<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  accountOrAddress extends Account | undefined = Account | undefined,
  rpcSchema extends RpcSchema | undefined = ArkivRpcSchema,
> = Client<transport, chain, accountOrAddress, rpcSchema>
