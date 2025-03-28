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
  contractAddress?: string; // Token contract address once deployed
  createArg?: string; // Encoded function call for token creation
  buy?: IBuyOptions; // Buy options
}

/**
 * Buy Options
 */
export interface IBuyOptions {
  enabled: boolean;
  buyerWallets: string[];
  buyAmount: string;
  maxGasPrice?: string;
}

/**
 * Strategy configuration
 */
export interface IStrategyConfig {
  type: string;
  options: IStrategyOptionsConfig;
}

/**
 * Strategy options configuration
 */
export interface IStrategyOptionsConfig {
  name?: string;
  // Bundle options
  executeAllAtOnce?: boolean;

  // Staggered options
  delayBetweenTransactions?: number;
  waitForConfirmation?: boolean;

  // Anti-sniper options
  monitorDuration?: number;
  triggerThreshold?: number;
  countermeasures?: "none" | "delay" | "abort" | "dump";

  // Common options
  gasMultiplier?: number;
}

export interface ICreateTokenOptions extends ITokenOptions {
  buy: IBuyOptions;
  strategy: IStrategyConfig;
}

export interface ICliOptions {
  verbose: boolean;
}

export enum CommandStatus {
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  FAILED = "failed",
}
