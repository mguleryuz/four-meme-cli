# Four Meme CLI - Technical Context

## Technology Stack

### Core Technologies

- **TypeScript**: Main programming language for type safety and developer experience
- **Node.js**: Runtime environment
- **Bun**: JavaScript/TypeScript runtime and package manager

### Frontend/CLI

- **Ink**: React-based CLI rendering library for interactive terminal UI
- **Commander**: Command-line interface framework
- **Inquirer**: Interactive command line user interfaces
- **Chalk**: Terminal string styling

### Blockchain Integration

- **Ethers.js**: Ethereum wallet and contract interactions
- **SIWE**: Sign-in with Ethereum implementation
- **BSC Network**: Binance Smart Chain interaction for token deployment

### API & Data

- **Axios**: HTTP client for API requests
- **form-data**: For handling multipart/form-data requests (image uploads)
- **dotenv**: Environment variable management
- **JSON Web Tokens**: For authentication token handling

### Image Processing

- **Sharp**: Image processing library for Node.js
- **browser-image-compression**: Image compression (referenced in four.meme code)

### Development Tools

- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework

## Development Environment

### Prerequisites

- Node.js (v18+)
- Bun runtime
- TypeScript

### Environment Variables

Required in `.env` file:

```
# Wallet Configuration
PRIMARY_WALLET_PRIVATE_KEY=xxx...xxx
# Multiple buyer wallets
BUYER_WALLET_1_PRIVATE_KEY=xxx...xxx
BUYER_WALLET_2_PRIVATE_KEY=xxx...xxx
# ... more as needed

# Network Configuration
BSC_RPC_URL=https://bsc-dataseed.binance.org/
BSC_CHAIN_ID=56

# Four.meme Configuration
FACTORY_ADDRESS=0x5c952063c7fc8610FFDB798152D69F0B9550762b
```

## API Integration

The CLI interacts with four.meme APIs:

1. **Authentication Endpoints**

   - Nonce Generation: `https://four.meme/meme-api/v1/private/user/nonce/generate`
   - Login: `https://four.meme/meme-api/v1/private/user/login/dex`
   - User Info: `https://four.meme/meme-api/v1/private/user/info`

2. **Token Creation Endpoints**

   - Image Upload: `https://four.meme/meme-api/v1/private/token/upload`
   - Token Creation: `https://four.meme/meme-api/v1/private/token/create`

3. **Authentication Headers**
   - Cookie-based authentication
   - Web access tokens

## Smart Contract Integration

- BNB Token Factory Contract: `0x5c952063c7fc8610FFDB798152D69F0B9550762b`
- CreateToken ABI for token deployment
- Purchase methods for immediate token buying

## Technical Constraints

1. **Rate Limiting**: Four.meme API may have rate limits
2. **Image Requirements**: Specific format/size requirements for token images
3. **Transaction Timing**: Network congestion can affect transaction speed
4. **Cookie Management**: Maintaining valid session during the entire process

## Security Considerations

1. **Private Key Management**:

   - Never log or expose private keys
   - Keys stored only in .env file (gitignored)

2. **Token Management**:

   - Secure storage of authentication tokens
   - Proper session handling

3. **Network Security**:
   - HTTPS for all API calls
   - Proper error handling for network failures
