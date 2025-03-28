import { Command } from "commander";
import inquirer from "inquirer";
import fs from "fs";
import chalk from "chalk";
import ora from "ora";
import { EngineService } from "../services";
import {
  StrategyFactoryService,
  StrategyType,
} from "../services/strategy-factory.service";
import { WalletCoordinatorService } from "../blockchain/wallet-coordinator.service";
import type { ICreateTokenOptions } from "../types";
import { DEFAULT_TOKEN_PARAMS } from "../config/constants";
import { envConfig } from "../config";

/**
 * Create Token Command
 */
export class CreateTokenCommand {
  private program: Command;

  constructor(program: Command) {
    this.program = program;
    this.registerCommand();
  }

  /**
   * Register the create-token command
   */
  private registerCommand(): void {
    this.program
      .command("create-token")
      .description("Create a new token on four.meme")
      .option("-n, --name <name>", "Token name")
      .option("-s, --symbol <symbol>", "Token symbol")
      .option(
        "-d, --decimals <decimals>",
        "Token decimals",
        String(DEFAULT_TOKEN_PARAMS.decimals)
      )
      .option(
        "-t, --total-supply <totalSupply>",
        "Token total supply",
        String(DEFAULT_TOKEN_PARAMS.totalSupply)
      )
      .option(
        "--description <description>",
        "Token description",
        DEFAULT_TOKEN_PARAMS.description
      )
      .option("--telegram <telegramUrl>", "Telegram URL")
      .option("--twitter <twitterUrl>", "Twitter URL")
      .option("--website <websiteUrl>", "Website URL")
      .option("-i, --image <imagePath>", "Path to token image")
      .option("-b, --buy", "Buy tokens after creation")
      .option("--buy-amount <amount>", "Amount to buy in BNB", "0.1")
      // Strategy options
      .option(
        "--strategy <strategy>",
        "Launch strategy (bundle, staggered, anti-sniper)",
        "bundle"
      )
      .option(
        "--delay <ms>",
        "Delay between transactions for staggered strategy",
        "1000"
      )
      .option(
        "--monitor-duration <ms>",
        "Duration to monitor for snipers in anti-sniper strategy",
        "10000"
      )
      .option(
        "--trigger-threshold <count>",
        "Number of snipers to trigger countermeasures",
        "2"
      )
      .option(
        "--countermeasures <type>",
        "Countermeasures for anti-sniper strategy (none, delay, abort, dump)",
        "delay"
      )
      .option("--gas-multiplier <multiplier>", "Gas price multiplier", "1.5")
      .action(async (cmdOptions) => {
        try {
          // Collect missing options interactively
          const options = await this.collectOptions(cmdOptions);

          // Create token
          await this.createToken(options);
        } catch (error) {
          console.error(chalk.red("Error creating token:"), error);
          process.exit(1);
        }
      });
  }

