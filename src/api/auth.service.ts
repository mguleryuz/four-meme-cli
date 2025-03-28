import axios from "axios";
import type { Wallet } from "ethers";
import {
  API_ENDPOINTS,
  DEFAULT_HEADERS,
  NETWORK_CODES,
  VERIFY_TYPES,
  WALLET_TYPES,
} from "../config/constants";
import type {
  INonceRequest,
  INonceResponse,
  ILoginRequest,
  ILoginResponse,
  IUserInfoResponse,
  IApiHeaders,
} from "../types";

/**
 * Authentication Service for Four.meme
 */
export class AuthService {
  private accessToken: string | null = null;
  private headers: IApiHeaders = { ...DEFAULT_HEADERS };

  /**
   * Generate a nonce for SIWE authentication
   * @param address Wallet address to authenticate
   * @returns Nonce from server
   */
  async generateNonce(address: string): Promise<string> {
    const requestBody: INonceRequest = {
      accountAddress: address,
      verifyType: VERIFY_TYPES.LOGIN,
      networkCode: NETWORK_CODES.BSC,
    };

    const response = await axios.post<INonceResponse>(
      API_ENDPOINTS.NONCE_GENERATE,
      requestBody,
      { headers: this.headers }
    );

    if (response.data.code !== 0) {
      throw new Error(`Failed to generate nonce: ${response.data.msg}`);
    }

    return response.data.data;
  }

  /**
   * Sign in with Ethereum
   * @param wallet Ethers.js wallet to sign the nonce
   * @returns Access token from server
   */
  async login(wallet: Wallet): Promise<string> {
    const address = await wallet.getAddress();
    const nonce = await this.generateNonce(address);

    // Create the message to sign
    const message = `I am signing my one-time nonce: ${nonce}`;

    // Sign the message with the wallet
    const signature = await wallet.signMessage(message);

    const requestBody: ILoginRequest = {
      region: "WEB",
      langType: "EN",
      loginIp: "",
      inviteCode: "",
      verifyInfo: {
        address,
        networkCode: NETWORK_CODES.BSC,
        signature,
        verifyType: VERIFY_TYPES.LOGIN,
      },
      walletName: WALLET_TYPES.METAMASK,
    };

    const response = await axios.post<ILoginResponse>(
      API_ENDPOINTS.LOGIN,
      requestBody,
      { headers: this.headers }
    );

    if (response.data.code !== 0) {
      throw new Error(`Failed to login: ${response.data.msg}`);
    }

    // Store the access token for future requests
    this.accessToken = response.data.data;

    // Update headers with the new access token
    this.updateHeaders();

    return this.accessToken;
  }

  /**
   * Get user information
   * @returns User info from server
   */
  async getUserInfo(): Promise<IUserInfoResponse["data"]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated. Please login first.");
    }

    const response = await axios.get<IUserInfoResponse>(
      API_ENDPOINTS.USER_INFO,
      { headers: this.headers }
    );

    if (response.data.code !== 0) {
      throw new Error(`Failed to get user info: ${response.data.msg}`);
    }

    return response.data.data;
  }

  /**
   * Update request headers with the current access token
   */
  private updateHeaders() {
    if (this.accessToken) {
      this.headers = {
        ...this.headers,
        "meme-web-access": this.accessToken,
        cookie: `meme-web-access=${this.accessToken}; user_token=${this.accessToken}`,
      };
    }
  }

  /**
   * Get the current request headers
   * @returns Headers object for API requests
   */
  getHeaders(): IApiHeaders {
    return this.headers;
  }

  /**
   * Get the current access token
   * @returns Access token or null if not authenticated
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Set an access token manually (useful for reconnecting with a saved token)
   * @param token Access token to set
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.updateHeaders();
  }
}
