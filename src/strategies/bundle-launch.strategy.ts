import {
  type ILaunchStrategy,
  type IStrategyStatus,
  type IBundleStrategyOptions,
  type IStrategyOptions,
  type ITokenOptions,
  type TransactionRequest,
} from "../types";
import { WalletCoordinatorService } from "../blockchain/wallet-coordinator.service";
import { envConfig } from "../config";
import { BLOCKCHAIN_CONSTANTS } from "../config/constants";
import { parseEther } from "viem";

/**
 * Bundle Launch Strategy
 * Creates token and executes all purchases in rapid succession
 */
export class BundleLaunchStrategy implements ILaunchStrategy {
  name = "Bundle Launch";
  description = "Creates token and executes all buys in rapid succession";

  private options: IBundleStrategyOptions;
  private walletCoordinator: WalletCoordinatorService;
  private status: IStrategyStatus = { stage: "idle", progress: 0 };

  /**
   * Constructor
   * @param walletCoordinator Wallet coordinator service
   */
  constructor(walletCoordinator: WalletCoordinatorService) {
    this.walletCoordinator = walletCoordinator;
    this.options = {
      name: "Bundle Launch",
      description: "Creates token and executes all buys in rapid succession",
      executeAllAtOnce: true,
      maxConcurrentTransactions: 10,
      gasMultiplier: 1.5, // Higher gas multiplier for competitive environment
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
      ...(options as IBundleStrategyOptions),
    };

    this.status = {
      stage: "initialized",
      progress: 10,
      message: "Strategy initialized with bundle launch options",
    };
  }

  /**
   * Execute the bundle launch strategy
   * @param tokenOptions Token creation options
   * @returns Token contract address
   */
  async execute(tokenOptions: ITokenOptions): Promise<string> {
    try {
      // Update status
      this.status = {
        stage: "executing",
        progress: 20,
        message: "Preparing for bundle launch...",
      };

      // Debug logging for token options
      console.log(`Token contract address: ${tokenOptions.contractAddress}`);
      console.log(`createArg available: ${!!tokenOptions.createArg}`);
      console.log(`signature available: ${!!tokenOptions.signature}`);

      if (!tokenOptions.createArg || !tokenOptions.signature) {
        throw new Error(
          "Missing required createArg or signature parameters - cannot proceed with token creation"
        );
      }

      // Get primary wallet address for token creation
      const walletAddresses = this.walletCoordinator.getWalletAddresses();
      if (walletAddresses.length === 0) {
        throw new Error("No wallets available for token creation");
      }

      const primaryWalletAddress = walletAddresses[0];

      // 1. Create the token contract transaction
      const createTokenTx: TransactionRequest = {
        to: envConfig.factoryAddress,
        data: tokenOptions.createArg || "", // This should contain the encoded function call
        value: BigInt(
          Math.floor(parseFloat(BLOCKCHAIN_CONSTANTS.CREATE_TOKEN_FEE) * 1e18)
        ),
      };

      // Update status
      this.status = {
        stage: "executing",
        progress: 30,
        message: "Creating token contract...",
      };

      // 2. Execute the token creation transaction
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

      // Update status
      this.status = {
        stage: "executing",
        progress: 50,
        message: `Token created at ${tokenAddress}. Preparing purchases...`,
      };

      // 3. Prepare purchase transactions for all wallets
      const purchaseTxs: TransactionRequest[] = [];
      const purchaseWalletAddresses: string[] = [];

      for (const address of walletAddresses) {
        const walletInfo = this.walletCoordinator.getWalletInfo(address);
        if (walletInfo && walletInfo.isActive && tokenOptions.buy) {
          purchaseTxs.push({
            to: tokenAddress,
            value: BigInt(
              Math.floor(
                parseFloat(tokenOptions.buy.buyAmount || "0.001") * 1e18
              )
            ),
          });
          purchaseWalletAddresses.push(address);
        }
      }

      if (purchaseTxs.length === 0) {
        this.status = {
          stage: "completed",
          progress: 100,
          message: `Token created successfully at ${tokenAddress}, but no wallets available for purchasing`,
        };
        return tokenAddress;
      }

      // Update status
      this.status = {
        stage: "executing",
        progress: 70,
        message: `Executing ${purchaseTxs.length} purchases...`,
      };

      // 4. Execute all purchases at once
      const hashes = await this.walletCoordinator.executeBatchTransactions(
        purchaseWalletAddresses,
        purchaseTxs,
        {
          gasMultiplier: this.options.gasMultiplier,
          maxRetries: this.options.maxRetries,
          confirmations: this.options.confirmations,
          priority: "high",
        }
      );

      // Update status
      this.status = {
        stage: "completed",
        progress: 100,
        message: `Bundle launch completed. Token address: ${tokenAddress}`,
      };

      return tokenAddress;
    } catch (error) {
      // Update status to failed
      this.status = {
        stage: "failed",
        progress: 0,
        message: "Bundle launch failed",
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
