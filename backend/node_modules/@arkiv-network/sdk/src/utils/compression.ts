import { init, compress as zstdCompress, decompress as zstdDecompress } from "@bokuweb/zstd-wasm"

let initialized = false
export async function compress(data: Uint8Array): Promise<Uint8Array> {
  if (!initialized) {
    await init()
    initialized = true
  }
  console.debug(`Compressing data (size: ${data.length})`)
  const compressed = await zstdCompress(data)
  console.debug(`Compressed data (size: ${compressed.length})`)
  return new Uint8Array(compressed)
}

export async function decompress(data: Uint8Array): Promise<Uint8Array> {
  if (!initialized) {
    await init()
    initialized = true
  }
  return await zstdDecompress(data)
}
