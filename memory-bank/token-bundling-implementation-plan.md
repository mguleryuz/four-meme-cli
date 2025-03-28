# Four Meme CLI - Token Bundling Implementation Plan

## Overview

This document outlines the implementation plan for adding token bundling capabilities to the Four Meme CLI. Token bundling refers to coordinating token creation and immediate purchase actions across multiple wallets to secure initial liquidity and prevent sniping.

## Implementation Phases

### Phase 1: Core Infrastructure Migration (1-2 weeks)

#### 1. Migrate from ethers.js to viem

- Replace wallet implementation in `blockchain/wallet.service.ts`
- Update contract interaction in `blockchain/contract.service.ts`
- Adapt authentication flow in `api/auth.service.ts` to use viem for signatures
- Update any dependencies in the engine service

#### 2. Create Wallet Coordinator Service

- Implement `WalletCoordinatorService` in `blockchain/wallet-coordinator.service.ts`
- Add support for managing up to 39 wallets
- Implement batch wallet operations
- Add wallet status tracking and monitoring
- Create wallet group management

### Phase 2: Launch Strategy Implementation (1-2 weeks)

#### 1. Create Launch Strategy Interface

- Define `ILaunchStrategy` interface in `types/strategies.types.ts`
- Implement strategy factory in `services/strategy-factory.service.ts`

#### 2. Implement Bundle Launch Strategy

- Create `BundleLaunchStrategy` in `strategies/bundle-launch.strategy.ts`
- Implement rapid transaction execution
- Add monitoring for confirmation
- Create status reporting

#### 3. Implement Staggered Launch Strategy

- Create `StaggeredLaunchStrategy` in `strategies/staggered-launch.strategy.ts`
- Implement timed transaction execution
- Add configurable delays
- Implement confirmation before proceeding

#### 4. Implement Anti-Sniper Strategy

- Create `AntiSniperStrategy` in `strategies/anti-sniper.strategy.ts`
- Implement contract monitoring
- Add sniper detection
- Create countermeasures

### Phase 3: Transaction Coordination (1 week)

#### 1. Implement Transaction Sequencer

- Create `TransactionSequencer` in `blockchain/transaction-sequencer.service.ts`
- Implement precise ordering
- Add gas price optimization
- Create failure detection and recovery

#### 2. Implement Timing Mechanisms

- Add configurable delays
- Implement block-based timing
- Create network congestion detection

### Phase 4: CLI Interface Updates (1 week)

#### 1. Update CLI Commands

- Add strategy selection options to `cli/create-token.command.ts`
- Implement strategy-specific parameter collection
- Update help information

#### 2. Enhance Status Reporting

- Improve progress indicators
- Add transaction status monitoring
- Create performance reporting

### Phase 5: Testing and Documentation (1 week)

#### 1. Create Test Suite

- Unit tests for strategies
- Integration tests for launch scenarios
- Performance tests

#### 2. Update Documentation

- Update README with strategy information
- Create strategy-specific documentation
- Add examples for different launch scenarios

## Implementation Details

### Wallet Coordinator Service

The `WalletCoordinatorService` will be the central component for managing multiple wallets:

```typescript
export class WalletCoordinatorService {
  private wallets: Map<string, WalletInfo>;
  private transactionSequencer: TransactionSequencer;

  constructor() {
    this.wallets = new Map();
    this.transactionSequencer = new TransactionSequencer();
  }

  async addWallet(privateKey: string, label: string): Promise<string> {
    // Add wallet implementation
  }

  async executeTransaction(
    walletAddress: string,
    txData: TransactionRequest
  ): Promise<string> {
    // Execute single transaction
  }

  async executeBatchTransactions(
    walletAddresses: string[],
    txData: TransactionRequest[]
  ): Promise<string[]> {
    // Execute multiple transactions
  }

  async executeSequentialTransactions(
    walletAddresses: string[],
    txData: TransactionRequest[],
    delayMs: number
  ): Promise<string[]> {
    // Execute transactions with delays
  }

  // More methods for wallet coordination
}
```

