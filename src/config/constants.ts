/**
 * Application Constants
 */

export const API_BASE_URL = "https://four.meme/meme-api/v1";
export const API_ENDPOINTS = {
  NONCE_GENERATE: `${API_BASE_URL}/private/user/nonce/generate`,
  LOGIN: `${API_BASE_URL}/private/user/login/dex`,
  USER_INFO: `${API_BASE_URL}/private/user/info`,
  TOKEN_UPLOAD: `${API_BASE_URL}/private/token/upload`,
  TOKEN_CREATE: `${API_BASE_URL}/private/token/create`,
  TOKEN_DETAILS: `${API_BASE_URL}/private/token/details`,
};

export const BLOCKCHAIN_CONSTANTS = {
  BNB_FACTORY_ADDRESS: "0x5c952063c7fc8610FFDB798152D69F0B9550762b",
  CREATE_TOKEN_ABI: [
    {
      inputs: [
        { internalType: "bytes", name: "createArg", type: "bytes" },
        { internalType: "bytes", name: "signature", type: "bytes" },
      ],
      name: "createToken",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
  ],
  DEFAULT_GAS_LIMIT: "1000000",
  CREATE_TOKEN_FEE: "0.009", // BNB (temporary reduced to fit into wallet balance)
};

export const DEFAULT_HEADERS = {
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.8",
  "content-type": "application/json",
  "sec-ch-ua": '"Chromium";v="134", "Not:A-Brand";v="24", "Brave";v="134"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  Referer: "https://four.meme/",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export const CLI_CONSTANTS = {
  APP_NAME: "Four Meme CLI",
  VERSION: "0.1.0",
  DESCRIPTION: "A CLI for creating and buying tokens on four.meme",
};

export const DEFAULT_TOKEN_PARAMS = {
  decimals: 18,
  description: "Created with Four Meme CLI",
  totalSupply: 1000000000,
};

export const VERIFY_TYPES = {
  LOGIN: "LOGIN",
};

export const NETWORK_CODES = {
  BSC: "BSC",
};

export const WALLET_TYPES = {
  METAMASK: "MetaMask",
};
