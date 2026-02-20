FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash && \
    /root/.foundry/bin/foundryup

ENV PATH="/root/.foundry/bin:${PATH}"

# Install pnpm globally (Rust and cargo-stylus are installed via devcontainer features)
RUN npm install -g pnpm

# Working directory
WORKDIR /workspace
