#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

#[global_allocator]
static ALLOC: mini_alloc::MiniAlloc = mini_alloc::MiniAlloc::INIT;

use alloc::vec::Vec;
use alloy_primitives::{Address, FixedBytes, U256};
use stylus_sdk::{
    alloy_sol_types::sol,
    crypto::keccak,
    evm, msg,
    prelude::*,
    storage::{StorageBool, StorageFixedBytes, StorageI64, StorageMap, StorageU16, StorageU256, StorageU32, StorageU8},
};

// Solidity ABI definitions for cross-contract calls and events
sol! {
    event ReportStored(
        bytes32 indexed report_id,
        bytes32 indexed commitment,
        bytes32 content_hash,
        uint16 category,
        int64 latitude,
        int64 longitude,
        uint32 timestamp
    );

    event ReportValidated(
        bytes32 indexed report_id,
        uint8 new_score
    );

    event ReportResolved(
        bytes32 indexed report_id
    );

    event CommitmentRegistered(
        bytes32 indexed commitment
    );

    error NullifierAlreadyUsed(bytes32 nullifier);
    error ReportNotFound(bytes32 report_id);
    error ReportAlreadyResolved(bytes32 report_id);
    error InvalidCategory(uint16 category);
    error OutOfBoundsLocation(int64 latitude, int64 longitude);
    error Unauthorized();
}

/// Report data stored on-chain
#[storage]
pub struct Report {
    commitment: StorageFixedBytes<32>,
    content_hash: StorageFixedBytes<32>,
    category: StorageU16,
    latitude: StorageI64,
    longitude: StorageI64,
    timestamp: StorageU32,
    validation_score: StorageU8,
    is_resolved: StorageBool,
    ai_validated: StorageBool,
    exists: StorageBool,
}

/// Main contract: Anonymous Report system for Rikuy
#[storage]
#[entrypoint]
pub struct AnonymousReport {
    /// Admin address (deployer / RikuyCoreV2)
    admin: StorageFixedBytes<32>,
    /// Reports indexed by report_id (bytes32)
    reports: StorageMap<FixedBytes<32>, Report>,
    /// Nullifiers that have been used (prevents double-reporting per session)
    nullifiers_used: StorageMap<FixedBytes<32>, StorageBool>,
    /// Registered commitments (anonymous identities)
    commitments: StorageMap<FixedBytes<32>, StorageBool>,
    /// Total reports counter
    total_reports: StorageU256,
    /// Report IDs by index (for enumeration)
    report_ids: StorageMap<U256, StorageFixedBytes<32>>,
}

/// Bolivia geographic bounds (coordinates * 1_000_000 for integer precision)
const BOLIVIA_LAT_MIN: i64 = -23_000_000; // South border
const BOLIVIA_LAT_MAX: i64 = -9_500_000;  // North border (Brazil)
const BOLIVIA_LON_MIN: i64 = -69_700_000; // West border (Chile)
const BOLIVIA_LON_MAX: i64 = -57_400_000; // East border (Brazil)

/// Maximum category ID
const MAX_CATEGORY: u16 = 4;

#[public]
impl AnonymousReport {
    /// Initialize the contract with an admin address
    pub fn initialize(&mut self, admin: Address) {
        let admin_bytes: FixedBytes<32> = FixedBytes::left_padding_from(admin.as_slice());
        self.admin.set(admin_bytes);
    }

    // =========================================================================
    // ANONYMITY: Commitment generation and verification
    // =========================================================================

    /// Generate an anonymous commitment from wallet + salt + nonce
    /// This is a pure function — the commitment is computed on-chain via keccak256
    /// but the salt is secret (only the backend knows it), so the commitment
    /// cannot be traced back to the wallet address.
    pub fn generate_commitment(
        &self,
        wallet: Address,
        salt: FixedBytes<32>,
        nonce: U256,
    ) -> FixedBytes<32> {
        let mut data = Vec::with_capacity(84);
        data.extend_from_slice(wallet.as_slice()); // 20 bytes
        data.extend_from_slice(salt.as_slice());   // 32 bytes
        data.extend_from_slice(&nonce.to_be_bytes::<32>()); // 32 bytes
        FixedBytes::from_slice(&keccak(&data))
    }

