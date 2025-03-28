import { expect, mock, spyOn } from "bun:test";
import { WalletCoordinatorService } from "../src/blockchain/wallet-coordinator.service";
import { BundleLaunchStrategy } from "../src/strategies/bundle-launch.strategy";
import { StaggeredLaunchStrategy } from "../src/strategies/staggered-launch.strategy";
import { AntiSniperStrategy } from "../src/strategies/anti-sniper.strategy";
import { StrategyFactoryService } from "../src/services/strategy-factory.service";
import { type ILaunchStrategy, type IWalletInfo } from "../src/types";

/**
 * Creates a mock WalletCoordinatorService
 */
export function createMockWalletCoordinator() {
  const walletAddresses = [
    "0xAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "0xBbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "0xCccccccccccccccccccccccccccccccccccccccc",
  ];

  // Mock wallet info map
  const walletsMap: Map<string, IWalletInfo> = new Map();
  walletAddresses.forEach((address, index) => {
    walletsMap.set(address, {
      address,
      label: index === 0 ? "Primary" : `Buyer ${index}`,
      balance: BigInt(1000000000000000000), // 1 ETH
      priority: index,
      isActive: true,
    });
  });

  return {
    addWallet: mock(() => Promise.resolve(walletAddresses[0])),
    addWallets: mock(() => Promise.resolve(walletAddresses)),
    getWalletAddresses: mock(() => walletAddresses),
    getWalletInfo: mock((address: string) => walletsMap.get(address)),
    updateBalances: mock(() => {
      const balances = new Map<string, bigint>();
      walletAddresses.forEach((address) => {
        balances.set(address, BigInt(1000000000000000000)); // 1 ETH
      });
      return Promise.resolve(balances);
    }),
    executeTransaction: mock(() =>
      Promise.resolve(
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
      )
    ),
    executeBatchTransactions: mock(() =>
      Promise.resolve(
        walletAddresses.map(
          (_) =>
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        )
      )
    ),
    executeSequentialTransactions: mock(() =>
      Promise.resolve(
        walletAddresses.map(
          (_) =>
            "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        )
      )
    ),
    waitForConfirmation: mock(() =>
      Promise.resolve({
        transactionHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        blockNumber: BigInt(12345),
        blockHash:
          "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        status: "success",
        from: walletAddresses[0],
        to: "0x0000000000000000000000000000000000000000",
        gasUsed: BigInt(100000),
      })
    ),
  };
}

/**
 * Creates a mock strategy factory service
 */
export function createMockStrategyFactory(): StrategyFactoryService {
  const mockWalletCoordinator = createMockWalletCoordinator();
  const strategyFactory = mock(StrategyFactoryService);

  // Create mock strategies
  const bundleStrategy = new BundleLaunchStrategy(mockWalletCoordinator);
  const staggeredStrategy = new StaggeredLaunchStrategy(mockWalletCoordinator);
  const antiSniperStrategy = new AntiSniperStrategy(mockWalletCoordinator);

  // Spy on strategy methods
  spyOn(bundleStrategy, "execute").mockImplementation(async () => {
    return "0x0000000000000000000000000000000000000001";
  });

  spyOn(staggeredStrategy, "execute").mockImplementation(async () => {
    return "0x0000000000000000000000000000000000000002";
  });

  spyOn(antiSniperStrategy, "execute").mockImplementation(async () => {
    return "0x0000000000000000000000000000000000000003";
  });

  // Mock strategy factory methods
  strategyFactory.createBundleStrategy.mockImplementation(async () => {
    return bundleStrategy;
  });

  strategyFactory.createStaggeredStrategy.mockImplementation(async () => {
    return staggeredStrategy;
  });

  strategyFactory.createAntiSniperStrategy.mockImplementation(async () => {
    return antiSniperStrategy;
  });

  strategyFactory.createStrategy.mockImplementation(async (type) => {
    if (type === "bundle") return bundleStrategy;
    if (type === "staggered") return staggeredStrategy;
    if (type === "anti-sniper") return antiSniperStrategy;
    throw new Error(`Unknown strategy type: ${type}`);
  });

  return strategyFactory;
}

/**
 * Creates a mock token options object for testing
 */
export function createMockTokenOptions() {
  return {
    name: "Test Token",
    symbol: "TEST",
    decimals: 18,
    totalSupply: "1000000",
    description: "Test token for unit tests",
    imagePath: "./tests/fixtures/test-image.png",
    buy: {
      enabled: true,
      buyerWallets: [],
      buyAmount: "0.1",
    },
    strategy: {
      type: "bundle",
      options: {
        executeAllAtOnce: true,
        delayBetweenTransactions: 1000,
        waitForConfirmation: true,
        monitorDuration: 10000,
        triggerThreshold: 2,
        countermeasures: "delay",
        gasMultiplier: 1.5,
      },
    },
  };
}
