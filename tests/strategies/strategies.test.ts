import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import { WalletCoordinatorService } from "../../src/blockchain/wallet-coordinator.service";
import { BundleLaunchStrategy } from "../../src/strategies/bundle-launch.strategy";
import { StaggeredLaunchStrategy } from "../../src/strategies/staggered-launch.strategy";
import { AntiSniperStrategy } from "../../src/strategies/anti-sniper.strategy";
import { createMockTokenOptions } from "../test-utils";
import {
  type IBundleStrategyOptions,
  type IStaggeredStrategyOptions,
  type IAntiSniperStrategyOptions,
} from "../../src/types";

describe("Launch Strategies", () => {
  let walletCoordinator: WalletCoordinatorService;
  const mockTokenOptions = createMockTokenOptions();

  beforeEach(() => {
    // Create a fresh mock wallet coordinator for each test
    walletCoordinator = new WalletCoordinatorService("https://example.com/rpc");

    // Mock methods
    walletCoordinator.getWalletAddresses = mock(() => [
      "0xAddress1",
      "0xAddress2",
      "0xAddress3",
    ]);

    walletCoordinator.getWalletInfo = mock((address) => {
      return {
        address,
        isActive: true,
        priority: address === "0xAddress1" ? 0 : 1,
      };
    });

    walletCoordinator.executeBatchTransactions = mock(() =>
      Promise.resolve(["0xTxHash1", "0xTxHash2", "0xTxHash3"])
    );
    walletCoordinator.executeSequentialTransactions = mock(() =>
      Promise.resolve(["0xTxHash1", "0xTxHash2"])
    );
    walletCoordinator.executeTransaction = mock(() =>
      Promise.resolve("0xTxHash1")
    );

    // Fix: Properly mock the waitForConfirmation method to return a valid receipt
    walletCoordinator.waitForConfirmation = mock(() =>
      Promise.resolve({
        transactionHash: "0xTxHash1",
        blockNumber: BigInt(12345),
        blockHash: "0xBlockHash1",
        status: "success" as "success" | "reverted",
        from: "0xAddress1",
        to: "0xTargetAddress",
        contractAddress: "0xContractAddress1",
        gasUsed: BigInt(100000),
      })
    );
  });

  afterEach(() => {
    mock.restore();
  });

  describe("BundleLaunchStrategy", () => {
    it("should initialize with correct options", async () => {
      // Arrange
      const strategy = new BundleLaunchStrategy(walletCoordinator);
      const options: IBundleStrategyOptions = {
        name: "Test Strategy",
        executeAllAtOnce: true,
        gasMultiplier: 2.0,
      };

      // Act
      await strategy.initialize(options);

      // Assert
      expect(strategy.name).toBe("Bundle Launch");
      expect(strategy.getStatus().stage).toBe("initialized");
    });

    it("should execute and return a token address", async () => {
      // Arrange
      const strategy = new BundleLaunchStrategy(walletCoordinator);
      await strategy.initialize({
        name: "Test Strategy",
        executeAllAtOnce: true,
      } as IBundleStrategyOptions);

      // Act
      const result = await strategy.execute(mockTokenOptions);

      // Assert
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(strategy.getStatus().stage).toBe("completed");
    });
  });

  describe("StaggeredLaunchStrategy", () => {
    it("should initialize with correct options", async () => {
      // Arrange
      const strategy = new StaggeredLaunchStrategy(walletCoordinator);
      const options: IStaggeredStrategyOptions = {
        name: "Test Strategy",
        delayBetweenTransactions: 2000,
        waitForConfirmation: true,
      };

      // Act
      await strategy.initialize(options);

      // Assert
      expect(strategy.name).toBe("Staggered Launch");
      expect(strategy.getStatus().stage).toBe("initialized");
    });

    it("should execute and return a token address", async () => {
      // Arrange
      const strategy = new StaggeredLaunchStrategy(walletCoordinator);
      await strategy.initialize({
        name: "Test Strategy",
        delayBetweenTransactions: 2000,
        waitForConfirmation: true,
      } as IStaggeredStrategyOptions);

      // Act
      const result = await strategy.execute(mockTokenOptions);

      // Assert
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(strategy.getStatus().stage).toBe("completed");
    });
  });

  describe("AntiSniperStrategy", () => {
    it("should initialize with correct options", async () => {
      // Arrange
      const strategy = new AntiSniperStrategy(walletCoordinator);
      const options: IAntiSniperStrategyOptions = {
        name: "Test Strategy",
        monitorDuration: 5000,
        triggerThreshold: 3,
        countermeasures: "delay",
      };

      // Act
      await strategy.initialize(options);

      // Assert
      expect(strategy.name).toBe("Anti-Sniper");
      expect(strategy.getStatus().stage).toBe("initialized");
    });

    it("should execute and return a token address", async () => {
      // Arrange
      const strategy = new AntiSniperStrategy(walletCoordinator);
      await strategy.initialize({
        name: "Test Strategy",
        monitorDuration: 5000,
        triggerThreshold: 3,
        countermeasures: "delay",
      } as IAntiSniperStrategyOptions);

      // Act
      const result = await strategy.execute(mockTokenOptions);

      // Assert
      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
      expect(strategy.getStatus().stage).toBe("completed");
    });

    it("should clean up resources after execution", async () => {
      // Arrange
      const strategy = new AntiSniperStrategy(walletCoordinator);
      await strategy.initialize({
        name: "Test Strategy",
        monitorDuration: 5000,
        triggerThreshold: 3,
        countermeasures: "delay",
      } as IAntiSniperStrategyOptions);

      // Act
      await strategy.execute(mockTokenOptions);
      await strategy.cleanup();

      // Assert - no error means success for this test
      expect(true).toBe(true);
    });
  });
});