    /// Register a commitment (called once per verified citizen)
    pub fn register_commitment(&mut self, commitment: FixedBytes<32>) -> Result<(), Vec<u8>> {
        self.only_admin()?;
        self.commitments.setter(commitment).set(true);
        evm::log(CommitmentRegistered { commitment });
        Ok(())
    }

    /// Check if a commitment is registered
    pub fn is_commitment_registered(&self, commitment: FixedBytes<32>) -> bool {
        self.commitments.get(commitment).get()
    }

    // =========================================================================
    // REPORTS: Store and query anonymous reports
    // =========================================================================

    /// Store an anonymous report on-chain
    /// Only callable by admin (RikuyCoreV2 / Relayer)
    pub fn store_report(
        &mut self,
        report_id: FixedBytes<32>,
        commitment: FixedBytes<32>,
        content_hash: FixedBytes<32>,
        nullifier: FixedBytes<32>,
        category: u16,
        latitude: i64,
        longitude: i64,
        ai_validated: bool,
    ) -> Result<(), Vec<u8>> {
        self.only_admin()?;

        // Validate category
        if category > MAX_CATEGORY {
            return Err(InvalidCategory { category }.encode());
        }

        // Validate geo-bounds (Bolivia)
        if latitude < BOLIVIA_LAT_MIN
            || latitude > BOLIVIA_LAT_MAX
            || longitude < BOLIVIA_LON_MIN
            || longitude > BOLIVIA_LON_MAX
        {
            return Err(OutOfBoundsLocation { latitude, longitude }.encode());
        }

        // Check nullifier not used
        if self.nullifiers_used.get(nullifier).get() {
            return Err(NullifierAlreadyUsed { nullifier }.encode());
        }

        // Mark nullifier as used
        self.nullifiers_used.setter(nullifier).set(true);

        // Store report
        let timestamp = U256::from(evm::block_timestamp());
        let ts_u32 = u32::try_from(timestamp).unwrap_or(0);

        let mut report = self.reports.setter(report_id);
        report.commitment.set(commitment);
        report.content_hash.set(content_hash);
        report.category.set(U256::from(category));
        report.latitude.set(U256::from_be_bytes(latitude.to_be_bytes().into()));
        report.longitude.set(U256::from_be_bytes(longitude.to_be_bytes().into()));
        report.timestamp.set(U256::from(ts_u32));
        report.validation_score.set(U256::ZERO);
        report.is_resolved.set(false);
        report.ai_validated.set(ai_validated);
        report.exists.set(true);

        // Track report ID for enumeration
        let index = self.total_reports.get();
        self.report_ids.setter(index).set(report_id);
        self.total_reports.set(index + U256::from(1));

        evm::log(ReportStored {
            report_id,
            commitment,
            content_hash,
            category,
            latitude,
            longitude,
            timestamp: ts_u32,
        });

        Ok(())
    }

    /// Increment validation score for a report (community upvote)
    pub fn increment_validation(&mut self, report_id: FixedBytes<32>) -> Result<u8, Vec<u8>> {
        self.only_admin()?;

        let report = self.reports.getter(report_id);
        if !report.exists.get() {
            return Err(ReportNotFound { report_id }.encode());
        }
        if report.is_resolved.get() {
            return Err(ReportAlreadyResolved { report_id }.encode());
        }

        let current = u8::try_from(report.validation_score.get()).unwrap_or(255);
        if current < 255 {
            let new_score = current + 1;
            self.reports.setter(report_id).validation_score.set(U256::from(new_score));
            evm::log(ReportValidated {
                report_id,
                new_score,
            });
            Ok(new_score)
        } else {
            Ok(255)
        }
    }

