import { Command } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import { CLI_CONSTANTS } from '../config/constants';
import { CreateTokenCommand } from './create-token.command';

/**
 * CLI setup and command registration
 */
export class CLI {
  private program: Command;
  
  constructor() {
    this.program = new Command();
    this.setup();
    this.registerCommands();
  }
  
  /**
   * Set up the CLI program
   */
  private setup(): void {
    this.program
      .name(CLI_CONSTANTS.APP_NAME)
      .description(CLI_CONSTANTS.DESCRIPTION)
      .version(CLI_CONSTANTS.VERSION)
      .option('-v, --verbose', 'Enable verbose logging');
      
    // Display banner
    console.log(
      chalk.cyan(
        figlet.textSync('Four Meme CLI', { horizontalLayout: 'full' })
      )
    );
  }
  
  /**
   * Register all CLI commands
   */
  private registerCommands(): void {
    // Register the create-token command
    new CreateTokenCommand(this.program);
  }
  
  /**
   * Parse command line arguments and execute
   */
  parse(argv: string[]): void {
    this.program.parse(argv);
  }
} 