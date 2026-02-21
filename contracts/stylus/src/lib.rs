#![cfg_attr(not(feature = "export-abi"), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use alloy_primitives::{Address, FixedBytes, Signed, Uint, U256};
use stylus_sdk::{
    alloy_sol_types::{sol, SolError},
    block,
    crypto::keccak,
    evm, msg,
    prelude::*,
    storage::{StorageBool, StorageFixedBytes, StorageI64, StorageMap, StorageU16, StorageU256, StorageU32, StorageU8},
};

// Errors only — events emitted via raw_log (alloy-sol-types 0.7.6 doesn't support event in sol!)
sol! {
    error NullifierAlreadyUsed(bytes32 nullifier);
    error ReportNotFound(bytes32 report_id);
    error ReportAlreadyResolved(bytes32 report_id);
    error InvalidCategory(uint16 category);
    error OutOfBoundsLocation(int64 latitude, int64 longitude);
    error Unauthorized();
    error DebugCheckpoint(uint8 step);
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
    admin: StorageFixedBytes<32>,
    reports: StorageMap<FixedBytes<32>, Report>,
    nullifiers_used: StorageMap<FixedBytes<32>, StorageBool>,
    commitments: StorageMap<FixedBytes<32>, StorageBool>,
    total_reports: StorageU256,
    report_ids: StorageMap<U256, StorageFixedBytes<32>>,
    min_lat: StorageI64,
    max_lat: StorageI64,
    min_lon: StorageI64,
    max_lon: StorageI64,
}

const MAX_CATEGORY: u16 = 4;

/// Helper: compute event topic signature at runtime
fn event_sig(sig: &[u8]) -> FixedBytes<32> {
    keccak(sig)
}

/// Helper: emit raw log with 2 topics (sig + 1 indexed)
fn emit1(sig: FixedBytes<32>, topic1: FixedBytes<32>, data: &[u8]) {
    evm::raw_log(&[sig, topic1], data).unwrap();
}

/// Helper: emit raw log with 3 topics (sig + 2 indexed)
fn emit2(sig: FixedBytes<32>, topic1: FixedBytes<32>, topic2: FixedBytes<32>, data: &[u8]) {
    evm::raw_log(&[sig, topic1, topic2], data).unwrap();
}

#[public]
impl AnonymousReport {
    pub fn initialize(&mut self, admin: Address) {
        let admin_bytes: FixedBytes<32> = FixedBytes::left_padding_from(admin.as_slice());
        self.admin.set(admin_bytes);

        // Set default Bolivia bounds
        self.min_lat.set(Signed::<64, 1>::try_from(-23_000_000_i64).unwrap());
        self.max_lat.set(Signed::<64, 1>::try_from(-9_500_000_i64).unwrap());
        self.min_lon.set(Signed::<64, 1>::try_from(-69_700_000_i64).unwrap());
        self.max_lon.set(Signed::<64, 1>::try_from(-57_400_000_i64).unwrap());
    }

    pub fn update_geographic_bounds(
        &mut self,
        min_lat: i64,
        max_lat: i64,
        min_lon: i64,
        max_lon: i64,
    ) -> Result<(), Vec<u8>> {
        self.only_admin()?;
        self.min_lat.set(Signed::<64, 1>::try_from(min_lat).unwrap_or(Signed::<64, 1>::ZERO));
        self.max_lat.set(Signed::<64, 1>::try_from(max_lat).unwrap_or(Signed::<64, 1>::ZERO));
        self.min_lon.set(Signed::<64, 1>::try_from(min_lon).unwrap_or(Signed::<64, 1>::ZERO));
        self.max_lon.set(Signed::<64, 1>::try_from(max_lon).unwrap_or(Signed::<64, 1>::ZERO));
        Ok(())
    }

    pub fn generate_commitment(
        &self,
        wallet: Address,
        salt: FixedBytes<32>,
        nonce: U256,
    ) -> FixedBytes<32> {
        let mut data = Vec::with_capacity(84);
        data.extend_from_slice(wallet.as_slice());
        data.extend_from_slice(salt.as_slice());
        data.extend_from_slice(&nonce.to_be_bytes::<32>());
        keccak(&data)
    }

