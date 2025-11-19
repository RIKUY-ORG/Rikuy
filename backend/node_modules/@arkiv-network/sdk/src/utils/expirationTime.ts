import { BLOCK_TIME } from "../consts"

export const ExpirationTime = {
  fromSeconds: (seconds: number) => seconds,
  fromMinutes: (minutes: number) => minutes * 60,
  fromHours: (hours: number) => hours * 60 * 60,
  fromDays: (days: number) => days * 24 * 60 * 60,
  fromWeeks: (weeks: number) => weeks * 7 * 24 * 60 * 60,
  fromMonths: (months: number) => months * 30 * 24 * 60 * 60,
  fromYears: (years: number) => years * 365 * 24 * 60 * 60,
  fromBlocks: (blocks: number) => blocks * BLOCK_TIME,
  fromDate: (date: Date) => Math.floor(date.getTime() / 1000) - Math.floor(Date.now() / 1000),
}