    /// Mark a report as resolved (government action)
    pub fn resolve_report(&mut self, report_id: FixedBytes<32>) -> Result<(), Vec<u8>> {
        self.only_admin()?;

        let report = self.reports.getter(report_id);
        if !report.exists.get() {
            return Err(ReportNotFound { report_id }.encode());
        }
        if report.is_resolved.get() {
            return Err(ReportAlreadyResolved { report_id }.encode());
        }

        self.reports.setter(report_id).is_resolved.set(true);
        evm::log(ReportResolved { report_id });
        Ok(())
    }

    // =========================================================================
    // QUERIES: Read report data
    // =========================================================================

    /// Get report content hash
    pub fn get_report_content_hash(&self, report_id: FixedBytes<32>) -> FixedBytes<32> {
        self.reports.getter(report_id).content_hash.get()
    }

    /// Get report category
    pub fn get_report_category(&self, report_id: FixedBytes<32>) -> u16 {
        u16::try_from(self.reports.getter(report_id).category.get()).unwrap_or(0)
    }

    /// Get report location (latitude, longitude)
    pub fn get_report_location(&self, report_id: FixedBytes<32>) -> (i64, i64) {
        let report = self.reports.getter(report_id);
        let lat_bytes: [u8; 32] = report.latitude.get().to_be_bytes();
        let lon_bytes: [u8; 32] = report.longitude.get().to_be_bytes();
        let lat = i64::from_be_bytes(lat_bytes[24..32].try_into().unwrap_or([0; 8]));
        let lon = i64::from_be_bytes(lon_bytes[24..32].try_into().unwrap_or([0; 8]));
        (lat, lon)
    }

    /// Get report validation score
    pub fn get_report_score(&self, report_id: FixedBytes<32>) -> u8 {
        u8::try_from(self.reports.getter(report_id).validation_score.get()).unwrap_or(0)
    }

    /// Check if report is resolved
    pub fn is_report_resolved(&self, report_id: FixedBytes<32>) -> bool {
        self.reports.getter(report_id).is_resolved.get()
    }

    /// Check if report exists
    pub fn report_exists(&self, report_id: FixedBytes<32>) -> bool {
        self.reports.getter(report_id).exists.get()
    }

    /// Check if a nullifier has been used
    pub fn is_nullifier_used(&self, nullifier: FixedBytes<32>) -> bool {
        self.nullifiers_used.get(nullifier).get()
    }

    /// Get total number of reports
    pub fn get_total_reports(&self) -> U256 {
        self.total_reports.get()
    }

    /// Get report ID by index (for enumeration)
    pub fn get_report_id_by_index(&self, index: U256) -> FixedBytes<32> {
        self.report_ids.get(index).get()
    }

    /// Verify report integrity — check that content_hash matches
    pub fn verify_report_integrity(
        &self,
        report_id: FixedBytes<32>,
        content_hash: FixedBytes<32>,
    ) -> bool {
        let stored = self.reports.getter(report_id).content_hash.get();
        stored == content_hash
    }

    /// Check if AI validated the report
    pub fn is_ai_validated(&self, report_id: FixedBytes<32>) -> bool {
        self.reports.getter(report_id).ai_validated.get()
    }

    /// Get report timestamp
    pub fn get_report_timestamp(&self, report_id: FixedBytes<32>) -> u32 {
        u32::try_from(self.reports.getter(report_id).timestamp.get()).unwrap_or(0)
    }

    /// Get report commitment (anonymous identity)
    pub fn get_report_commitment(&self, report_id: FixedBytes<32>) -> FixedBytes<32> {
        self.reports.getter(report_id).commitment.get()
    }
}

// =========================================================================
// INTERNAL: Access control helpers
// =========================================================================

impl AnonymousReport {
    fn only_admin(&self) -> Result<(), Vec<u8>> {
        let caller = msg::sender();
        let caller_bytes: FixedBytes<32> = FixedBytes::left_padding_from(caller.as_slice());
        if caller_bytes != self.admin.get() {
            return Err(Unauthorized {}.encode());
        }
        Ok(())
    }
}
