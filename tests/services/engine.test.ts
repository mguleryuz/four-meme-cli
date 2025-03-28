import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import { EngineService } from "../../src/services/engine.service";
import { AuthService } from "../../src/api/auth.service";
import { TokenService } from "../../src/api/token.service";
import { WalletService } from "../../src/blockchain/wallet.service";
import { ContractService } from "../../src/blockchain/contract.service";
import { StrategyFactoryService } from "../../src/services/strategy-factory.service";
import {
  type ICreateTokenOptions,
  type IStrategyConfig,
  type ITokenOptions,
  type ITokenCreateRequest,
  type ILaunchStrategy,
} from "../../src/types";
import { createMockTokenOptions } from "../test-utils";

// Create a testable subclass of EngineService where we can inject mocks
class TestableEngineService extends EngineService {
  constructor(
    mockAuthService: AuthService,
    mockTokenService: TokenService,
    mockWalletService: WalletService,
    mockContractService: ContractService,
    mockStrategyFactory: StrategyFactoryService
  ) {
    super();
    // Override the private fields with our mocks
    Object.defineProperty(this, "authService", { value: mockAuthService });
    Object.defineProperty(this, "tokenService", { value: mockTokenService });
    Object.defineProperty(this, "walletService", { value: mockWalletService });
    Object.defineProperty(this, "contractService", {
      value: mockContractService,
    });
    Object.defineProperty(this, "strategyFactory", {
      value: mockStrategyFactory,
    });
  }
}

