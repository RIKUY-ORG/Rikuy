import type { ArkivClient } from "../../clients/baseClient"
import { QueryBuilder } from "../../query/queryBuilder"

export async function buildQuery(client: ArkivClient) {
  return new QueryBuilder(client)
}
