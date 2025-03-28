import { AuthService } from "../api/auth.service";
import { TokenService } from "../api/token.service";
import { WalletService } from "../blockchain/wallet.service";
import { ContractService } from "../blockchain/contract.service";
import {
  StrategyFactoryService,
  StrategyType,
} from "./strategy-factory.service";
import { WalletCoordinatorService } from "../blockchain/wallet-coordinator.service";
import { BLOCKCHAIN_CONSTANTS } from "../config/constants";
import type {
  ITokenOptions,
  IBuyOptions,
  ITokenCreateRequest,
  ICreateTokenOptions,
  ILaunchStrategy,
  IStrategyConfig,
  IStrategyOptionsConfig,
  IStrategyOptions,
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
    // Check wallet balance first to ensure we have enough funds
    const primaryWallet = this.walletService.getPrimaryWallet();
    const provider = primaryWallet.provider;

    // Ensure provider exists
    if (!provider) {
      throw new Error("Wallet provider is null. Check wallet setup.");
    }

    const walletAddress = await primaryWallet.getAddress();
    const balance = await provider.getBalance(walletAddress);
    const formattedBalance = parseFloat(balance.toString()) / 1e18; // Convert from wei to BNB

    console.log(`Wallet balance: ${formattedBalance.toFixed(6)} BNB`);

    // Calculate minimum required BNB (token creation fee + buffer for gas)
    const minRequired =
      parseFloat(BLOCKCHAIN_CONSTANTS.CREATE_TOKEN_FEE) + 0.005; // 0.005 BNB buffer for gas

    if (formattedBalance < minRequired) {
      throw new Error(
        `Insufficient wallet balance. You have ${formattedBalance.toFixed(6)} BNB but need at least ${minRequired.toFixed(6)} BNB for token creation.`
      );
    }

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

    // Debug what's in the token result
    console.log("Token API response:");
    console.log(`createArg available: ${!!tokenResult.createArg}`);
    console.log(`signature available: ${!!tokenResult.signature}`);

    // Extract createArg and signature from API response
    if (!tokenResult.createArg || !tokenResult.signature) {
      throw new Error(
        "Missing required contract creation parameters from API response"
      );
    }

    // Wait for token address to be available
    let tokenAddress = tokenResult.tokenAddress;
    if (!tokenAddress) {
      console.log("Waiting for token contract address...");
      tokenAddress = await this.waitForTokenAddress(tokenResult.tokenId);
    }

    console.log(`Token contract deployed at: ${tokenAddress}`);

    // Prepare token options with contract address and creation parameters for strategy execution
    const tokenOptions: ITokenOptions = {
      ...options,
      contractAddress: tokenAddress,
      createArg: tokenResult.createArg,
      signature: tokenResult.signature,
    };

    // Debug what's going into the strategy
    console.log("Token options for strategy:");
    console.log(`createArg present: ${!!tokenOptions.createArg}`);
    console.log(`signature present: ${!!tokenOptions.signature}`);

    // If a strategy is provided, use it to execute token purchases
    if (options.strategy) {
      const strategy = await this.createStrategy(options.strategy);
      try {
        // Initialize the strategy
        await strategy.initialize({
          name:
            options.strategy.options.name ||
            `${options.strategy.type} strategy`,
          ...options.strategy.options,
        } as IStrategyOptions);

        // Execute the strategy
        await strategy.execute(tokenOptions);

        console.log("Token purchase strategy executed successfully");
      } catch (error) {
        console.error("Strategy execution failed:", error);
        // Even if the strategy fails, we still return the token address
        // since the token was created successfully
      } finally {
        // Always clean up strategy resources
        await strategy.cleanup();
      }
    } else if (options.buy && options.buy.enabled) {
      // If no strategy but buying is enabled, perform a simple buy
      console.log("Executing direct token purchase...");
      await this.buyTokens(tokenAddress, options.buy);
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

    // Create strategy options with required name field
    const strategyOptions: IStrategyOptions = {
      name: strategyConfig.options.name || `${strategyConfig.type} strategy`,
      ...strategyConfig.options,
    } as IStrategyOptions; // Cast to work around TypeScript incompatibility

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
    const maxAttempts = 30; // Try for approximately 5 minutes
    const delayMs = 10000; // 10 seconds between attempts

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      console.log(
        `Waiting for token address... Attempt ${attempt + 1}/${maxAttempts}`
      );

      try {
        // Get token details from API
        const tokenDetails = await this.tokenService.getTokenDetails(tokenId);

        if (tokenDetails && tokenDetails.tokenAddress) {
          console.log(`Token address received: ${tokenDetails.tokenAddress}`);
          return tokenDetails.tokenAddress;
        }
      } catch (error) {
        console.warn(
          `Error checking token address (will retry): ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }

      // Wait before next attempt
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error(
      `Timed out waiting for token address after ${maxAttempts} attempts`
    );
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
