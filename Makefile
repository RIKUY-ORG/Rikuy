# Rikuy Build System — Solidity + Stylus dual-language contracts

.PHONY: build-sol build-stylus build-all check-stylus deploy-devnode clean help

# ============================================================================
# SOLIDITY (Foundry)
# ============================================================================

build-sol:
	@echo "=== Building Solidity contracts ==="
	forge build

test-sol:
	@echo "=== Testing Solidity contracts ==="
	forge test -vvv

# ============================================================================
# STYLUS (Rust/WASM)
# ============================================================================

build-stylus:
	@echo "=== Building Stylus contracts ==="
	cd contracts/stylus && cargo build --release --target wasm32-unknown-unknown

check-stylus:
	@echo "=== Checking Stylus contracts ==="
	cd contracts/stylus && cargo stylus check

export-abi-stylus:
	@echo "=== Exporting Stylus ABI ==="
	cd contracts/stylus && cargo stylus export-abi

deploy-stylus:
	@echo "=== Deploying Stylus contract ==="
	@test -n "$(RPC)" || (echo "Usage: make deploy-stylus RPC=http://localhost:8449 KEY=0x..." && exit 1)
	@test -n "$(KEY)" || (echo "Usage: make deploy-stylus RPC=http://localhost:8449 KEY=0x..." && exit 1)
	cd contracts/stylus && cargo stylus deploy --endpoint=$(RPC) --private-key=$(KEY)

# ============================================================================
# COMBINED
# ============================================================================

build-all: build-sol build-stylus
	@echo "=== All contracts built ==="

# Deploy all to devnode (Nitro local)
deploy-devnode:
	@echo "=== Deploying to Nitro Devnode ==="
	forge script script/DeployAllL3.s.sol --rpc-url http://localhost:8547 --broadcast
	cd contracts/stylus && cargo stylus deploy --endpoint=http://localhost:8547 --private-key=$(KEY)

# Deploy all to Rikuy Chain L3
deploy-l3:
	@echo "=== Deploying to Rikuy Chain L3 ==="
	forge script script/DeployAllL3.s.sol --rpc-url $(RIKUY_CHAIN_RPC_URL) --broadcast
	cd contracts/stylus && cargo stylus deploy --endpoint=$(RIKUY_CHAIN_RPC_URL) --private-key=$(KEY)

# ============================================================================
# UTILITY
# ============================================================================

clean:
	@echo "=== Cleaning build artifacts ==="
	forge clean
	cd contracts/stylus && cargo clean

help:
	@echo "Rikuy Build System"
	@echo ""
	@echo "Solidity:"
	@echo "  make build-sol       - Build Solidity contracts with Foundry"
	@echo "  make test-sol        - Run Solidity tests"
	@echo ""
	@echo "Stylus:"
	@echo "  make build-stylus    - Build Rust/WASM contracts"
	@echo "  make check-stylus    - Verify Stylus contracts are deployable"
	@echo "  make export-abi-stylus - Export Stylus ABI"
	@echo "  make deploy-stylus RPC=<url> KEY=<privkey> - Deploy Stylus contract"
	@echo ""
	@echo "Combined:"
	@echo "  make build-all       - Build everything"
	@echo "  make deploy-devnode KEY=<privkey> - Deploy to local devnode"
	@echo "  make deploy-l3 KEY=<privkey>      - Deploy to Rikuy Chain L3"
	@echo "  make clean           - Clean all build artifacts"