    pub fn register_commitment(&mut self, commitment: FixedBytes<32>) -> Result<(), Vec<u8>> {
        self.only_admin()?;
        self.commitments.setter(commitment).set(true);
        let sig = event_sig(b"CommitmentRegistered(bytes32)");
        emit1(sig, commitment, &[]);
        Ok(())
    }

    pub fn is_commitment_registered(&self, commitment: FixedBytes<32>) -> bool {
        self.commitments.getter(commitment).get()
    }

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

        if category > MAX_CATEGORY {
            return Err(InvalidCategory { category }.abi_encode());
        }

        let bound_min_lat = self.min_lat.get().as_i64();
        let bound_max_lat = self.max_lat.get().as_i64();
        let bound_min_lon = self.min_lon.get().as_i64();
        let bound_max_lon = self.max_lon.get().as_i64();

        if latitude < bound_min_lat
            || latitude > bound_max_lat
            || longitude < bound_min_lon
            || longitude > bound_max_lon
        {
            return Err(OutOfBoundsLocation { latitude, longitude }.abi_encode());
        }

        if self.nullifiers_used.getter(nullifier).get() {
            return Err(NullifierAlreadyUsed { nullifier }.abi_encode());
        }

        self.nullifiers_used.setter(nullifier).set(true);

        let ts_u64 = block::timestamp();
        let ts_u32 = ts_u64 as u32;

        let lat_signed = Signed::<64, 1>::try_from(latitude).unwrap_or(Signed::<64, 1>::ZERO);
        let lon_signed = Signed::<64, 1>::try_from(longitude).unwrap_or(Signed::<64, 1>::ZERO);

        let mut report = self.reports.setter(report_id);
        report.commitment.set(commitment);
        report.content_hash.set(content_hash);
        report.category.set(Uint::<16, 1>::from(category));
        report.latitude.set(lat_signed);
        report.longitude.set(lon_signed);
        report.timestamp.set(Uint::<32, 1>::from(ts_u32));
        report.validation_score.set(Uint::<8, 1>::ZERO);
        report.is_resolved.set(false);
        report.ai_validated.set(ai_validated);
        report.exists.set(true);

        let index = self.total_reports.get();
        self.report_ids.setter(index).set(report_id);
        self.total_reports.set(index + U256::from(1));

        // Emit ReportStored event
        let sig = event_sig(b"ReportStored(bytes32,bytes32,bytes32,uint16,int64,int64,uint32)");
        
        // Use a fixed array to avoid Vec allocator panics
        let mut data = [0u8; 160];
        
        // 1. content_hash (bytes32) - offset 0..32
        data[0..32].copy_from_slice(content_hash.as_slice());
        
        // 2. category (uint16) padded to 32 bytes - offset 32..64
        data[32..64].copy_from_slice(&U256::from(category).to_be_bytes::<32>());
        
        // 3. latitude (int64) sign-extended to 32 bytes - offset 64..96
        // Cast i64 to i256 for proper sign extension in two's complement
        let lat_i256 = Signed::<256, 4>::try_from(latitude).unwrap_or(Signed::<256, 4>::ZERO);
        data[64..96].copy_from_slice(&lat_i256.to_be_bytes::<32>());
        
        // 4. longitude (int64) sign-extended to 32 bytes - offset 96..128
        let lon_i256 = Signed::<256, 4>::try_from(longitude).unwrap_or(Signed::<256, 4>::ZERO);
        data[96..128].copy_from_slice(&lon_i256.to_be_bytes::<32>());
        
        // 5. timestamp (uint32) padded to 32 bytes - offset 128..160
        data[128..160].copy_from_slice(&U256::from(ts_u32).to_be_bytes::<32>());
        
        emit2(sig, report_id, commitment, &data);

