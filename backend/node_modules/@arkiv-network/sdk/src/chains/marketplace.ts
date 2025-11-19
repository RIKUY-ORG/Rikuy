import { defineChain } from "viem"

export const marketplace = defineChain({
  id: 60138453027,
  name: "Marketplace",
  network: "marketplace",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://marketplace.hoodi.arkiv.network/rpc"],
      webSocket: ["wss://marketplace.hoodi.arkiv.network/rpc/ws"],
    },
  },
  blockExplorers: {
    default: {
      name: "Marketplace Arkiv Explorer",
      url: "https://explorer.marketplace.hoodi.arkiv.network",
      apiUrl: "https://explorer.marketplace.hoodi.arkiv.network/api",
    },
  },
  testnet: true,
})
