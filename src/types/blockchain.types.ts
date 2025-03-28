/**
 * Blockchain Types
 */

export interface IWalletConfig {
  privateKey: string;
  address?: string;
}

export interface IBuyerWallet extends IWalletConfig {
  buyAmount: string;
  maxGasPrice?: string;
  priority?: number;
}

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

export interface IContractConfig {
  factoryAddress: string;
  abi: ICreateTokenAbi[];
  createTokenFee: string;
}

export interface ITokenContractParams {
  createArg: string;
  signature: string;
} 