/**
 * Blockchain Types
 */

// Basic wallet configuration
export interface IWalletConfig {
  privateKey: string;
  address?: string;
}

// Buyer wallet with additional properties for token buying
export interface IBuyerWallet extends IWalletConfig {
  buyAmount: string;
  maxGasPrice?: string;
  priority?: number;
}

// ABI for createToken function
export interface ICreateTokenAbi {
  inputs: {
    internalType: string;
    name: string;
    type: string;
  }[];
  name: string;
  outputs: any[];
  stateMutability: string;
  type: string;
}

// Contract configuration
export interface IContractConfig {
  factoryAddress: string;
  abi: ICreateTokenAbi[];
  createTokenFee: string;
}

// Token contract parameters
export interface ITokenContractParams {
  createArg: string;
  signature: string;
}

// Viem Transaction Request - simplified version of viem's TransactionRequest
export interface TransactionRequest {
  to?: string;
  from?: string;
  data?: string;
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}

// Simplified version of viem's TransactionReceipt
export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: bigint;
  blockHash: string;
  status: "success" | "reverted";
  from: string;
  to?: string;
  contractAddress?: string;
  gasUsed: bigint;
}

// Gas configuration
export interface GasConfig {
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  multiplier?: number;
}
