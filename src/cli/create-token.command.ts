import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import { EngineService } from '../services';
import type { ICreateTokenOptions } from '../types';
import { DEFAULT_TOKEN_PARAMS } from '../config/constants';

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
      .command('create-token')
      .description('Create a new token on four.meme')
      .option('-n, --name <name>', 'Token name')
      .option('-s, --symbol <symbol>', 'Token symbol')
      .option('-d, --decimals <decimals>', 'Token decimals', String(DEFAULT_TOKEN_PARAMS.decimals))
      .option('-t, --total-supply <totalSupply>', 'Token total supply')
      .option('--description <description>', 'Token description', DEFAULT_TOKEN_PARAMS.description)
      .option('--telegram <telegramUrl>', 'Telegram URL')
      .option('--twitter <twitterUrl>', 'Twitter URL')
      .option('--website <websiteUrl>', 'Website URL')
      .option('-i, --image <imagePath>', 'Path to token image')
      .option('-b, --buy', 'Buy tokens after creation')
      .option('--buy-amount <amount>', 'Amount to buy in BNB', '0.1')
      .action(async (cmdOptions) => {
        try {
          // Collect missing options interactively
          const options = await this.collectOptions(cmdOptions);
          
          // Create token
          await this.createToken(options);
        } catch (error) {
          console.error(chalk.red('Error creating token:'), error);
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
        type: 'input',
        name: 'name',
        message: 'Token name:',
        validate: (input: string) => input.trim() !== '' ? true : 'Token name is required',
      });
    }
    
    if (!cmdOptions.symbol) {
      questions.push({
        type: 'input',
        name: 'symbol',
        message: 'Token symbol:',
        validate: (input: string) => input.trim() !== '' ? true : 'Token symbol is required',
      });
    }
    
    if (!cmdOptions.totalSupply) {
      questions.push({
        type: 'input',
        name: 'totalSupply',
        message: 'Total supply:',
        default: '1000000',
        validate: (input: string) => {
          const num = Number(input);
          return !isNaN(num) && num > 0 ? true : 'Total supply must be a positive number';
        },
      });
    }
    
    if (!cmdOptions.image) {
      questions.push({
        type: 'input',
        name: 'imagePath',
        message: 'Path to token image:',
        validate: (input: string) => {
          if (input.trim() === '') return 'Image path is required';
          if (!fs.existsSync(input)) return 'Image file does not exist';
          return true;
        },
      });
    }
    
    // Ask if user wants to buy tokens after creation if not specified
    if (cmdOptions.buy === undefined) {
      questions.push({
        type: 'confirm',
        name: 'buyEnabled',
        message: 'Buy tokens after creation?',
        default: false,
      });
    }
    
    // If buying is enabled, ask for amount if not specified
    if (cmdOptions.buy && !cmdOptions.buyAmount) {
      questions.push({
        type: 'input',
        name: 'buyAmount',
        message: 'Amount to buy in BNB:',
        default: '0.1',
        validate: (input: string) => {
          const num = Number(input);
          return !isNaN(num) && num > 0 ? true : 'Buy amount must be a positive number';
        },
      });
    }
    
    // Collect answers
    const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};
    
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
        enabled: cmdOptions.buy !== undefined ? cmdOptions.buy : answers.buyEnabled,
        buyerWallets: [], // Will be populated from environment config
        buyAmount: cmdOptions.buyAmount || answers.buyAmount || '0.1',
      },
    };
  }
  
  /**
   * Create a token with the given options
   * @param options Token creation options
   */
  private async createToken(options: ICreateTokenOptions): Promise<void> {
    console.log(chalk.blue('\n== Creating Token =='));
    console.log(chalk.cyan('Name:'), options.name);
    console.log(chalk.cyan('Symbol:'), options.symbol);
    console.log(chalk.cyan('Total Supply:'), options.totalSupply);
    console.log(chalk.cyan('Image:'), options.imagePath);
    console.log();
    
    const spinner = ora('Initializing...').start();
    
    try {
      const engine = new EngineService();
      
      // Initialize and authenticate
      spinner.text = 'Authenticating with four.meme...';
      await engine.initialize();
      
      // Create token
      spinner.text = 'Creating token...';
      const tokenAddress = await engine.createToken(options);
      
      spinner.succeed(chalk.green(`Token created successfully: ${tokenAddress}`));
      
      // Buy tokens if enabled
      if (options.buy.enabled) {
        spinner.start('Buying tokens...');
        await engine.buyTokens(tokenAddress, options.buy);
        spinner.succeed(chalk.green('Token purchases completed'));
      }
      
      console.log(chalk.green('\n✓ Process completed successfully!'));
    } catch (error) {
      spinner.fail(chalk.red('Error:'));
      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      } else {
        console.error(chalk.red('An unknown error occurred'));
      }
      process.exit(1);
    }
  }
} 