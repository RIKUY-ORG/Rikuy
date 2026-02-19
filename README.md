<div align="center">

# Rikuy
**The Anonymous, Zero-Knowledge Whistleblowing Network**

[![Built on Arbitrum](https://img.shields.io/badge/Built_on-Arbitrum_Orbit-2D374B?style=for-the-badge&logo=arbitrum)](https://arbitrum.io/)
[![Powered by Stylus](https://img.shields.io/badge/Smart_Contracts-Rust_(Stylus)-red?style=for-the-badge&logo=rust)](https://docs.arbitrum.io/stylus/stylus-gentle-introduction)
[![ZK Identity](https://img.shields.io/badge/Identity-Reclaim_Protocol-blueviolet?style=for-the-badge)](https://reclaimprotocol.org/)
[![Auth](https://img.shields.io/badge/Auth-Privy-blue?style=for-the-badge)](https://privy.io/)

*Empowering citizens to report corruption safely, securely, and immutably.*

</div>

---

## The Problem

In many developing nations, specifically in Latin America, reporting corruption or public infrastructure failures is a dangerous and bureaucratic nightmare. According to Transparency International's Corruption Perceptions Index (CPI), countries like **Bolivia (ranked 140/180 with a score of 26/100 in 2024)** and **Mexico (score of 31/100 in 2023)** are among the most negatively perceived in the world regarding public sector corruption.

Citizens in these environments face:
1. **Fear of Retaliation:** Whistleblowers are often exposed, leading to political or physical retaliation.
2. **Bureaucratic Friction:** Filing formal transparency reports (e.g., *Ley 974* in Bolivia) requires physical presence, identifiable paperwork, and endless negotiation.
3. **Data Manipulation:** Evidence of corruption often "disappears" from centralized government or police servers before investigations conclude.

## The Solution: Rikuy

**Rikuy** (Quechua for "To See" / "To Observe") is a trustless, decentralized platform that guarantees **100% anonymity** for whistleblowers while ensuring **100% Sybil-resistance** (one real citizen = one report capability). 

By leveraging Zero-Knowledge Proofs, an Arbitrum L3 AppChain, and AI pre-validation, Rikuy creates an immutable ledger of civic reports that cannot be censored, altered, or traced back to the user.

---

## Key Features

* **Absolute Anonymity via ZK-Proofs:** We use **Reclaim Protocol** to verify a citizen's official digital identity (Ciudadanía Digital) without ever extracting their name, ID number, or personal data. 
* **Zero-Gas, Seamless UX:** Powered by **Privy** embedded wallets and a custom backend Relayer, citizens never see a crypto wallet, never buy tokens, and never pay gas fees. 
* **AI-Powered Triaging:** To prevent blockchain spam, **Google Gemini AI** pre-validates all photographic evidence and descriptions before allowing on-chain submission.
* **High-Performance Infrastructure:** Smart contracts are written in **Rust** using **Arbitrum Stylus** and deployed on our own **Arbitrum Orbit L3 AppChain** for sub-cent transaction costs and maximum throughput.
* **Legal Validity:** Reports are hashed and stored on **IPFS**, generating an immutable cryptographic timeline valid for legal audits under anti-corruption frameworks.

---

## Documentation & Business Resources

For a deeper dive into the business strategy, user adoption, and public policy frameworks surrounding Rikuy, please refer to the following documents:

- 📄 **[Business Model (PDF)](./docs/RIKUY_BusinessModel.pdf)**: Detailed overview of the project's sustainability and go-to-market strategy.
- 📄 **[One-Pager for Users (PDF)](./docs/RIKUY_OnePager_Usuarios.pdf)**: High-level summary of the citizen experience and benefits.
- 🏛️ **[Policy Brief](./docs/policy_brief.md)**: Document aimed at political candidates outlining Rikuy as a solution for modernizing citizen participation and transparency.

---

## System Architecture & User Flow

Rikuy completely abstracts Web3 complexities from the user. Here is the *Happy Path* for a citizen:

1. **Onboarding:** User logs in with Email/Google via **Privy** (invisible embedded wallet created).
2. **ZK Verification:** User logs into the government portal. **Reclaim Protocol** generates a cryptographic proof of their citizenship. Rikuy registers this proof on-chain via our Relayer.
3. **Reporting:** User uploads a photo and description of the incident (e.g., public office extortion).
4. **AI Validation:** Our Node.js backend uses **Gemini AI** to detect if the photo matches the description and filters out spam/NSFW content.
5. **Immutable Storage:** The payload is uploaded to **IPFS** via Pinata.
6. **Gasless Submission:** The backend **Relayer** constructs a transaction with a unique ZK Nullifier (to prevent double-reporting) and pays the L3 gas fees.
7. **On-Chain Execution:** The **Rust (Stylus)** contract safely logs the report's metadata and IPFS hash on our Arbitrum L3.

---

## Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Blockchain** | Arbitrum Orbit (Local L3) | Custom AppChain for ultra-low costs and isolated state. |
| **Smart Contracts** | Rust (Stylus) & Solidity | High-performance WASM contracts combined with stable ERC1967 Proxies. |
| **Identity / ZK** | Reclaim Protocol | Zero-Knowledge proofs for official government ID verification. |
| **Authentication** | Privy | Web2-style login mapped to secure Embedded Wallets. |
| **Storage** | IPFS (Pinata) | Decentralized, immutable storage for photographic evidence. |
| **Artificial Intelligence** | Google Gemini Vision | Automated spam prevention and evidence context validation. |
| **Backend** | Node.js, Express, Ethers.js | API Gateway and Gas Relayer. |

---

## Getting Started (Local Development)

To run the entire Rikuy ecosystem locally, you will need Node.js `v20+`, Rust, Foundry, and Docker.

### 1. Start the Arbitrum L3 Chain
```bash
# Clone the Orbit Setup script and start the local nitro node
cd orbit-setup-script
docker-compose up -d
```

### 2. Deploy Smart Contracts
```bash
cd contracts
# Deploy the Rust Stylus contract
cd stylus && cargo stylus deploy --private-key <YOUR_KEY> -e http://localhost:8449
# Deploy Solidity Proxies & Registry
cd .. && forge script script/DeployLocal.s.sol:DeployLocal --rpc-url http://localhost:8449 --broadcast
```

### 3. Start the Backend Relayer
```bash
cd backend
npm install
# Ensure .env contains the newly deployed contract addresses and API Keys (Pinata, Gemini)
npm run dev
```

### 4. Start the Frontend
```bash
cd frontend
npm install
# Set VITE_PRIVY_APP_ID in .env
npm run dev
```

---

## Business Impact & Hackathon Roadmap

Rikuy is designed not just as a technical showcase, but as a deployable public good. 
* **Target Audience:** Municipal governments, Anti-corruption NGOs, and Investigative Journalists.
* **Next Steps:** 
  - Complete the Community Validation module (upvoting/downvoting verified reports).
  - Launch a Governance DAO for report resolution.
  - Pilot testing in Santa Cruz de la Sierra, Bolivia.

---
<div align="center">
<i>Built for a more transparent future.</i>
</div>
