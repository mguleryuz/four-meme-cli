/**
 * CLI Types
 */

export interface ITokenOptions {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  description: string;
  telegram?: string;
  twitter?: string;
  website?: string;
  imagePath: string;
}

export interface IBuyOptions {
  enabled: boolean;
  buyerWallets: string[];
  buyAmount: string;
  maxGasPrice?: string;
}

export interface ICreateTokenOptions extends ITokenOptions {
  buy: IBuyOptions;
}

export interface ICliOptions {
  verbose: boolean;
}

export enum CommandStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
} 