export class NoMoreResultsError extends Error {
  constructor() {
    super("No more results")
  }
}

export class NoCursorOrLimitError extends Error {
  constructor() {
    super("Cursor and limit must be defined to fetch next")
  }
}

export class OffsetCannotBeLessThanZeroError extends Error {
  constructor() {
    super("Offset cannot be less than 0")
  }
}

export class NoEntityFoundError extends Error {
  constructor() {
    super("No entity found")
  }
}
