/**
 * Four.meme API Types
 */

export interface INonceRequest {
  accountAddress: string;
  verifyType: string;
  networkCode: string;
}

export interface INonceResponse {
  code: number;
  msg: string;
  data: string;
}

export interface IVerifyInfo {
  address: string;
  networkCode: string;
  signature: string;
  verifyType: string;
}

export interface ILoginRequest {
  region: string;
  langType: string;
  loginIp: string;
  inviteCode: string;
  verifyInfo: IVerifyInfo;
  walletName: string;
}

export interface ILoginResponse {
  code: number;
  msg: string;
  data: string;
}

export interface IUserInfoResponse {
  code: number;
  msg: string;
  data: {
    userId: number;
    avatarPath: string;
    email: string;
    address: string;
    userName: string;
    isLoginDisable: boolean;
    isTradeDisable: boolean;
    isBuffSocial: boolean;
    isBuffInvite: boolean;
    isBuffActivity: boolean;
  };
}

export interface ITokenUploadResponse {
  code: number;
  msg: string;
  data: {
    url: string;
  };
}

export interface ITokenCreateRequest {
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  totalSupply: string;
  description: string;
  tgLink?: string;
  xLink?: string;
  websiteLink?: string;
  logoUrl: string;
}

export interface ITokenCreateResponse {
  code: number;
  msg: string;
  data: {
    tokenId: string;
    tokenAddress?: string;
  };
}

// Token details response
export interface ITokenDetailsResponse {
  code: number;
  msg: string;
  data: {
    tokenId: string;
    contractAddress?: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    description?: string;
    logoUrl?: string;
    tgLink?: string;
    xLink?: string;
    websiteLink?: string;
    createdAt: string;
    status: string;
  };
}

export interface IApiHeaders {
  [key: string]: string;
}