        Ok(())
    }

    pub fn increment_validation(&mut self, report_id: FixedBytes<32>) -> Result<u8, Vec<u8>> {
        self.only_admin()?;

        let report = self.reports.getter(report_id);
        if !report.exists.get() {
            return Err(ReportNotFound { report_id }.abi_encode());
        }
        if report.is_resolved.get() {
            return Err(ReportAlreadyResolved { report_id }.abi_encode());
        }

        let current: u8 = report.validation_score.get().to::<u8>();
        if current < 255 {
            let new_score = current + 1;
            self.reports.setter(report_id).validation_score.set(Uint::<8, 1>::from(new_score));
            let sig = event_sig(b"ReportValidated(bytes32,uint8)");
            let mut data = [0u8; 32];
            data[31] = new_score;
            emit1(sig, report_id, &data);
            Ok(new_score)
        } else {
            Ok(255)
        }
    }

    pub fn resolve_report(&mut self, report_id: FixedBytes<32>) -> Result<(), Vec<u8>> {
        self.only_admin()?;

        let report = self.reports.getter(report_id);
        if !report.exists.get() {
            return Err(ReportNotFound { report_id }.abi_encode());
        }
        if report.is_resolved.get() {
            return Err(ReportAlreadyResolved { report_id }.abi_encode());
        }

        self.reports.setter(report_id).is_resolved.set(true);
        let sig = event_sig(b"ReportResolved(bytes32)");
        emit1(sig, report_id, &[]);
        Ok(())
    }

    // =========================================================================
    // QUERIES
    // =========================================================================

    pub fn get_report_content_hash(&self, report_id: FixedBytes<32>) -> FixedBytes<32> {
        self.reports.getter(report_id).content_hash.get()
    }

    pub fn get_report_category(&self, report_id: FixedBytes<32>) -> u16 {
        self.reports.getter(report_id).category.get().to::<u16>()
    }

    pub fn get_report_location(&self, report_id: FixedBytes<32>) -> (i64, i64) {
        let report = self.reports.getter(report_id);
        let lat: i64 = report.latitude.get().as_i64();
        let lon: i64 = report.longitude.get().as_i64();
        (lat, lon)
    }

    pub fn get_report_score(&self, report_id: FixedBytes<32>) -> u8 {
        self.reports.getter(report_id).validation_score.get().to::<u8>()
    }

    pub fn is_report_resolved(&self, report_id: FixedBytes<32>) -> bool {
        self.reports.getter(report_id).is_resolved.get()
    }

    pub fn report_exists(&self, report_id: FixedBytes<32>) -> bool {
        self.reports.getter(report_id).exists.get()
    }

    pub fn is_nullifier_used(&self, nullifier: FixedBytes<32>) -> bool {
        self.nullifiers_used.getter(nullifier).get()
    }

    pub fn get_total_reports(&self) -> U256 {
        self.total_reports.get()
    }

    pub fn get_report_id_by_index(&self, index: U256) -> FixedBytes<32> {
        self.report_ids.getter(index).get()
    }

    pub fn verify_report_integrity(
        &self,
        report_id: FixedBytes<32>,
        content_hash: FixedBytes<32>,
    ) -> bool {
        let stored = self.reports.getter(report_id).content_hash.get();
        stored == content_hash
    }

    pub fn is_ai_validated(&self, report_id: FixedBytes<32>) -> bool {
        self.reports.getter(report_id).ai_validated.get()
    }

    pub fn get_report_timestamp(&self, report_id: FixedBytes<32>) -> u32 {
        self.reports.getter(report_id).timestamp.get().to::<u32>()
    }

    pub fn get_report_commitment(&self, report_id: FixedBytes<32>) -> FixedBytes<32> {
        self.reports.getter(report_id).commitment.get()
    }
}

impl AnonymousReport {
    fn only_admin(&self) -> Result<(), Vec<u8>> {
        let caller = msg::sender();
        let caller_bytes: FixedBytes<32> = FixedBytes::left_padding_from(caller.as_slice());
        if caller_bytes != self.admin.get() {
            return Err(Unauthorized {}.abi_encode());
        }
        Ok(())
    }
}
