export type TxParams =
  | {
      gas?: bigint
      nonce?: number
      gasPrice?: bigint
      maxFeePerGas?: never
      maxPriorityFeePerGas?: never
    }
  | {
      gas?: bigint
      nonce?: number
      maxFeePerGas?: bigint
      maxPriorityFeePerGas?: bigint
      gasPrice?: never
    }
