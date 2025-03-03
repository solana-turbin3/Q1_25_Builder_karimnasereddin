# Sagent - Solana Agent 🤖🔗

![Solana](https://img.shields.io/badge/Solana-3C3C3D?style=for-the-badge&logo=solana&logoColor=white)
![Anchor](https://img.shields.io/badge/Anchor-0.30.1-blue)

Sagent is your autonomous Solana on-chain assistant that executes commands and provides access to decentralized functionality through a smart contract interface.

## Key Features ✨
- On-chain command execution
- Integration with Raydium CPMM and locking protocols
- Token metadata management
- Extensible architecture for adding new capabilities

## Prerequisites 🛠️
- Rust 1.79.0
- Anchor CLI 0.30.1
- Node.js (npm 10.2.3+)
- Solana CLI 1.18.18

## Installation & Setup ⚡

```bash
# Clone repository
git clone https://github.com/solana-turbin3/Q1_25_Builder_karimnasereddin.git
cd Q1_25_Builder_karimnasereddin/capstone/sagent

# Install dependencies
npm install

# Configure Solana environment
solana config set --url localhost

# Build the program
anchor build

# Run tests
anchor test
```

## Project Structure 📂
sagent/
├── programs/ # Core program logic
├── tests/ # Typescript test suite
├── Anchor.toml # Anchor configuration
└── Cargo.toml # Rust dependencies


## Dependencies 📦
| Package              | Version     |
|----------------------|-------------|
| anchor-lang          | 0.30.1      |
| anchor-spl           | 0.30.1      |
| mpl-token-metadata   | 5.1.0       |
| raydium-cpmm-cpi     | anchor-0.30.1 branch |

## Test Cases

## Accounts Preview