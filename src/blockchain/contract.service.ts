import { Contract, parseEther } from "ethers";
import type { Wallet } from "ethers";
import { BLOCKCHAIN_CONSTANTS } from "../config/constants";
import type { ITokenContractParams } from "../types";

/**
 * Contract service for handling smart contract interactions
 */
export class ContractService {
  private factoryAddress: string;
  private factoryAbi: any[];

  constructor(factoryAddress = BLOCKCHAIN_CONSTANTS.BNB_FACTORY_ADDRESS) {
    this.factoryAddress = factoryAddress;
    this.factoryAbi = BLOCKCHAIN_CONSTANTS.CREATE_TOKEN_ABI;
  }

  /**
   * Create a token contract through the factory
   * @param wallet Wallet to use for contract creation
   * @param createParams Creation parameters
   * @returns Transaction hash
   */
  async createToken(
    wallet: Wallet,
    createParams: ITokenContractParams
  ): Promise<string> {
    const contract = new Contract(this.factoryAddress, this.factoryAbi, wallet);

    // Estimate gas to ensure transaction succeeds
    const gasLimit = await contract.createToken.estimateGas(
      createParams.createArg,
      createParams.signature,
      { value: parseEther(BLOCKCHAIN_CONSTANTS.CREATE_TOKEN_FEE) }
    );

    // Create the token
    const tx = await contract.createToken(
      createParams.createArg,
      createParams.signature,
      {
        value: parseEther(BLOCKCHAIN_CONSTANTS.CREATE_TOKEN_FEE),
        gasLimit: Math.floor(Number(gasLimit) * 1.2), // Add 20% buffer to gas estimate
      }
    );

    return tx.hash;
  }

  /**
   * Buy tokens from a token contract
   * @param wallet Wallet to use for purchase
   * @param tokenAddress Address of token contract
   * @param amount Amount to buy in BNB
   * @returns Transaction hash
   */
  async buyTokens(
    wallet: Wallet,
    tokenAddress: string,
    amount: string
  ): Promise<string> {
    // Send transaction to buy tokens (simply sending BNB to token address)
    const tx = await wallet.sendTransaction({
      to: tokenAddress,
      value: parseEther(amount),
    });

    return tx.hash;
  }

  /**
   * Check if a token contract has been deployed
   * @param wallet Wallet to use for checking
   * @param tokenAddress Token address to check
   * @returns Whether the contract exists
   */
  async isContractDeployed(
    wallet: Wallet,
    tokenAddress: string
  ): Promise<boolean> {
    try {
      const code = await wallet.provider.getCode(tokenAddress);
      return code !== "0x"; // If contract exists, code will not be empty
    } catch (error) {
      return false;
    }
  }
}