describe("EngineService", () => {
  let engineService: TestableEngineService;
  let mockAuthService: any;
  let mockTokenService: any;
  let mockWalletService: any;
  let mockContractService: any;
  let mockStrategyFactory: any;
  let mockStrategy: any;
  const mockTokenOptions = createMockTokenOptions();

  // Convert the basic token options to create token options
  const mockCreateTokenOptions: ICreateTokenOptions = {
    ...mockTokenOptions,
    buy: {
      enabled: true,
      buyerWallets: [],
      buyAmount: "0.1",
    },
    strategy: {
      type: "bundle",
      options: {
        executeAllAtOnce: true,
      },
    },
  };

  beforeEach(() => {
    // Create mocks for all dependencies
    mockAuthService = {
      login: mock(async () => true),
      getUserInfo: mock(async () => ({ address: "0xMockAddress" })),
      getAccessToken: mock(() => "mock-token"),
    };

    mockTokenService = {
      uploadImage: mock(async () => "https://example.com/image.png"),
      createToken: mock(async () => ({
        tokenId: "123",
        tokenAddress: "0x1234567890abcdef",
      })),
      getTokenDetails: mock(() => ({
        tokenAddress: "0x1234567890abcdef",
      })),
    };

    mockWalletService = {
      getPrimaryWallet: mock(() => ({
        getAddress: mock(async () => "0xMockAddress"),
        signMessage: mock(async () => "0xSignature"),
      })),
      getBuyerWallets: mock(() => []),
    };

    mockContractService = {
      buyTokens: mock(async () => "0xTransactionHash"),
    };

    // Create mock strategy and strategy factory
    mockStrategy = {
      initialize: mock(async () => {}),
      execute: mock(async () => "0x1234567890abcdef"),
      cleanup: mock(async () => {}),
    };

    mockStrategyFactory = {
      createStrategy: mock(async () => mockStrategy),
    };

    // Create engine service with mocks
    engineService = new TestableEngineService(
      mockAuthService as unknown as AuthService,
      mockTokenService as unknown as TokenService,
      mockWalletService as unknown as WalletService,
      mockContractService as unknown as ContractService,
      mockStrategyFactory as unknown as StrategyFactoryService
    );
  });

  afterEach(() => {
    mock.restore();
  });

  describe("initialize", () => {
    it("should initialize the engine by authenticating", async () => {
      await engineService.initialize();

      expect(mockWalletService.getPrimaryWallet).toHaveBeenCalled();
      expect(mockAuthService.login).toHaveBeenCalled();
      expect(mockAuthService.getUserInfo).toHaveBeenCalled();
    });
  });

  describe("createToken", () => {
    it("should create a token with the specified options", async () => {
      // Act
      const result = await engineService.createToken(mockCreateTokenOptions);

      // Assert
      expect(result).toBe("0x1234567890abcdef");
      expect(mockTokenService.uploadImage).toHaveBeenCalledWith(
        mockCreateTokenOptions.imagePath
      );
      expect(mockTokenService.createToken).toHaveBeenCalled();
    });

    it("should handle optional social links", async () => {
      // Arrange
      const tokenOptions: ICreateTokenOptions = {
        ...mockCreateTokenOptions,
        telegram: "https://t.me/example",
        twitter: "https://twitter.com/example",
        website: "https://example.com",
      };

      // Act
      await engineService.createToken(tokenOptions);

      // Assert
      const createTokenCall = mockTokenService.createToken.mock.calls[0][0];
      expect(createTokenCall.tgLink).toBe("https://t.me/example");
      expect(createTokenCall.xLink).toBe("https://twitter.com/example");
      expect(createTokenCall.websiteLink).toBe("https://example.com");
    });

    it("should wait for token address if not immediately available", async () => {
      // Arrange
      mockTokenService.createToken = mock(async () => ({
        tokenId: "123",
        tokenAddress: null, // No address yet
      }));

      // Create a spy on the waitForTokenAddress method
      const waitSpy = mock(async () => "0xWaitedForAddress");

      // Use Object.defineProperty to override the private method
      Object.defineProperty(engineService, "waitForTokenAddress", {
        value: waitSpy,
        writable: true,
        configurable: true,
      });

      // Act
      const result = await engineService.createToken(mockCreateTokenOptions);

      // Assert
      expect(waitSpy).toHaveBeenCalledWith("123");
      expect(result).toBe("0xWaitedForAddress");
    });

    it("should handle bundle strategy type", async () => {
      // Arrange
      const strategyConfig: IStrategyConfig = {
        type: "bundle",
        options: {
          executeAllAtOnce: true,
          gasMultiplier: 2.0,
        },
      };

      const createTokenOptions: ICreateTokenOptions = {
        ...mockCreateTokenOptions,
        strategy: strategyConfig,
      };

      // Act
      await engineService.createToken(createTokenOptions);

      // Assert
      expect(mockStrategyFactory.createStrategy).toHaveBeenCalled();
      expect(mockStrategy.execute).toHaveBeenCalled();
    });

    it("should handle staggered strategy type", async () => {
      // Arrange
      const strategyConfig: IStrategyConfig = {
        type: "staggered",
        options: {
          delayBetweenTransactions: 1000,
          waitForConfirmation: true,
        },
      };

      const createTokenOptions: ICreateTokenOptions = {
        ...mockCreateTokenOptions,
        strategy: strategyConfig,
      };

      // Act
      await engineService.createToken(createTokenOptions);

      // Assert
      expect(mockStrategyFactory.createStrategy).toHaveBeenCalled();
      expect(mockStrategy.execute).toHaveBeenCalled();
    });

    it("should handle anti-sniper strategy type", async () => {
      // Arrange
      const strategyConfig: IStrategyConfig = {
        type: "anti-sniper",
        options: {
          monitorDuration: 5000,
          triggerThreshold: 3,
          countermeasures: "delay" as const,
        },
      };

      const createTokenOptions: ICreateTokenOptions = {
        ...mockCreateTokenOptions,
        strategy: strategyConfig,
      };

      // Act
      await engineService.createToken(createTokenOptions);

      // Assert
      expect(mockStrategyFactory.createStrategy).toHaveBeenCalled();
      expect(mockStrategy.execute).toHaveBeenCalled();
    });

    it("should throw an error for invalid strategy type", async () => {
      // Arrange
      const createTokenOptions: ICreateTokenOptions = {
        ...mockCreateTokenOptions,
        strategy: {
          type: "invalid-strategy" as any,
          options: {},
        },
      };

      // Mock createStrategy to throw an error for invalid strategy
      mockStrategyFactory.createStrategy = mock(async () => {
        throw new Error("Unsupported strategy type: invalid-strategy");
      });

      // Act & Assert
      await expect(
        engineService.createToken(createTokenOptions)
      ).rejects.toThrow("Unsupported strategy type: invalid-strategy");
    });

    it("should clean up the strategy after execution", async () => {
      // Arrange
      const createTokenOptions: ICreateTokenOptions = {
        ...mockCreateTokenOptions,
        strategy: {
          type: "bundle",
          options: {},
        },
      };

      // Act
      await engineService.createToken(createTokenOptions);

      // Assert
      expect(mockStrategy.cleanup).toHaveBeenCalled();
    });

    it("should call cleanup even if execution fails", async () => {
      // Arrange
      const createTokenOptions: ICreateTokenOptions = {
        ...mockCreateTokenOptions,
        strategy: {
          type: "bundle",
          options: {},
        },
      };

      // Mock token and contract deployment to succeed
      mockTokenService.createToken.mockResolvedValue({ id: "123" });
      mockTokenService.getTokenDetails.mockResolvedValue({
        tokenAddress: "0x1234567890abcdef",
      });

      // Mock execution to throw an error
      mockStrategy.execute = mock(() => {
        throw new Error("Execution failed");
      });

      // Act
      await engineService.createToken(createTokenOptions);

      // Assert - just verify that cleanup was called
      expect(mockStrategy.cleanup).toHaveBeenCalled();
    });
  });

  describe("buyTokens", () => {
    it("should not buy tokens if buying is disabled", async () => {
      // Arrange
      const buyOptions = {
        enabled: false,
        buyerWallets: ["wallet1", "wallet2"],
        buyAmount: "0.1",
      };

      // Act
      await engineService.buyTokens("0xTokenAddress", buyOptions);

      // Assert
      expect(mockWalletService.getBuyerWallets).not.toHaveBeenCalled();
      expect(mockContractService.buyTokens).not.toHaveBeenCalled();
    });

    it("should not buy tokens if no buyer wallets are configured", async () => {
      // Arrange
      const buyOptions = {
        enabled: true,
        buyerWallets: [],
        buyAmount: "0.1",
      };

      // Act
      await engineService.buyTokens("0xTokenAddress", buyOptions);

      // Assert
      expect(mockWalletService.getBuyerWallets).not.toHaveBeenCalled();
      expect(mockContractService.buyTokens).not.toHaveBeenCalled();
    });

    it("should buy tokens with each wallet", async () => {
      // Arrange
      const buyOptions = {
        enabled: true,
        buyerWallets: ["wallet1", "wallet2"],
        buyAmount: "0.1",
      };

      const buyerWallets = [
        {
          getAddress: mock(async () => "0xWallet1"),
          signMessage: mock(async () => "0xSignature1"),
        },
        {
          getAddress: mock(async () => "0xWallet2"),
          signMessage: mock(async () => "0xSignature2"),
        },
      ];

      mockWalletService.getBuyerWallets = mock(() => buyerWallets);

      // Act
      await engineService.buyTokens("0xTokenAddress", buyOptions);

      // Assert
      expect(mockWalletService.getBuyerWallets).toHaveBeenCalled();
      expect(mockContractService.buyTokens).toHaveBeenCalledTimes(2);
      expect(mockContractService.buyTokens).toHaveBeenCalledWith(
        buyerWallets[0],
        "0xTokenAddress",
        "0.1"
      );
      expect(mockContractService.buyTokens).toHaveBeenCalledWith(
        buyerWallets[1],
        "0xTokenAddress",
        "0.1"
      );
    });

    it("should handle errors when buying tokens", async () => {
      // Arrange
      const buyOptions = {
        enabled: true,
        buyerWallets: ["wallet1", "wallet2"],
        buyAmount: "0.1",
      };

      const buyerWallets = [
        {
          getAddress: mock(async () => "0xWallet1"),
          signMessage: mock(async () => "0xSignature1"),
        },
      ];

      mockWalletService.getBuyerWallets = mock(() => buyerWallets);
      mockContractService.buyTokens = mock(async () => {
        throw new Error("Failed to buy tokens");
      });

      // Act - we don't expect the function to throw due to error handling within the method
      await engineService.buyTokens("0xTokenAddress", buyOptions);

      // Assert - we can verify the method was called but we don't need to check
      // if it throws since the method has internal error handling
      expect(mockContractService.buyTokens).toHaveBeenCalled();
    });
  });
});
