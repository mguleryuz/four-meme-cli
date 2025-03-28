# Four Meme CLI - Product Context

## Problem Statement

When creating new tokens on four.meme, creators face several challenges:

1. **Sniping Risk**: After deployment, tokens can be sniped by bots or other users before the creator can make initial purchases
2. **Manual Process**: The web interface requires multiple manual steps across different screens
3. **Timing Issues**: The delay between contract creation and buying opportunities allows others to front-run purchases
4. **Wallet Management**: Using multiple wallets for initial purchases is cumbersome through the web interface

## Solution

Four Meme CLI automates the entire token creation and purchasing process, allowing users to:

1. Create tokens with all parameters defined upfront
2. Automatically purchase tokens with multiple wallets immediately after deployment
3. Execute the entire process in a single command, eliminating manual intervention
4. Secure the token's initial liquidity for the creator

## User Experience Goals

### Simplicity

- Single command execution with clear parameter inputs
- Sensible defaults where appropriate
- Inline help and documentation

### Transparency

- Clear status updates during each step
- Detailed logs for troubleshooting
- Confirmation of successful actions

### Control

- Configurable parameters for all token aspects
- Support for multiple wallet configurations
- Ability to abort the process if needed

### Security

- Private keys stored securely in .env file
- No exposure of sensitive information in logs
- Proper handling of authentication tokens

## User Workflows

### Basic Token Creation

1. Configure environment variables
2. Run CLI command with token parameters
3. Select token image
4. Review and confirm deployment
5. Automatic purchase with configured wallets
6. Receive confirmation of completed process

### Advanced Configuration

1. Set up detailed token parameters in a config file
2. Configure multiple wallet strategies
3. Execute with reference to config file
4. Monitor detailed logs during execution

## Success Measures

- Time saved compared to manual process
- Percentage of successfully secured initial purchases
- Ease of use feedback from users
- Number of tokens successfully created through the CLI
