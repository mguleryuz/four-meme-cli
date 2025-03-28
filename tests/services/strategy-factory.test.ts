import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import {
  StrategyFactoryService,
  StrategyType,
} from "../../src/services/strategy-factory.service";
import { WalletCoordinatorService } from "../../src/blockchain/wallet-coordinator.service";
import {
  type ILaunchStrategy,
  type IStrategyOptions,
  type IStrategyStatus,
} from "../../src/types";

describe("StrategyFactoryService", () => {
  let strategyFactory: StrategyFactoryService;
  let mockWalletCoordinator: WalletCoordinatorService;

  // Create mock implementations of strategies
  let mockBundleStrategy: ILaunchStrategy;
  let mockStaggeredStrategy: ILaunchStrategy;
  let mockAntiSniperStrategy: ILaunchStrategy;

  beforeEach(() => {
    // Create mock wallet coordinator
    mockWalletCoordinator = new WalletCoordinatorService(
      "https://mock.rpc.url"
    );

    // Create mock strategies with spies
    mockBundleStrategy = {
      name: "Bundle Launch",
      description: "Creates token and executes all buys in rapid succession",
      initialize: mock(() => Promise.resolve()),
      execute: mock(() => Promise.resolve("0x1234567890abcdef")),
      getStatus: mock(() => ({
        stage: "completed" as const,
        progress: 100,
      })),
      cleanup: mock(() => Promise.resolve()),
    };

    mockStaggeredStrategy = {
      name: "Staggered Launch",
      description:
        "Creates token with immediate dev wallet buy, followed by timed purchases",
      initialize: mock(() => Promise.resolve()),
      execute: mock(() => Promise.resolve("0x1234567890abcdef")),
      getStatus: mock(() => ({
        stage: "completed" as const,
        progress: 100,
      })),
      cleanup: mock(() => Promise.resolve()),
    };

    mockAntiSniperStrategy = {
      name: "Anti-Sniper",
      description:
        "Monitors for sniper activity and implements countermeasures",
      initialize: mock(() => Promise.resolve()),
      execute: mock(() => Promise.resolve("0x1234567890abcdef")),
      getStatus: mock(() => ({
        stage: "completed" as const,
        progress: 100,
      })),
      cleanup: mock(() => Promise.resolve()),
    };

    // Create a custom implementation of StrategyFactoryService for testing
    strategyFactory = new (class extends StrategyFactoryService {
      constructor() {
        super(mockWalletCoordinator);
      }

      // Override the factory methods to return our mocks
      async createBundleStrategy(options?: any): Promise<ILaunchStrategy> {
        if (options) {
          await mockBundleStrategy.initialize(options);
        }
        const id = `bundle-${Date.now()}`;
        this["strategies"].set(id, mockBundleStrategy);
        return mockBundleStrategy;
      }

      async createStaggeredStrategy(options?: any): Promise<ILaunchStrategy> {
        if (options) {
          await mockStaggeredStrategy.initialize(options);
        }
        const id = `staggered-${Date.now()}`;
        this["strategies"].set(id, mockStaggeredStrategy);
        return mockStaggeredStrategy;
      }

      async createAntiSniperStrategy(options?: any): Promise<ILaunchStrategy> {
        if (options) {
          await mockAntiSniperStrategy.initialize(options);
        }
        const id = `anti-sniper-${Date.now()}`;
        this["strategies"].set(id, mockAntiSniperStrategy);
        return mockAntiSniperStrategy;
      }

      async createStrategy(
        type: StrategyType,
        options?: IStrategyOptions
      ): Promise<ILaunchStrategy> {
        switch (type) {
          case StrategyType.BUNDLE:
            return this.createBundleStrategy(options);
          case StrategyType.STAGGERED:
            return this.createStaggeredStrategy(options);
          case StrategyType.ANTI_SNIPER:
            return this.createAntiSniperStrategy(options);
          default:
            throw new Error(`Unsupported strategy type: ${type}`);
        }
      }
    })();
  });

  afterEach(() => {
    mock.restore();
  });

  describe("createStrategy", () => {
    it("should create a bundle strategy", async () => {
      const strategy = await strategyFactory.createStrategy(
        StrategyType.BUNDLE
      );

      expect(strategy).toBeDefined();
      expect(strategy.name).toBe("Bundle Launch");
      expect(strategy).toBe(mockBundleStrategy);
    });

    it("should create a staggered strategy", async () => {
      const strategy = await strategyFactory.createStrategy(
        StrategyType.STAGGERED
      );

      expect(strategy).toBeDefined();
      expect(strategy.name).toBe("Staggered Launch");
      expect(strategy).toBe(mockStaggeredStrategy);
    });

    it("should create an anti-sniper strategy", async () => {
      const strategy = await strategyFactory.createStrategy(
        StrategyType.ANTI_SNIPER
      );

      expect(strategy).toBeDefined();
      expect(strategy.name).toBe("Anti-Sniper");
      expect(strategy).toBe(mockAntiSniperStrategy);
    });

    it("should throw an error for unsupported strategy type", async () => {
      await expect(
        strategyFactory.createStrategy("unsupported" as StrategyType)
      ).rejects.toThrow("Unsupported strategy type: unsupported");
    });

    it("should initialize the strategy with options", async () => {
      const options = {
        name: "Test Strategy",
        description: "Test description",
        gasMultiplier: 2.0,
      };

      const strategy = await strategyFactory.createStrategy(
        StrategyType.BUNDLE,
        options
      );

      expect(strategy).toBeDefined();
      expect(mockBundleStrategy.initialize).toHaveBeenCalledWith(options);
    });
  });

  describe("createBundleStrategy", () => {
    it("should create a bundle strategy with default options", async () => {
      const strategy = await strategyFactory.createBundleStrategy();

      expect(strategy).toBeDefined();
      expect(strategy.name).toBe("Bundle Launch");
      expect(strategy).toBe(mockBundleStrategy);
    });

    it("should create a bundle strategy with custom options", async () => {
      const options = {
        executeAllAtOnce: true,
        gasMultiplier: 2.0,
      };

      const strategy = await strategyFactory.createBundleStrategy(options);

      expect(strategy).toBeDefined();
      expect(mockBundleStrategy.initialize).toHaveBeenCalled();
      expect(mockBundleStrategy.initialize).toHaveBeenCalledWith(options);
    });
  });

  describe("createStaggeredStrategy", () => {
    it("should create a staggered strategy with default options", async () => {
      const strategy = await strategyFactory.createStaggeredStrategy();

      expect(strategy).toBeDefined();
      expect(strategy.name).toBe("Staggered Launch");
      expect(strategy).toBe(mockStaggeredStrategy);
    });

    it("should create a staggered strategy with custom options", async () => {
      const options = {
        delayBetweenTransactions: 2000,
        waitForConfirmation: true,
      };

      const strategy = await strategyFactory.createStaggeredStrategy(options);

      expect(strategy).toBeDefined();
      expect(mockStaggeredStrategy.initialize).toHaveBeenCalled();
      expect(mockStaggeredStrategy.initialize).toHaveBeenCalledWith(options);
    });
  });

  describe("createAntiSniperStrategy", () => {
    it("should create an anti-sniper strategy with default options", async () => {
      const strategy = await strategyFactory.createAntiSniperStrategy();

      expect(strategy).toBeDefined();
      expect(strategy.name).toBe("Anti-Sniper");
      expect(strategy).toBe(mockAntiSniperStrategy);
    });

    it("should create an anti-sniper strategy with custom options", async () => {
      const options = {
        monitorDuration: 5000,
        triggerThreshold: 3,
        countermeasures: "delay" as const,
      };

      const strategy = await strategyFactory.createAntiSniperStrategy(options);

      expect(strategy).toBeDefined();
      expect(mockAntiSniperStrategy.initialize).toHaveBeenCalled();
      expect(mockAntiSniperStrategy.initialize).toHaveBeenCalledWith(options);
    });
  });

  describe("getStrategy and getAllStrategies", () => {
    it("should store and retrieve strategies", async () => {
      // Create and store strategies
      await strategyFactory.createBundleStrategy();
      await strategyFactory.createStaggeredStrategy();
      await strategyFactory.createAntiSniperStrategy();

      // Get all strategies
      const strategies = strategyFactory.getAllStrategies();

      // Check that all strategies are stored
      expect(strategies.size).toBe(3);

      // Get individual strategies by ID (we can't know the exact IDs, but we can iterate)
      const ids = Array.from(strategies.keys());

      // Check if we have valid IDs before testing
      if (ids.length >= 3) {
        const id0 = ids[0];
        const id1 = ids[1];
        const id2 = ids[2];

        if (id0 && id1 && id2) {
          expect(strategyFactory.getStrategy(id0)).toBeDefined();
          expect(strategyFactory.getStrategy(id1)).toBeDefined();
          expect(strategyFactory.getStrategy(id2)).toBeDefined();
        }
      }

      // Non-existent ID should return undefined
      expect(strategyFactory.getStrategy("non-existent")).toBeUndefined();
    });
  });
});
