import { Wallet, JsonRpcProvider } from "ethers";
import type { IWalletConfig, IBuyerWallet } from "../types";
import { envConfig } from "../config";

/**
 * Wallet service for handling blockchain wallet operations
 */
export class WalletService {
  private provider: JsonRpcProvider;
  private primaryWallet: Wallet | null = null;
  private buyerWallets: Wallet[] = [];
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = envConfig.isDevelopment;
    this.provider = new JsonRpcProvider(envConfig.bscRpcUrl);

    // Only initialize wallets if not in development mode or help command
    if (!this.isDevelopment) {
      this.initializeWallets();
    }
  }

  /**
   * Initialize wallets from configuration
   */
  private initializeWallets(): void {
    // Create primary wallet
    try {
      this.primaryWallet = new Wallet(
        envConfig.primaryWallet.privateKey,
        this.provider
      );
    } catch (error) {
      throw new Error(
        "Failed to initialize primary wallet. Check your private key."
      );
    }

    // Create buyer wallets
    this.buyerWallets = envConfig.buyerWallets.map((config) => {
      try {
        return new Wallet(config.privateKey, this.provider);
      } catch (error) {
        throw new Error(
          `Failed to initialize buyer wallet. Check your private key.`
        );
      }
    });
  }

  /**
   * Get the primary wallet
   */
  getPrimaryWallet(): Wallet {
    if (this.isDevelopment) {
      // Return a dummy wallet for development mode
      return Wallet.createRandom().connect(this.provider);
    }

    if (!this.primaryWallet) {
      this.initializeWallets();
    }

    if (!this.primaryWallet) {
      throw new Error("Primary wallet not initialized");
    }

    return this.primaryWallet;
  }

  /**
   * Get all buyer wallets
   */
  getBuyerWallets(): Wallet[] {
    if (this.isDevelopment) {
      // Return dummy wallets for development mode
      return [Wallet.createRandom().connect(this.provider)];
    }

    if (this.buyerWallets.length === 0 && !this.isDevelopment) {
      this.initializeWallets();
    }

    return this.buyerWallets;
  }

  /**
   * Get the provider
   */
  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  /**
   * Check if wallet has sufficient balance for operations
   * @param wallet Wallet to check
   * @param requiredBalance Required balance in ETH
   */
  async hasEnoughBalance(
    wallet: Wallet,
    requiredBalance: string
  ): Promise<boolean> {
    if (this.isDevelopment) {
      return true; // Always return true in development mode
    }

    const balance = await this.provider.getBalance(wallet.getAddress());
    const requiredWei = BigInt(parseFloat(requiredBalance) * 1e18);
    return balance >= requiredWei;
  }
}
