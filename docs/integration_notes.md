# Rikuy Protocol Integration Notes (V2.1 - Optimization)

This document outlines the architectural upgrades made to the protocol. These upgrades significantly improve safety and modularity and need to be supported by the integration layers.

## 1. Pausability (Emergency Break) Added

We have added OpenZeppelin's `PausableUpgradeable` to `RikuyCoreV2.sol`. This is a non-breaking but critical security feature.

### Impact on Backend Relayer
The relayer needs to handle potential `EnforcedPause()` reverts when executing `createReport`, `registerCitizen`, `validateReport`, or `resolveReport`.
- **Action:** If the smart contract is paused, the Relayer should queue requests gracefully and return an HTTP `503 Service Unavailable` with a clear message like "Protocol currently paused for maintenance or security check. Report saved locally and will be bridged soon."

### Impact on Frontend
- **Action:** Read the `paused()` state from `RikuyCoreV2`. If `true`, show a banner to the user indicating standard maintenance to avoid failing TXs and support tickets.

## 2. Dynamic Verification Thresholds

The `VERIFICATION_THRESHOLD` in `RikuyCoreV2` is no longer a hardcoded literal (`5`). It is now a state variable `verificationThreshold`.

### Impact on Integrations
- Queries to get the required votes to verify a report must now do a `.call()` to `verificationThreshold()` instead of assuming it's 5. This allows the DAO/Admin to adapt the threshold dynamically if there's high or low network participation.

## 3. Parametrized Geographic Bounds (Stylus)

The bounding box for valid reports (formerly strictly limited to Bolivia directly in the Rust code) is now stored in state. 

### Impact on Upgrades
- If we deploy Rikuy in another nation (e.g., Mexico), we no longer need to re-compile the WASM binary. We simply call `update_geographic_bounds()` as the Admin.
- **Frontend Action:** Ensure the UI map limits (via Mapbox or Leaflet bounds) still match the current limits configured in the contract, ideally fetching them or keeping configuration synced.
