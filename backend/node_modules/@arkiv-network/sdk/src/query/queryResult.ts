import type { Entity } from "../types/entity"
import { NoCursorOrLimitError, NoMoreResultsError } from "./errors"
import type { QueryBuilder } from "./queryBuilder"

export class QueryResult {
  entities: Entity[]
  private _endOfIteration: boolean
  private _cursor: string | undefined
  private _limit: number | undefined
  private _validAtBlock: bigint | undefined
  private _queryBuilder: QueryBuilder

  // Public getters for internal state
  get queryBuilder(): QueryBuilder {
    return this._queryBuilder
  }

  get cursor(): string | undefined {
    return this._cursor
  }

  constructor(
    entities: Entity[],
    queryBuilder: QueryBuilder,
    cursor: string | undefined,
    limit: number | undefined,
    validAtBlock: bigint | undefined,
  ) {
    this.entities = entities
    this._queryBuilder = queryBuilder
    this._endOfIteration = !limit || entities.length < limit
    this._cursor = cursor
    this._limit = limit
    this._validAtBlock = validAtBlock
  }

  async next() {
    if (this._cursor === undefined || this._limit === undefined) {
      throw new NoCursorOrLimitError()
    }
    if (this._endOfIteration) {
      throw new NoMoreResultsError()
    }
    this._queryBuilder.cursor(this._cursor)
    const result = await this._queryBuilder.fetch()
    this.entities = result.entities
    // Update the query builder reference
    this._queryBuilder = result.queryBuilder
    // Check if we've reached the end (no more cursor or we got fewer entities than limit)
    this._endOfIteration = !result.cursor || result.entities.length < this._limit
    // Update the cursor
    this._cursor = result.cursor

    // TODO check current block height and if it is not too old
    console.debug("Current block height for next page: ", this._validAtBlock)
  }

  hasNextPage() {
    return !this._endOfIteration
  }
}
