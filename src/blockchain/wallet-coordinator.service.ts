import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";
import {
  type TransactionRequest,
  type TransactionReceipt,
  type IWalletInfo,
  type ISequencerOptions,
} from "../types";

/**
 * Wallet Coordinator Service
 * Manages multiple wallets and coordinates transactions
 */
export class WalletCoordinatorService {
  private wallets: Map<string, IWalletInfo> = new Map();
  private clients: Map<string, any> = new Map();
  private rpcUrl: string;
  private chain: any;
  private defaultOptions: ISequencerOptions = {
    gasMultiplier: 1.2,
    maxRetries: 3,
    confirmations: 1,
    priority: "medium",
  };

  /**
   * Constructor
   * @param rpcUrl RPC URL for blockchain connection
   */
  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
    this.chain = bsc;
  }

  /**
   * Add a wallet to the coordinator
   * @param privateKey Private key of the wallet
   * @param label Optional label for the wallet
   * @returns Address of the added wallet
   */
  async addWallet(privateKey: string, label?: string): Promise<string> {
    try {
      // Create account from private key
      const account = privateKeyToAccount(privateKey as `0x${string}`);
      const address = account.address;

      // Create client
      const client = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.rpcUrl),
      });

      // Get balance
      const publicClient = client.extend((c) => ({
        getBalance: async () => {
          return (await c.request({
            method: "eth_getBalance",
            params: [address, "latest"],
          })) as bigint;
        },
      }));

      const balance = await publicClient.getBalance();

      // Store wallet info
      const walletInfo: IWalletInfo = {
        address,
        label: label || address.substring(0, 8),
        balance,
        isActive: true,
        priority: this.wallets.size, // Default priority based on order added
      };

      this.wallets.set(address, walletInfo);
      this.clients.set(address, client);

      return address;
    } catch (error) {
      throw new Error(
        `Failed to add wallet: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Add multiple wallets to the coordinator
   * @param privateKeys Array of private keys
   * @param labels Optional array of labels
   * @returns Array of wallet addresses
   */
  async addWallets(
    privateKeys: string[],
    labels?: string[]
  ): Promise<string[]> {
    const addresses: string[] = [];

    for (let i = 0; i < privateKeys.length; i++) {
      const label = labels && i < labels.length ? labels[i] : undefined;
      const address = await this.addWallet(privateKeys[i], label);
      addresses.push(address);
    }

    return addresses;
  }

  /**
   * Get all wallet addresses
   * @returns Array of wallet addresses
   */
  getWalletAddresses(): string[] {
    return Array.from(this.wallets.keys());
  }

  /**
   * Get wallet info
   * @param address Wallet address
   * @returns Wallet info
   */
  getWalletInfo(address: string): IWalletInfo | undefined {
    return this.wallets.get(address);
  }

  /**
   * Update wallet balances
   * @returns Map of wallet addresses to balances
   */
  async updateBalances(): Promise<Map<string, bigint>> {
    const balances = new Map<string, bigint>();

    for (const [address, client] of this.clients.entries()) {
      try {
        const publicClient = client.extend((c: any) => ({
          getBalance: async () => {
            return (await c.request({
              method: "eth_getBalance",
              params: [address, "latest"],
            })) as bigint;
          },
        }));

        const balance = await publicClient.getBalance();

        // Update wallet info
        const walletInfo = this.wallets.get(address);
        if (walletInfo) {
          walletInfo.balance = balance;
          this.wallets.set(address, walletInfo);
        }

        balances.set(address, balance);
      } catch (error) {
        console.error(`Failed to update balance for ${address}:`, error);
      }
    }

    return balances;
  }

  /**
   * Execute a transaction
   * @param walletAddress Wallet address to use
   * @param txData Transaction data
   * @param options Transaction options
   * @returns Transaction hash
   */
  async executeTransaction(
    walletAddress: string,
    txData: TransactionRequest,
    options?: ISequencerOptions
  ): Promise<string> {
    const walletInfo = this.wallets.get(walletAddress);
    if (!walletInfo) {
      throw new Error(`Wallet not found: ${walletAddress}`);
    }

    const client = this.clients.get(walletAddress);
    if (!client) {
      throw new Error(`Client not found for wallet: ${walletAddress}`);
    }

    // Merge default options with provided options
    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      // Prepare transaction with gas estimation
      const prepared = await this.prepareTransaction(
        client,
        txData,
        mergedOptions
      );

      // Send transaction
      const hash = await client.sendTransaction(prepared);

      return hash;
    } catch (error) {
      throw new Error(
        `Transaction execution failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Execute batch transactions
   * @param walletAddresses Array of wallet addresses
   * @param txDataArray Array of transaction data
   * @param options Transaction options
   * @returns Array of transaction hashes
   */
  async executeBatchTransactions(
    walletAddresses: string[],
    txDataArray: TransactionRequest[],
    options?: ISequencerOptions
  ): Promise<string[]> {
    if (walletAddresses.length !== txDataArray.length) {
      throw new Error("Number of wallets must match number of transactions");
    }

    const hashes: string[] = [];
    const promises: Promise<string>[] = [];

    for (let i = 0; i < walletAddresses.length; i++) {
      promises.push(
        this.executeTransaction(walletAddresses[i], txDataArray[i], options)
          .then((hash) => {
            hashes[i] = hash;
            return hash;
          })
          .catch((error) => {
            console.error(
              `Transaction failed for wallet ${walletAddresses[i]}:`,
              error
            );
            throw error;
          })
      );
    }

    await Promise.all(promises);
    return hashes;
  }

  /**
   * Execute sequential transactions with delay
   * @param walletAddresses Array of wallet addresses
   * @param txDataArray Array of transaction data
   * @param delayMs Delay between transactions in milliseconds
   * @param options Transaction options
   * @returns Array of transaction hashes
   */
  async executeSequentialTransactions(
    walletAddresses: string[],
    txDataArray: TransactionRequest[],
    delayMs: number,
    options?: ISequencerOptions
  ): Promise<string[]> {
    if (walletAddresses.length !== txDataArray.length) {
      throw new Error("Number of wallets must match number of transactions");
    }

    const hashes: string[] = [];

    for (let i = 0; i < walletAddresses.length; i++) {
      const hash = await this.executeTransaction(
        walletAddresses[i],
        txDataArray[i],
        options
      );
      hashes.push(hash);

      if (i < walletAddresses.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return hashes;
  }

  /**
   * Wait for transaction confirmation
   * @param txHash Transaction hash
   * @param confirmations Number of confirmations to wait for
   * @returns Transaction receipt
   */
  async waitForConfirmation(
    txHash: string,
    confirmations: number = 1
  ): Promise<TransactionReceipt | null> {
    // Getting the first client for simplicity
    const firstClientEntry = this.clients.entries().next().value;
    if (!firstClientEntry) {
      throw new Error("No clients available for confirmation check");
    }

    const [, client] = firstClientEntry;
    const publicClient = client.extend((c: any) => ({
      waitForTransactionReceipt: async (
        hash: string,
        { confirmations = 1 }: { confirmations?: number } = {}
      ) => {
        // Simple polling implementation
        let receipt = null;

        while (!receipt) {
          try {
            const result = await c.request({
              method: "eth_getTransactionReceipt",
              params: [hash],
            });

            if (result) {
              receipt = {
                transactionHash: result.transactionHash,
                blockNumber: BigInt(result.blockNumber),
                blockHash: result.blockHash,
                status: result.status === "0x1" ? "success" : "reverted",
                from: result.from,
                to: result.to,
                contractAddress: result.contractAddress,
                gasUsed: BigInt(result.gasUsed),
              };

              // Check confirmations
              const currentBlock = await c.request({
                method: "eth_blockNumber",
                params: [],
              });

              const currentBlockNumber = BigInt(currentBlock);
              const receiptBlockNumber = BigInt(result.blockNumber);
              const confirmedBlocks =
                currentBlockNumber - receiptBlockNumber + 1n;

              if (confirmedBlocks >= BigInt(confirmations)) {
                return receipt;
              }
            }
          } catch (error) {
            console.error("Error checking receipt:", error);
          }

          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        return receipt;
      },
    }));

    try {
      const receipt = await publicClient.waitForTransactionReceipt(txHash, {
        confirmations,
      });
      return receipt;
    } catch (error) {
      console.error(`Failed to wait for confirmation of ${txHash}:`, error);
      return null;
    }
  }

  /**
   * Prepare transaction with gas estimation
   * @param client Wallet client
   * @param txData Transaction data
   * @param options Transaction options
   * @returns Prepared transaction
   */
  private async prepareTransaction(
    client: any,
    txData: TransactionRequest,
    options: ISequencerOptions
  ): Promise<any> {
    try {
      // Clone transaction data to avoid modifying original
      const tx = { ...txData };

      // Get gas parameters from provider if not provided
      if (!tx.gas) {
        const gasEstimate = await client.request({
          method: "eth_estimateGas",
          params: [tx],
        });

        // Apply gas multiplier
        const multiplier = options.gasMultiplier || 1.2;
        tx.gas = BigInt(Math.floor(Number(gasEstimate) * multiplier));
      }

      // Apply priority-based gas pricing if not explicitly set
      if (!tx.gasPrice && !tx.maxFeePerGas) {
        const feeData = await client.request({
          method: "eth_gasPrice",
          params: [],
        });

        const baseGasPrice = BigInt(feeData);

        // Adjust based on priority
        let multiplier = 1.0;
        if (options.priority === "high") {
          multiplier = 1.5;
        } else if (options.priority === "low") {
          multiplier = 0.8;
        }

        tx.gasPrice = BigInt(Math.floor(Number(baseGasPrice) * multiplier));
      }

      return tx;
    } catch (error) {
      throw new Error(
        `Transaction preparation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
