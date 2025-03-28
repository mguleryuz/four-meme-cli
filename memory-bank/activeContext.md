# Four Meme CLI - Active Context

## Current Focus

We are implementing token bundling capabilities into the Four Meme CLI project. Our focus is creating a streamlined token creation and buying process that protects creators from snipers and front-running.

## Recent Changes

- Created the basic project structure with TypeScript
- Implemented API services for authentication and token creation
- Set up blockchain services for wallet management and contract interaction
- Created CLI command structure for token creation
- Implemented engine service to orchestrate the process

## Current Status

- Project structure is established
- Basic CLI command interface is working
- Core components are implemented but need refinement for bundling

## Active Decisions

### Token Bundling Strategy

1. **Concept Definition**: Token bundling refers to coordinating token creation and immediate purchase actions across multiple wallets to secure initial liquidity and prevent sniping.

2. **Core Components**:

   - **Multi-wallet Management**: Handle numerous wallets simultaneously
   - **Coordinated Transactions**: Execute buys across wallets with precise timing
   - **Launch Strategies**: Implement different approaches for token launch and purchase
   - **Anti-Sniper Protection**: Prevent front-running and sniping by coordinating token creation and purchases

3. **Implementation Approach**:
   - Use `viem` instead of `ethers.js` for blockchain interactions
   - Focus on coordinated transaction timing for the POC
   - Implement multiple buying strategies (bundle, stagger, etc.)
   - Consider basic token distribution capabilities

### Architecture Decisions

1. **Blockchain Library**: Migrate from ethers.js to viem for better performance and compatibility
2. **Launch Strategies**: Implement multiple token launch patterns:
   - Bundle Launch: Create token and execute all buys in rapid succession
   - Staggered Launch: Create token with immediate dev wallet buy, followed by timed purchases
   - Anti-Sniper Launch: Setup monitoring to detect and counter sniping attempts
3. **Wallet Orchestration**: Implement a coordinator service to manage transaction sequencing

## Implementation Priorities

1. **Migrate to viem**: Replace ethers.js with viem for all blockchain interactions
2. **Enhanced Wallet Management**: Support larger number of wallets (up to 39)
3. **Launch Strategy Implementation**: Create different token launch strategies
4. **Transaction Coordination**: Implement precise timing for transaction execution
5. **Monitoring & Analytics**: Add capabilities to track launch performance

## Next Steps

### Immediate Tasks

1. Refactor blockchain services to use viem instead of ethers.js
2. Implement a wallet coordinator service for multi-wallet management
3. Create launch strategy modules for different buying patterns
4. Add transaction timing and sequencing capabilities
5. Implement token contract monitoring for deployment confirmation

### Short-term Goals

1. Create a more robust wallet management system
2. Implement multiple launch strategies
3. Add transaction monitoring and validation
4. Create a token distribution capability

### Medium-term Goals

1. Explore smart contract implementation for bundled transactions
2. Add more sophisticated anti-sniper strategies
3. Implement advanced monitoring and analytics
4. Create a more intuitive UI for strategy selection

## Open Questions

1. What are the optimal delay times between transactions to avoid detection?
2. How many wallets can realistically be managed without performance issues?
3. What parameters determine the best launch strategy for a given token?
4. How can we best detect and counter sniping attempts?
5. Should we implement a smart contract for bundled transactions in the future?

## Resources

- four-meme-ref.js: Reference file for API and contract interaction
- Token bundling descriptions from similar projects
- viem documentation for blockchain interactions
- four.meme website for manual testing and verification
