import type { ArkivClient } from "../../clients/baseClient"
import { entityFromRpcResult } from "../../utils/entities"

export async function query(client: ArkivClient, query: string) {
  const result = await client.request({
    method: "arkiv_query",
    params: [query],
  })

  const entities = await Promise.all(result.data.map((entity) => entityFromRpcResult(entity)))

  return entities
}
