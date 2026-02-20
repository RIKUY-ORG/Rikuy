#!/bin/bash
set -e

echo "=== Rikuy Dev Environment Setup ==="

# Install cargo-stylus (Rust is available via devcontainer feature)
echo "Installing cargo-stylus..."
cargo install cargo-stylus 2>/dev/null || echo "cargo-stylus already installed or cargo not available"

# Add wasm32 target if not present
rustup target add wasm32-unknown-unknown 2>/dev/null || true

# Install Foundry dependencies (git submodules)
echo "Installing Foundry dependencies..."
forge install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend && pnpm install && cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend && pnpm install && cd ..

# Copy .env.example if .env doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env 2>/dev/null || echo "No .env.example found"
fi

# Verify toolchain
echo ""
echo "=== Toolchain Verification ==="
echo "Node: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Rust: $(rustc --version)"
echo "Forge: $(forge --version)"
echo "cargo-stylus: $(cargo stylus --version 2>/dev/null || echo 'not installed')"
echo ""
echo "=== Ready! ==="
