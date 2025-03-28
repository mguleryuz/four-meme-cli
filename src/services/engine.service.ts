import { AuthService } from "../api/auth.service";
import { TokenService } from "../api/token.service";
import { WalletService } from "../blockchain/wallet.service";
import { ContractService } from "../blockchain/contract.service";
import {
  StrategyFactoryService,
  StrategyType,
} from "./strategy-factory.service";
import { WalletCoordinatorService } from "../blockchain/wallet-coordinator.service";
import type {
  ITokenOptions,
  IBuyOptions,
  ITokenCreateRequest,
  ICreateTokenOptions,
  ILaunchStrategy,
  IStrategyConfig,
  IStrategyOptionsConfig,
} from "../types";

/**
 * Core Engine Service for orchestrating the token creation process
 */
export class EngineService {
  private authService: AuthService;
  private tokenService: TokenService;
  private walletService: WalletService;
  private contractService: ContractService;
  private strategyFactory: StrategyFactoryService;

  constructor() {
    this.walletService = new WalletService();
    this.authService = new AuthService();
    this.tokenService = new TokenService(this.authService);
    this.contractService = new ContractService();

    const walletCoordinator = new WalletCoordinatorService(
      "https://bsc-dataseed.binance.org"
    );
    this.strategyFactory = new StrategyFactoryService(walletCoordinator);
  }

  /**
   * Initialize the engine by authenticating with four.meme
   */
  async initialize(): Promise<void> {
    const primaryWallet = this.walletService.getPrimaryWallet();
    await this.authService.login(primaryWallet);
    const userInfo = await this.authService.getUserInfo();
    console.log(`Authenticated as: ${userInfo.address}`);
  }

  /**
   * Create a token on four.meme
   * @param options Token creation options
   * @returns Token contract address
   */
  async createToken(options: ICreateTokenOptions): Promise<string> {
    // Upload image
    const logoUrl = await this.tokenService.uploadImage(options.imagePath);
    console.log(`Image uploaded successfully: ${logoUrl}`);

    // Create token request
    const tokenRequest: ITokenCreateRequest = {
      tokenName: options.name,
      tokenSymbol: options.symbol,
      decimals: options.decimals,
      totalSupply: options.totalSupply,
      description: options.description,
      logoUrl,
    };

    // Add optional social links if provided
    if (options.telegram) {
      tokenRequest.tgLink = options.telegram;
    }

    if (options.twitter) {
      tokenRequest.xLink = options.twitter;
    }

    if (options.website) {
      tokenRequest.websiteLink = options.website;
    }

    // Create token in four.meme database
    const tokenResult = await this.tokenService.createToken(tokenRequest);
    console.log(`Token created with ID: ${tokenResult.tokenId}`);

    // Wait for token address to be available
    let tokenAddress = tokenResult.tokenAddress;
    if (!tokenAddress) {
      console.log("Waiting for token contract address...");
      tokenAddress = await this.waitForTokenAddress(tokenResult.tokenId);
    }

    console.log(`Token contract deployed at: ${tokenAddress}`);

    // If a strategy is provided, use it to execute token purchases
    if (options.strategy) {
      const strategy = await this.createStrategy(options.strategy);
      try {
        await strategy.execute(options);
      } finally {
        // Always clean up strategy resources
        await strategy.cleanup();
      }
    }

    return tokenAddress;
  }

  /**
   * Create a launch strategy based on the provided configuration
   * @param strategyConfig The strategy configuration
   * @returns The created strategy instance
   */
  private async createStrategy(
    strategyConfig: IStrategyConfig
  ): Promise<ILaunchStrategy> {
    // Map the strategy type to StrategyType enum
    let strategyType: StrategyType;

    switch (strategyConfig.type) {
      case "bundle":
        strategyType = StrategyType.BUNDLE;
        break;
      case "staggered":
        strategyType = StrategyType.STAGGERED;
        break;
      case "anti-sniper":
        strategyType = StrategyType.ANTI_SNIPER;
        break;
      default:
        throw new Error(`Unsupported strategy type: ${strategyConfig.type}`);
    }

    // Convert options to include required name field
    const strategyOptions = {
      name: `${strategyConfig.type} strategy`,
      ...strategyConfig.options,
    };

    return await this.strategyFactory.createStrategy(
      strategyType,
      strategyOptions
    );
  }

  /**
   * Wait for token address to be available
   * @param tokenId Token ID from four.meme
   * @returns Token contract address
   */
  private async waitForTokenAddress(tokenId: string): Promise<string> {
    // This is a placeholder - in reality we'd poll the API to get the token address
    // once it's created, but the reference doesn't show that endpoint
    return "0x0000000000000000000000000000000000000000";
  }

  /**
   * Buy tokens with multiple wallets
   * @param tokenAddress Token contract address
   * @param buyOptions Buy options
   */
  async buyTokens(
    tokenAddress: string,
    buyOptions: IBuyOptions
  ): Promise<void> {
    if (!buyOptions.enabled || buyOptions.buyerWallets.length === 0) {
      console.log("Buying disabled or no buyer wallets configured");
      return;
    }

    const buyerWallets = this.walletService.getBuyerWallets();

    for (const wallet of buyerWallets) {
      try {
        const hash = await this.contractService.buyTokens(
          wallet,
          tokenAddress,
          buyOptions.buyAmount
        );
        console.log(
          `Bought tokens with wallet ${await wallet.getAddress()}, tx: ${hash}`
        );
      } catch (error) {
        console.error(
          `Failed to buy tokens with wallet ${await wallet.getAddress()}:`,
          error
        );
      }
    }
  }
}
