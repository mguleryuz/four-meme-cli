# Four Meme CLI

A command-line interface for creating and buying tokens on four.meme platform.

## Features

- Authenticate with four.meme using Sign In With Ethereum (SIWE)
- Upload token images
- Create tokens on four.meme
- Automatically buy tokens with multiple wallets
- Interactive command-line interface

## Prerequisites

- Node.js (v18+)
- Bun runtime
- BSC account with BNB for token creation and purchases

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/four-meme-cli.git
cd four-meme-cli

# Install dependencies
bun install

# Build the CLI
bun run build

# Link for global usage (optional)
npm link
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Wallet Configuration
PRIMARY_WALLET_PRIVATE_KEY=xxx...xxx

# Multiple buyer wallets (add as many as needed)
BUYER_WALLET_1_PRIVATE_KEY=xxx...xxx
BUYER_WALLET_2_PRIVATE_KEY=xxx...xxx

# Network Configuration
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_CHAIN_ID=56

# Four.meme Configuration
FACTORY_ADDRESS=0x5c952063c7fc8610FFDB798152D69F0B9550762b

# Logging Configuration
LOG_LEVEL=info
```

## Usage

### Create a Token

```bash
# Interactive mode
four-meme create-token

# With command-line arguments
four-meme create-token \
  --name "My Token" \
  --symbol "MTK" \
  --total-supply 1000000 \
  --image path/to/logo.png \
  --buy \
  --buy-amount 0.1
```

### Available Options

| Option | Description |
|--------|-------------|
| `-n, --name` | Token name |
| `-s, --symbol` | Token symbol |
| `-d, --decimals` | Token decimals (default: 18) |
| `-t, --total-supply` | Token total supply |
| `--description` | Token description |
| `--telegram` | Telegram URL |
| `--twitter` | Twitter URL |
| `--website` | Website URL |
| `-i, --image` | Path to token image |
| `-b, --buy` | Buy tokens after creation |
| `--buy-amount` | Amount to buy in BNB (default: 0.1) |
| `-v, --verbose` | Enable verbose logging |

## License

MIT

## Disclaimer

This tool is not affiliated with four.meme. Use at your own risk.
