# Four Meme CLI - System Patterns

## System Architecture

The Four Meme CLI follows a modular architecture with expanded capabilities for token bundling:

```
┌─────────────────┐     ┌───────────────────┐     ┌────────────────┐
│  CLI Interface  │────▶│    Core Engine    │────▶│  API Services  │
└─────────────────┘     └───────────────────┘     └────────────────┘
                               │                          │
                               ▼                          ▼
                        ┌─────────────┐           ┌─────────────────┐
                        │  Blockchain │           │  Image Handler  │
                        │  Services   │           └─────────────────┘
                        └─────────────┘
                               │
                               ▼
                     ┌──────────────────────┐
                     │  Wallet Coordinator  │
                     └──────────────────────┘
                               │
                               ▼
            ┌─────────────────────────────────────────┐
            │              Launch Strategies          │
            ├───────────────┬───────────────┬─────────┘
            ▼               ▼               ▼
┌────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Bundle Launch  │ │ Stagger      │ │ Anti-Sniper      │
│ Strategy       │ │ Launch       │ │ Strategy         │
└────────────────┘ └──────────────┘ └──────────────────┘
```

### Components

1. **CLI Interface**

   - Handles user input and command processing
   - Displays progressive status updates
   - Manages interactive prompts for image selection
   - Provides strategy selection interface

2. **Core Engine**

   - Orchestrates the entire token creation workflow
   - Manages state throughout the process
   - Handles error recovery and retry logic
   - Coordinates launch strategy execution

3. **API Services**

   - Manages authentication with four.meme
   - Handles API calls for token creation and management
   - Maintains session cookies and tokens
   - Monitors token contract deployment

4. **Blockchain Services**

   - Manages wallet connections using viem
   - Signs transactions for SIWE and token purchases
   - Interacts with smart contracts
   - Handles gas price optimization

5. **Image Handler**

   - Processes and validates images
   - Handles image compression if needed
   - Manages image upload to four.meme

6. **Wallet Coordinator**

   - Manages multiple wallets (up to 39)
   - Orchestrates transaction sequencing
   - Handles batch operations across wallets
   - Monitors wallet balances and transaction status

7. **Launch Strategies**
   - Bundle Launch: Rapid execution of all purchases
   - Stagger Launch: Timed sequence of purchases
   - Anti-Sniper: Monitoring and countermeasures

## Design Patterns

### Command Pattern

Used for CLI command structure, allowing for extension with new commands and strategies while maintaining a consistent interface.

### Factory Pattern

Implemented for creating different types of API requests, blockchain transactions, and launch strategies.

### Strategy Pattern

Used for implementing different purchasing and launch strategies with multiple wallets.

### Observer Pattern

Implemented for status updates, transaction monitoring, and logging throughout the process.

### Repository Pattern

Used for managing configuration, environment variables, and wallet secrets.

### Coordinator Pattern

Implemented in the wallet coordinator to manage complex multi-wallet operations and transaction sequencing.

## Token Bundling Workflow

### Token Creation Phase

1. User selects launch strategy and parameters
2. System authenticates with four.meme
3. Token image is processed and uploaded
4. Token parameters are submitted to four.meme database
5. System prepares wallet coordinator with selected strategy

### Launch Execution Phase

1. **Bundle Launch Strategy**

   - Smart contract creation is triggered
   - System monitors for successful contract deployment
   - All purchase transactions are executed in rapid succession
   - Transaction status is monitored and reported

2. **Staggered Launch Strategy**

   - Smart contract creation is triggered with initial dev wallet buy
   - System monitors for successful contract deployment
   - Additional wallet purchases are executed with precise timing
   - Each transaction is confirmed before proceeding to next wallet

3. **Anti-Sniper Strategy**
   - Smart contract creation is triggered with minimal liquidity
   - System monitors for external buy transactions (snipers)
   - Countermeasures are executed based on sniper detection
   - Strategic buying is performed after sniper assessment

### Monitoring Phase

1. Transaction receipts are collected and verified
2. Token balances are confirmed across all wallets
3. Results are reported back to the user
4. Performance metrics are analyzed

## Error Handling

The system implements robust error handling with enhanced capabilities:

- Strategy-specific recovery mechanisms
- Transaction monitoring with automatic retries
- Gas price adjustment for transaction failures
- Fallback procedures for different failure scenarios
- Network congestion detection and adaptation

## Configuration Management

Configuration is managed through:

- Environment variables for sensitive information (.env file)
- Command line parameters for token-specific details
- Strategy configuration files for complex launch patterns
- Wallet management configuration for multi-wallet operations
- Sensible defaults to minimize required input

## Transaction Coordination

The system implements sophisticated transaction coordination:

- Precise timing mechanisms for transaction execution
- Block-based sequencing for optimal coordination
- Configureable delays between transactions
- Gas price optimization for competitive environment
- Transaction confirmation monitoring
- Failure detection and recovery strategies
