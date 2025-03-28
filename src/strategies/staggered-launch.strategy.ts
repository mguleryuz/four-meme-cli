import {
  type ILaunchStrategy,
  type IStrategyStatus,
  type IStaggeredStrategyOptions,
  type IStrategyOptions,
  type ITokenOptions,
  type TransactionRequest,
} from "../types";
import { WalletCoordinatorService } from "../blockchain/wallet-coordinator.service";
import { envConfig } from "../config";
import { BLOCKCHAIN_CONSTANTS } from "../config/constants";
import { parseEther } from "viem";

/**
 * Staggered Launch Strategy
 * Creates token with initial dev wallet buy, followed by timed purchases
 */
export class StaggeredLaunchStrategy implements ILaunchStrategy {
  name = "Staggered Launch";
  description =
    "Creates token with initial dev wallet buy, followed by timed purchases";

  private options: IStaggeredStrategyOptions;
  private walletCoordinator: WalletCoordinatorService;
  private status: IStrategyStatus = { stage: "idle", progress: 0 };

  /**
   * Constructor
   * @param walletCoordinator Wallet coordinator service
   */
  constructor(walletCoordinator: WalletCoordinatorService) {
    this.walletCoordinator = walletCoordinator;
    this.options = {
      name: "Staggered Launch",
      description:
        "Creates token with initial dev wallet buy, followed by timed purchases",
      delayBetweenTransactions: 1000, // 1 second between purchases
      waitForConfirmation: true,
      gasMultiplier: 1.3,
      maxRetries: 2,
      confirmations: 1,
    };
  }

  /**
   * Initialize the strategy with options
   * @param options Strategy options
   */
  async initialize(options: IStrategyOptions): Promise<void> {
    // Type cast to ensure we have the right options
    this.options = {
      ...this.options,
      ...(options as IStaggeredStrategyOptions),
    };

    this.status = {
      stage: "initialized",
      progress: 10,
      message: "Strategy initialized with staggered launch options",
    };
  }

  /**
   * Execute the staggered launch strategy
   * @param tokenOptions Token creation options
   * @returns Token contract address
   */
  async execute(tokenOptions: ITokenOptions): Promise<string> {
    try {
      // Update status
      this.status = {
        stage: "executing",
        progress: 20,
        message: "Preparing for staggered launch...",
      };

      // 1. Get the primary wallet (dev wallet) for initial buy
      const walletAddresses = this.walletCoordinator.getWalletAddresses();
      if (walletAddresses.length === 0) {
        throw new Error("No wallets available for token creation");
      }

      // Use the first wallet as primary
      const primaryWalletAddress = walletAddresses[0];

      // 2. Create the token contract transaction
      const createTokenTx: TransactionRequest = {
        to: envConfig.factoryAddress,
        data: tokenOptions.createArg,
        value: parseEther(BLOCKCHAIN_CONSTANTS.CREATE_TOKEN_FEE),
      };

      // Update status
      this.status = {
        stage: "executing",
        progress: 30,
        message: "Creating token contract with primary wallet...",
      };

      // 3. Execute the token creation with primary wallet
      const createTokenHash = await this.walletCoordinator.executeTransaction(
        primaryWalletAddress,
        createTokenTx,
        {
          gasMultiplier: this.options.gasMultiplier,
          maxRetries: this.options.maxRetries,
          confirmations: this.options.confirmations,
          priority: "high",
        }
      );

      // Wait for transaction confirmation
      const receipt = await this.walletCoordinator.waitForConfirmation(
        createTokenHash,
        this.options.confirmations
      );

      if (!receipt || receipt.status !== "success") {
        throw new Error(
          `Token creation failed. Transaction hash: ${createTokenHash}`
        );
      }

      // Extract token address from receipt or use the one provided
      const tokenAddress =
        receipt.contractAddress || tokenOptions.contractAddress;

      if (!tokenAddress) {
        throw new Error("Could not determine token contract address");
      }

      // 4. Update status for staggered purchases
      this.status = {
        stage: "executing",
        progress: 40,
        message: "Token created. Starting staggered purchases...",
      };

      // 5. Prepare purchase transactions for other wallets (excluding primary)
      const purchaseTxs: TransactionRequest[] = [];
      const purchaseWalletAddresses: string[] = [];

      // Skip the first wallet (primary) and use all others
      for (let i = 1; i < walletAddresses.length; i++) {
        const address = walletAddresses[i];
        const walletInfo = this.walletCoordinator.getWalletInfo(address);

        if (walletInfo && walletInfo.isActive) {
          purchaseTxs.push({
            to: tokenAddress,
            value: parseEther(tokenOptions.buy.buyAmount),
          });
          purchaseWalletAddresses.push(address);
        }
      }

      if (purchaseTxs.length === 0) {
        this.status = {
          stage: "completed",
          progress: 100,
          message: `Token created successfully at ${tokenAddress}, but no additional wallets available for staggered purchases`,
        };
        return tokenAddress;
      }

      // Update status for staggered purchases
      this.status = {
        stage: "executing",
        progress: 60,
        message: `Executing ${purchaseTxs.length} staggered purchases...`,
      };

      // 6. Execute staggered purchases with configured delay
      const hashes = await this.walletCoordinator.executeSequentialTransactions(
        purchaseWalletAddresses,
        purchaseTxs,
        this.options.delayBetweenTransactions,
        {
          gasMultiplier: this.options.gasMultiplier,
          maxRetries: this.options.maxRetries,
          confirmations: this.options.waitForConfirmation
            ? this.options.confirmations
            : 0,
          priority: "medium",
        }
      );

      // Update status to completed
      this.status = {
        stage: "completed",
        progress: 100,
        message: `Staggered launch completed. Token address: ${tokenAddress}`,
      };

      return tokenAddress;
    } catch (error) {
      // Update status to failed
      this.status = {
        stage: "failed",
        progress: 0,
        message: "Staggered launch failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };

      throw error;
    }
  }

  /**
   * Get the current status of the strategy
   * @returns Strategy status
   */
  getStatus(): IStrategyStatus {
    return this.status;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    // No cleanup needed for this strategy
  }
}
