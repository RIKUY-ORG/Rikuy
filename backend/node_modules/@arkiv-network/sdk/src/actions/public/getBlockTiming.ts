import type { ArkivClient } from "../../clients/baseClient"

export type GetBlockTimingReturnType = {
  currentBlock: bigint
  currentBlockTime: number
  blockDuration: number
}

export async function getBlockTiming(client: ArkivClient) {
  const blockTiming = await client.request({
    method: "arkiv_getBlockTiming",
    params: [],
  })
  console.debug("Block timing", blockTiming)
  return {
    currentBlock: blockTiming.current_block,
    currentBlockTime: blockTiming.current_block_time,
    blockDuration: blockTiming.duration,
  }
}