  /**
   * Collect missing options interactively
   * @param cmdOptions Options from command line
   * @returns Complete options
   */
  private async collectOptions(cmdOptions: any): Promise<ICreateTokenOptions> {
    const questions = [];

    // Collect required fields if missing
    if (!cmdOptions.name) {
      questions.push({
        type: "input",
        name: "name",
        message: "Token name:",
        validate: (input: string) =>
          input.trim() !== "" ? true : "Token name is required",
      });
    }

    if (!cmdOptions.symbol) {
      questions.push({
        type: "input",
        name: "symbol",
        message: "Token symbol:",
        validate: (input: string) =>
          input.trim() !== "" ? true : "Token symbol is required",
      });
    }

    if (!cmdOptions.totalSupply) {
      questions.push({
        type: "input",
        name: "totalSupply",
        message: "Total supply:",
        default: "1000000",
        validate: (input: string) => {
          const num = Number(input);
          return !isNaN(num) && num > 0
            ? true
            : "Total supply must be a positive number";
        },
      });
    }

    if (!cmdOptions.image) {
      questions.push({
        type: "input",
        name: "imagePath",
        message: "Path to token image:",
        validate: (input: string) => {
          if (input.trim() === "") return "Image path is required";
          if (!fs.existsSync(input)) return "Image file does not exist";
          return true;
        },
      });
    }

    // Ask if user wants to buy tokens after creation if not specified
    if (cmdOptions.buy === undefined) {
      questions.push({
        type: "confirm",
        name: "buyEnabled",
        message: "Buy tokens after creation?",
        default: false,
      });
    }

    // If buying is enabled, ask for amount if not specified
    if (cmdOptions.buy && !cmdOptions.buyAmount) {
      questions.push({
        type: "input",
        name: "buyAmount",
        message: "Amount to buy in BNB:",
        default: "0.1",
        validate: (input: string) => {
          const num = Number(input);
          return !isNaN(num) && num > 0
            ? true
            : "Buy amount must be a positive number";
        },
      });
    }

    // Ask for strategy if not specified
    if (!cmdOptions.strategy) {
      questions.push({
        type: "list",
        name: "strategy",
        message: "Choose launch strategy:",
        choices: [
          { name: "Bundle Launch (all purchases at once)", value: "bundle" },
          { name: "Staggered Launch (timed purchases)", value: "staggered" },
          {
            name: "Anti-Sniper (monitor and counteract snipers)",
            value: "anti-sniper",
          },
        ],
        default: "bundle",
      });
    }

    // If staggered strategy, ask for delay if not specified
    if (
      cmdOptions.strategy === "staggered" ||
      (questions.some((q) => q.name === "strategy") && !cmdOptions.delay)
    ) {
      questions.push({
        type: "input",
        name: "delay",
        message: "Delay between transactions (ms):",
        default: "1000",
        validate: (input: string) => {
          const num = Number(input);
          return !isNaN(num) && num > 0
            ? true
            : "Delay must be a positive number";
        },
        when: (answers) =>
          answers.strategy === "staggered" ||
          cmdOptions.strategy === "staggered",
      });
    }

    // If anti-sniper strategy, ask for monitoring parameters if not specified
    if (
      cmdOptions.strategy === "anti-sniper" ||
      (questions.some((q) => q.name === "strategy") &&
        !cmdOptions.monitorDuration)
    ) {
      questions.push({
        type: "input",
        name: "monitorDuration",
        message: "Duration to monitor for snipers (ms):",
        default: "10000",
        validate: (input: string) => {
          const num = Number(input);
          return !isNaN(num) && num > 0
            ? true
            : "Duration must be a positive number";
        },
        when: (answers) =>
          answers.strategy === "anti-sniper" ||
          cmdOptions.strategy === "anti-sniper",
      });

      questions.push({
        type: "input",
        name: "triggerThreshold",
        message: "Number of snipers to trigger countermeasures:",
        default: "2",
        validate: (input: string) => {
          const num = Number(input);
          return !isNaN(num) && num > 0
            ? true
            : "Threshold must be a positive number";
        },
        when: (answers) =>
          answers.strategy === "anti-sniper" ||
          cmdOptions.strategy === "anti-sniper",
      });

      questions.push({
        type: "list",
        name: "countermeasures",
        message: "Countermeasures for sniper activity:",
        choices: [
          { name: "None (proceed normally)", value: "none" },
          { name: "Delay (wait before buying)", value: "delay" },
          { name: "Abort (cancel the launch)", value: "abort" },
          { name: "Dump (sell to snipers)", value: "dump" },
        ],
        default: "delay",
        when: (answers) =>
          answers.strategy === "anti-sniper" ||
          cmdOptions.strategy === "anti-sniper",
      });
    }

    // Collect answers
    const answers =
      questions.length > 0 ? await inquirer.prompt(questions) : {};

    // Combine command line options and answers
    return {
      name: cmdOptions.name || answers.name,
      symbol: cmdOptions.symbol || answers.symbol,
      decimals: parseInt(cmdOptions.decimals),
      totalSupply: cmdOptions.totalSupply || answers.totalSupply,
      description: cmdOptions.description,
      telegram: cmdOptions.telegram,
      twitter: cmdOptions.twitter,
      website: cmdOptions.website,
      imagePath: cmdOptions.image || answers.imagePath,
      buy: {
        enabled:
          cmdOptions.buy !== undefined ? cmdOptions.buy : answers.buyEnabled,
        buyerWallets: [], // Will be populated from environment config
        buyAmount: cmdOptions.buyAmount || answers.buyAmount || "0.1",
      },
      strategy: {
        type: cmdOptions.strategy || answers.strategy,
        options: {
          // Bundle options
          executeAllAtOnce: true,

          // Staggered options
          delayBetweenTransactions: parseInt(
            cmdOptions.delay || answers.delay || "1000"
          ),
          waitForConfirmation: true,

          // Anti-sniper options
          monitorDuration: parseInt(
            cmdOptions.monitorDuration || answers.monitorDuration || "10000"
          ),
          triggerThreshold: parseInt(
            cmdOptions.triggerThreshold || answers.triggerThreshold || "2"
          ),
          countermeasures:
            cmdOptions.countermeasures || answers.countermeasures || "delay",

          // Common options
          gasMultiplier: parseFloat(cmdOptions.gasMultiplier || "1.5"),
        },
      },
    };
  }

