import {
  type ILaunchStrategy,
  type IStrategyOptions,
  type IBundleStrategyOptions,
  type IStaggeredStrategyOptions,
  type IAntiSniperStrategyOptions,
} from "../types";
import { WalletCoordinatorService } from "../blockchain/wallet-coordinator.service";
import { BundleLaunchStrategy } from "../strategies/bundle-launch.strategy";
import { StaggeredLaunchStrategy } from "../strategies/staggered-launch.strategy";
import { AntiSniperStrategy } from "../strategies/anti-sniper.strategy";

/**
 * Strategy types
 */
export enum StrategyType {
  BUNDLE = "bundle",
  STAGGERED = "staggered",
  ANTI_SNIPER = "anti-sniper",
}

/**
 * Strategy Factory Service
 * Creates and manages launch strategies
 */
export class StrategyFactoryService {
  private walletCoordinator: WalletCoordinatorService;
  private strategies: Map<string, ILaunchStrategy> = new Map();

  /**
   * Constructor
   * @param walletCoordinator Wallet coordinator service
   */
  constructor(walletCoordinator: WalletCoordinatorService) {
    this.walletCoordinator = walletCoordinator;
  }

  /**
   * Create a strategy
   * @param type Strategy type
   * @param options Strategy options
   * @returns Created strategy
   */
  async createStrategy(
    type: StrategyType,
    options?: IStrategyOptions
  ): Promise<ILaunchStrategy> {
    let strategy: ILaunchStrategy;

    switch (type) {
      case StrategyType.BUNDLE:
        strategy = new BundleLaunchStrategy(this.walletCoordinator);
        break;

      case StrategyType.STAGGERED:
        strategy = new StaggeredLaunchStrategy(this.walletCoordinator);
        break;

      case StrategyType.ANTI_SNIPER:
        strategy = new AntiSniperStrategy(this.walletCoordinator);
        break;

      default:
        throw new Error(`Unsupported strategy type: ${type}`);
    }

    // Initialize the strategy with options
    if (options) {
      await strategy.initialize(options);
    }

    // Store the strategy
    const id = `${type}-${Date.now()}`;
    this.strategies.set(id, strategy);

    return strategy;
  }

  /**
   * Get a strategy by ID
   * @param id Strategy ID
   * @returns Strategy instance or undefined if not found
   */
  getStrategy(id: string): ILaunchStrategy | undefined {
    return this.strategies.get(id);
  }

  /**
   * Get all strategies
   * @returns Map of strategy ID to strategy instance
   */
  getAllStrategies(): Map<string, ILaunchStrategy> {
    return this.strategies;
  }

  /**
   * Create bundle launch strategy
   * @param options Bundle strategy options
   * @returns Bundle launch strategy
   */
  async createBundleStrategy(
    options?: Partial<IBundleStrategyOptions>
  ): Promise<ILaunchStrategy> {
    const strategy = new BundleLaunchStrategy(this.walletCoordinator);

    if (options) {
      // Merge with default options
      const defaultOptions = {
        name: "Bundle Launch",
        description: "Creates token and executes all buys in rapid succession",
        executeAllAtOnce: true,
      };

      await strategy.initialize({
        ...defaultOptions,
        ...options,
      });
    }

    // Store the strategy
    const id = `${StrategyType.BUNDLE}-${Date.now()}`;
    this.strategies.set(id, strategy);

    return strategy;
  }

  /**
   * Create staggered launch strategy
   * @param options Staggered strategy options
   * @returns Staggered launch strategy
   */
  async createStaggeredStrategy(
    options?: Partial<IStaggeredStrategyOptions>
  ): Promise<ILaunchStrategy> {
    const strategy = new StaggeredLaunchStrategy(this.walletCoordinator);

    if (options) {
      // Merge with default options
      const defaultOptions = {
        name: "Staggered Launch",
        description:
          "Creates token with immediate dev wallet buy, followed by timed purchases",
        delayBetweenTransactions: 1000,
        waitForConfirmation: true,
      };

      await strategy.initialize({
        ...defaultOptions,
        ...options,
      });
    }

    // Store the strategy
    const id = `${StrategyType.STAGGERED}-${Date.now()}`;
    this.strategies.set(id, strategy);

    return strategy;
  }

  /**
   * Create anti-sniper strategy
   * @param options Anti-sniper strategy options
   * @returns Anti-sniper strategy
   */
  async createAntiSniperStrategy(
    options?: Partial<IAntiSniperStrategyOptions>
  ): Promise<ILaunchStrategy> {
    const strategy = new AntiSniperStrategy(this.walletCoordinator);

    if (options) {
      // Merge with default options
      const defaultOptions = {
        name: "Anti-Sniper",
        description:
          "Monitors for sniper activity and implements countermeasures",
        monitorDuration: 10000,
        triggerThreshold: 2,
        countermeasures: "delay",
      };

      await strategy.initialize({
        ...defaultOptions,
        ...options,
      });
    }

    // Store the strategy
    const id = `${StrategyType.ANTI_SNIPER}-${Date.now()}`;
    this.strategies.set(id, strategy);

    return strategy;
  }
}