### Launch Strategy Interface

The `ILaunchStrategy` interface will define the contract for all launch strategies:

```typescript
export interface ILaunchStrategy {
  name: string;
  description: string;

  initialize(options: IStrategyOptions): Promise<void>;
  execute(tokenOptions: ITokenOptions): Promise<string>;
  getStatus(): StrategyStatus;
  cleanup(): Promise<void>;
}
```

### Bundle Launch Strategy

The `BundleLaunchStrategy` will implement rapid transaction execution:

```typescript
export class BundleLaunchStrategy implements ILaunchStrategy {
  name = "Bundle Launch";
  description = "Creates token and executes all buys in rapid succession";

  private options: IBundleStrategyOptions;
  private walletCoordinator: WalletCoordinatorService;
  private tokenService: TokenService;
  private status: StrategyStatus = { stage: "idle", progress: 0 };

  constructor(
    walletCoordinator: WalletCoordinatorService,
    tokenService: TokenService
  ) {
    this.walletCoordinator = walletCoordinator;
    this.tokenService = tokenService;
  }

  async initialize(options: IBundleStrategyOptions): Promise<void> {
    this.options = options;
    this.status = { stage: "initialized", progress: 10 };
  }

  async execute(tokenOptions: ITokenOptions): Promise<string> {
    // Implementation of bundle launch
  }

  getStatus(): StrategyStatus {
    return this.status;
  }

  async cleanup(): Promise<void> {
    // Cleanup any resources
  }
}
```

### Transaction Sequencer

The `TransactionSequencer` will handle transaction ordering and timing:

```typescript
export class TransactionSequencer {
  private pendingTransactions: Map<string, TransactionInfo>;

  constructor() {
    this.pendingTransactions = new Map();
  }

  async scheduleTransaction(
    txData: TransactionRequest,
    options: SequencerOptions
  ): Promise<string> {
    // Implementation
  }

  async scheduleSequentialTransactions(
    txDataArray: TransactionRequest[],
    delayMs: number,
    options: SequencerOptions
  ): Promise<string[]> {
    // Implementation
  }

  async waitForConfirmation(
    txHash: string,
    confirmations: number = 1
  ): Promise<boolean> {
    // Wait for confirmation
  }
}
```

## CLI Updates

The CLI will be updated to support strategy selection:

```typescript
// In create-token.command.ts
private registerCommand(): void {
  this.program
    .command('create-token')
    .description('Create a new token on four.meme')
    // Existing options...
    .option('--strategy <strategyName>', 'Launch strategy to use', 'bundle')
    .option('--delay <delayMs>', 'Delay between transactions (for staggered strategy)', '1000')
    .option('--monitor-snipers', 'Enable sniper monitoring (for anti-sniper strategy)')
    // More options...
}
```

## Dependencies

- viem: For blockchain interactions
- p-queue: For transaction queue management
- p-retry: For transaction retry handling
- delay: For precise timing

## Resources Required

- Development time: 4-6 weeks
- Testing environment with multiple wallets
- Small amount of BNB for testing transactions

## Risks and Mitigations

| Risk                        | Mitigation                                     |
| --------------------------- | ---------------------------------------------- |
| Gas price volatility        | Implement adaptive gas pricing                 |
| Network congestion          | Add congestion detection and delay mechanisms  |
| Transaction failures        | Implement robust retry logic                   |
| Strategy performance issues | Conduct thorough performance testing           |
| Wallet security concerns    | Implement strong encryption for wallet storage |

## Success Criteria

- Successfully create tokens using different launch strategies
- Demonstrate protection against sniping
- Handle up to 39 wallets without performance degradation
- Complete token creation and purchases with >95% success rate
- User-friendly interface for strategy selection and configuration