  /**
   * Create a token with the given options
   * @param options Token creation options
   */
  private async createToken(options: ICreateTokenOptions): Promise<void> {
    console.log(chalk.blue("\n== Creating Token =="));
    console.log(chalk.cyan("Name:"), options.name);
    console.log(chalk.cyan("Symbol:"), options.symbol);
    console.log(chalk.cyan("Total Supply:"), options.totalSupply);
    console.log(chalk.cyan("Image:"), options.imagePath);
    console.log(chalk.cyan("Strategy:"), options.strategy.type);
    console.log();

    const spinner = ora("Initializing...").start();

    try {
      // Create wallet coordinator
      const walletCoordinator = new WalletCoordinatorService(
        envConfig.bscRpcUrl
      );

      // Create strategy factory
      const strategyFactory = new StrategyFactoryService(walletCoordinator);

      // Initialize wallet coordinator with private keys from env
      spinner.text = "Setting up wallets...";
      if (envConfig.primaryWallet.privateKey) {
        await walletCoordinator.addWallet(
          envConfig.primaryWallet.privateKey,
          "Primary"
        );
      }

      // Add buyer wallets if needed
      if (options.buy.enabled && envConfig.buyerWallets.length > 0) {
        const buyerKeys = envConfig.buyerWallets.map((w) => w.privateKey);
        const buyerLabels = envConfig.buyerWallets.map(
          (_, i) => `Buyer ${i + 1}`
        );
        await walletCoordinator.addWallets(buyerKeys, buyerLabels);
      }

      // Create and initialize the appropriate strategy
      spinner.text = `Initializing ${options.strategy.type} strategy...`;
      let strategy;

      switch (options.strategy.type) {
        case StrategyType.BUNDLE:
          strategy = await strategyFactory.createBundleStrategy({
            executeAllAtOnce: true,
            gasMultiplier: options.strategy.options.gasMultiplier,
          });
          break;

        case StrategyType.STAGGERED:
          strategy = await strategyFactory.createStaggeredStrategy({
            delayBetweenTransactions:
              options.strategy.options.delayBetweenTransactions,
            waitForConfirmation: options.strategy.options.waitForConfirmation,
            gasMultiplier: options.strategy.options.gasMultiplier,
          });
          break;

        case StrategyType.ANTI_SNIPER:
          strategy = await strategyFactory.createAntiSniperStrategy({
            monitorDuration: options.strategy.options.monitorDuration,
            triggerThreshold: options.strategy.options.triggerThreshold,
            countermeasures: options.strategy.options.countermeasures as any,
            gasMultiplier: options.strategy.options.gasMultiplier,
          });
          break;

        default:
          throw new Error(
            `Unsupported strategy type: ${options.strategy.type}`
          );
      }

      // Execute the strategy
      spinner.text = `Executing ${options.strategy.type} strategy...`;
      const tokenAddress = await strategy.execute(options);

      spinner.succeed(
        chalk.green(`Token created successfully: ${tokenAddress}`)
      );

      console.log(chalk.green("\n✓ Process completed successfully!"));
    } catch (error) {
      spinner.fail(chalk.red("Error:"));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      } else {
        console.error(chalk.red("An unknown error occurred"));
      }
      process.exit(1);
    }
  }
}
