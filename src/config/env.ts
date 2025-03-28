import dotenv from "dotenv";
import type { IWalletConfig, IBuyerWallet } from "../types";

// Load environment variables from .env file
dotenv.config();

interface EnvConfig {
  primaryWallet: IWalletConfig;
  buyerWallets: IBuyerWallet[];
  bscRpcUrl: string;
  bscChainId: number;
  factoryAddress: string;
  logLevel: string;
  isDevelopment: boolean;
}

/**
 * Load wallet configurations from environment variables
 */
function loadWalletConfigs(): {
  primaryWallet: IWalletConfig;
  buyerWallets: IBuyerWallet[];
} {
  const primaryWalletKey = process.env.PRIMARY_WALLET_PRIVATE_KEY;

  // In development mode with --help, allow dummy private keys
  const isDev =
    process.argv.includes("--help") || process.env.NODE_ENV === "development";

  if (!primaryWalletKey && !isDev) {
    throw new Error(
      "PRIMARY_WALLET_PRIVATE_KEY environment variable is required"
    );
  }

  const primaryWallet: IWalletConfig = {
    privateKey:
      primaryWalletKey ||
      "0x0000000000000000000000000000000000000000000000000000000000000000",
  };

  // Load buyer wallets from environment variables
  const buyerWallets: IBuyerWallet[] = [];
  let walletIndex = 1;

  while (true) {
    const walletKey = process.env[`BUYER_WALLET_${walletIndex}_PRIVATE_KEY`];
    if (!walletKey) break;

    buyerWallets.push({
      privateKey: walletKey,
      buyAmount: "0.1", // Default buy amount, can be overridden by CLI
      priority: walletIndex,
    });

    walletIndex++;
  }

  return { primaryWallet, buyerWallets };
}

/**
 * Load and validate environment configuration
 */
export function loadEnvConfig(): EnvConfig {
  const { primaryWallet, buyerWallets } = loadWalletConfigs();

  const bscRpcUrl =
    process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/";
  const bscChainId = parseInt(process.env.BSC_CHAIN_ID || "56");
  const factoryAddress =
    process.env.FACTORY_ADDRESS || "0x5c952063c7fc8610FFDB798152D69F0B9550762b";
  const logLevel = process.env.LOG_LEVEL || "info";
  const isDevelopment =
    process.env.NODE_ENV === "development" || process.argv.includes("--help");

  return {
    primaryWallet,
    buyerWallets,
    bscRpcUrl,
    bscChainId,
    factoryAddress,
    logLevel,
    isDevelopment,
  };
}

// Export the environment configuration
export const envConfig = loadEnvConfig();
