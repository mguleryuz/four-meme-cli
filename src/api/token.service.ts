import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { API_ENDPOINTS } from "../config/constants";
import type {
  ITokenCreateRequest,
  ITokenCreateResponse,
  ITokenUploadResponse,
  ITokenDetailsResponse,
  IApiHeaders,
} from "../types";
import { AuthService } from "./auth.service";

/**
 * Token Service for Four.meme
 */
export class TokenService {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  /**
   * Upload an image to Four.meme
   * @param imagePath Path to the image file
   * @returns URL of the uploaded image
   */
  async uploadImage(imagePath: string): Promise<string> {
    if (!this.authService.getAccessToken()) {
      throw new Error("Not authenticated. Please login first.");
    }

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("file", fs.createReadStream(imagePath));

    // Prepare headers for image upload
    const uploadHeaders: IApiHeaders = {
      ...this.authService.getHeaders(),
      ...formData.getHeaders(),
    };

    try {
      const response = await axios.post<ITokenUploadResponse>(
        API_ENDPOINTS.TOKEN_UPLOAD,
        formData,
        { headers: uploadHeaders }
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to upload image: ${response.data.msg}`);
      }

      return response.data.data.url;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Image upload failed: ${error.message}`);
      }
      throw new Error("Image upload failed with unknown error");
    }
  }

  /**
   * Create a token on Four.meme
   * @param tokenData Token creation parameters
   * @returns Token ID and address
   */
  async createToken(
    tokenData: ITokenCreateRequest
  ): Promise<{ tokenId: string; tokenAddress?: string }> {
    if (!this.authService.getAccessToken()) {
      throw new Error("Not authenticated. Please login first.");
    }

    try {
      const response = await axios.post<ITokenCreateResponse>(
        API_ENDPOINTS.TOKEN_CREATE,
        tokenData,
        { headers: this.authService.getHeaders() }
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to create token: ${response.data.msg}`);
      }

      return response.data.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Token creation failed: ${error.message}`);
      }
      throw new Error("Token creation failed with unknown error");
    }
  }

  /**
   * Get token details from Four.meme API
   * @param tokenId Token ID to get details for
   * @returns Token details including contract address
   */
  async getTokenDetails(
    tokenId: string
  ): Promise<{ tokenId: string; tokenAddress?: string }> {
    if (!this.authService.getAccessToken()) {
      throw new Error("Not authenticated. Please login first.");
    }

    try {
      // Construct the token details URL with the tokenId
      const url = `${API_ENDPOINTS.TOKEN_DETAILS}/${tokenId}`;

      const response = await axios.get<ITokenDetailsResponse>(url, {
        headers: this.authService.getHeaders(),
      });

      if (response.data.code !== 0) {
        throw new Error(`Failed to get token details: ${response.data.msg}`);
      }

      return {
        tokenId: response.data.data.tokenId,
        tokenAddress: response.data.data.contractAddress,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get token details: ${error.message}`);
      }
      throw new Error("Failed to get token details with unknown error");
    }
  }
}
