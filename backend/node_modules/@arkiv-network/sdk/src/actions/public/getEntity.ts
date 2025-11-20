import type { Hex } from "viem"
import type { ArkivClient } from "../../clients/baseClient"
import { NoEntityFoundError } from "../../query/errors"
import { entityFromRpcResult } from "../../utils/entities"

export async function getEntity(client: ArkivClient, key: Hex) {
  const result = await client.request({
    method: "arkiv_query",
    params: [`$key = ${key}`],
  })
  console.debug("GetEntity result", result)

  if (!result.data) {
    throw new NoEntityFoundError()
  }

  return entityFromRpcResult(result.data[0])
}
