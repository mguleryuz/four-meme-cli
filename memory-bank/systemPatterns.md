# Four Meme CLI - System Patterns

## System Architecture

The Four Meme CLI follows a modular architecture with several key components:

```
┌─────────────────┐     ┌───────────────┐     ┌────────────────┐
│  CLI Interface  │────▶│  Core Engine  │────▶│  API Services  │
└─────────────────┘     └───────────────┘     └────────────────┘
                               │                      │
                               ▼                      ▼
                        ┌─────────────┐       ┌─────────────────┐
                        │  Blockchain │       │  Image Handler  │
                        │  Services   │       └─────────────────┘
                        └─────────────┘
```

### Components

1. **CLI Interface**

   - Handles user input and command processing
   - Displays progressive status updates
   - Manages interactive prompts for image selection

2. **Core Engine**

   - Orchestrates the entire token creation workflow
   - Manages state throughout the process
   - Handles error recovery and retry logic

3. **API Services**

   - Manages authentication with four.meme
   - Handles API calls for token creation and management
   - Maintains session cookies and tokens

4. **Blockchain Services**

   - Manages wallet connections
   - Signs transactions for SIWE and token purchases
   - Interacts with smart contracts

5. **Image Handler**
   - Processes and validates images
   - Handles image compression if needed
   - Manages image upload to four.meme

## Design Patterns

### Command Pattern

Used for CLI command structure, allowing for extension with new commands while maintaining a consistent interface.

### Factory Pattern

Implemented for creating different types of API requests and blockchain transactions.

### Strategy Pattern

Used for implementing different purchasing strategies with multiple wallets.

### Observer Pattern

Implemented for status updates and logging throughout the process.

### Repository Pattern

Used for managing configuration and environment variables.

## Data Flow

1. User provides token parameters and configuration
2. System authenticates with four.meme using SIWE
3. Token image is processed and uploaded
4. Token parameters are submitted to four.meme database
5. Smart contract creation is triggered
6. System monitors for successful contract deployment
7. Purchase transactions are executed from configured wallets
8. Results are reported back to the user

## Error Handling

The system implements robust error handling with:

- Graceful degradation for non-critical failures
- Automatic retries for transient issues
- Detailed error reporting
- Safe rollback mechanisms where possible

## Configuration Management

Configuration is managed through:

- Environment variables for sensitive information (.env file)
- Command line parameters for token-specific details
- Configuration files for complex setups
- Sensible defaults to minimize required input
