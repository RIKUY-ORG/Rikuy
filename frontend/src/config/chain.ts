import { defineChain } from "viem";

export const rikuyChain = defineChain({
    id: 313370,
    name: "Rikuy Chain",
    network: "rikuy-chain",
    nativeCurrency: {
        decimals: 18,
        name: "Ether",
        symbol: "ETH",
    },
    rpcUrls: {
        default: {
            http: ["http://localhost:8449"],
        },
        public: {
            http: ["http://localhost:8449"],
        },
    },
    blockExplorers: {
        default: { name: "Explorer",url: "http://localhost:4000" }, // Placeholder local explorer
    },
    testnet: true,
});
