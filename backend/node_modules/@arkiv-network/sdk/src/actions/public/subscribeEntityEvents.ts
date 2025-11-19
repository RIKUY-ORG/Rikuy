import { decodeEventLog, parseAbi, toHex } from "viem"
import type { ArkivClient } from "../../clients/baseClient"
import type { PublicArkivClient } from "../../clients/createPublicClient"
import type {
  OnEntityCreatedEvent,
  OnEntityDeletedEvent,
  OnEntityExpiredEvent,
  OnEntityExpiresInExtendedEvent,
  OnEntityUpdatedEvent,
} from "../../types/events"

export const arkivABI = parseAbi([
  "event ArkivEntityCreated(uint256 indexed entityKey, address indexed ownerAddress, uint256 expirationBlock, uint256 cost)",
  "event ArkivEntityUpdated(uint256 indexed entityKey, address indexed ownerAddress, uint256 oldExpirationBlock, uint256 newExpirationBlock, uint256 cost)",
  "event ArkivEntityExpired(uint256 indexed entityKey, address indexed ownerAddress)",
  "event ArkivEntityDeleted(uint256 indexed entityKey, address indexed ownerAddress)",
  "event ArkivEntityBTLExtended(uint256 indexed entityKey, address indexed ownerAddress, uint256 oldExpirationBlock, uint256 newExpirationBlock, uint256 cost)",
])

export async function subscribeEntityEvents(
  client: ArkivClient,
  {
    onError,
    onEntityCreated,
    onEntityUpdated,
    onEntityDeleted,
    onEntityExpired,
    onEntityExpiresInExtended,
  }: {
    onError: ((error: Error) => void) | undefined
    onEntityCreated?: ((event: OnEntityCreatedEvent) => void) | undefined
    onEntityUpdated?: ((event: OnEntityUpdatedEvent) => void) | undefined
    onEntityDeleted?: ((event: OnEntityDeletedEvent) => void) | undefined
    onEntityExpired?: ((event: OnEntityExpiredEvent) => void) | undefined
    onEntityExpiresInExtended?: ((event: OnEntityExpiresInExtendedEvent) => void) | undefined
  },
  pollingInterval?: number,
  fromBlock?: bigint,
): Promise<() => void> {
  const unsubscribe = (client as PublicArkivClient).watchEvent({
    pollingInterval: pollingInterval ?? 1000,
    fromBlock: fromBlock ?? 0n,
    events: arkivABI,
    onLogs: (logs) => {
      console.debug("logs from subscribeEntityEvents", logs)
      for (const log of logs) {
        const event = decodeEventLog({
          abi: arkivABI,
          topics: log.topics,
          data: log.data,
        })
        console.debug("event from subscribeEntityEvents", event)
        switch (event.eventName) {
          case "ArkivEntityCreated":
            onEntityCreated?.({
              entityKey: toHex(event.args.entityKey, { size: 32 }),
              owner: event.args.ownerAddress,
              expirationBlock: Number(event.args.expirationBlock),
              cost: event.args.cost,
            })
            break
          case "ArkivEntityUpdated":
            onEntityUpdated?.({
              entityKey: toHex(event.args.entityKey, { size: 32 }),
              owner: event.args.ownerAddress,
              oldExpirationBlock: Number(event.args.oldExpirationBlock),
              newExpirationBlock: Number(event.args.newExpirationBlock),
              cost: event.args.cost,
            })
            break
          case "ArkivEntityDeleted":
            onEntityDeleted?.({
              entityKey: toHex(event.args.entityKey, { size: 32 }),
              owner: event.args.ownerAddress,
            })
            break
          case "ArkivEntityBTLExtended":
            onEntityExpiresInExtended?.({
              entityKey: toHex(event.args.entityKey, { size: 32 }),
              owner: event.args.ownerAddress,
              oldExpirationBlock: Number(event.args.oldExpirationBlock),
              newExpirationBlock: Number(event.args.newExpirationBlock),
              cost: event.args.cost,
            })
            break
          case "ArkivEntityExpired":
            onEntityExpired?.({
              entityKey: toHex(event.args.entityKey, { size: 32 }),
              owner: event.args.ownerAddress,
            })
            break
          default:
            console.warn("unknown event from subscribeEntityEvents", event)
            break
        }
      }
    },
    onError: (error) => {
      console.error("error from subscribeEntityEvents", error)
      onError?.(error)
    },
  })

  return unsubscribe
}
