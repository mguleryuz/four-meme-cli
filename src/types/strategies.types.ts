/**
 * Strategy Types
 */

import { type ITokenOptions } from "./cli.types";
import { type TransactionRequest } from "./blockchain.types";

/**
 * Launch strategy status
 */
export interface IStrategyStatus {
  stage: "idle" | "initialized" | "executing" | "completed" | "failed";
  progress: number; // 0-100
  message?: string;
  error?: string;
}

/**
 * Base strategy options
 */
export interface IStrategyOptions {
  name: string;
  description?: string;
  gasMultiplier?: number;
  maxRetries?: number;
  confirmations?: number;
}

/**
 * Bundle strategy options
 */
export interface IBundleStrategyOptions extends IStrategyOptions {
  executeAllAtOnce: boolean;
  maxConcurrentTransactions?: number;
}

/**
 * Staggered strategy options
 */
export interface IStaggeredStrategyOptions extends IStrategyOptions {
  delayBetweenTransactions: number; // milliseconds
  waitForConfirmation: boolean;
}

/**
 * Anti-sniper strategy options
 */
export interface IAntiSniperStrategyOptions extends IStrategyOptions {
  monitorDuration: number; // milliseconds
  triggerThreshold: number; // number of external buys to trigger countermeasures
  countermeasures: "none" | "delay" | "abort" | "dump";
}

/**
 * Launch strategy interface
 */
export interface ILaunchStrategy {
  name: string;
  description: string;

  initialize(options: IStrategyOptions): Promise<void>;
  execute(tokenOptions: ITokenOptions): Promise<string>;
  getStatus(): IStrategyStatus;
  cleanup(): Promise<void>;
}

/**
 * Transaction sequencer options
 */
export interface ISequencerOptions {
  gasMultiplier?: number;
  maxRetries?: number;
  confirmations?: number;
  priority?: "low" | "medium" | "high";
}

/**
 * Transaction info
 */
export interface ITransactionInfo {
  hash: string;
  from: string;
  to: string;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  error?: string;
}

/**
 * Wallet info
 */
export interface IWalletInfo {
  address: string;
  label?: string;
  balance?: bigint;
  nonce?: number;
  priority?: number;
  isActive: boolean;
}
