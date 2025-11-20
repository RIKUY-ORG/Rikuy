import type { ArkivClient } from "../../clients/baseClient"

export async function getEntityCount(client: ArkivClient) {
  const count = await client.request({
    method: "arkiv_getEntityCount",
    params: [],
  })

  return count
}
