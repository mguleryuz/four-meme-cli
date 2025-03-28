# Four Meme CLI - Active Context

## Current Focus

We are at the initial planning and setup stage of the Four Meme CLI project. The main focus is understanding the four.meme API flow and setting up the foundational project structure.

## Recent Changes

- Analyzed the reference JavaScript file containing API and contract interaction examples
- Set up the memory bank for project documentation
- Identified the key components and workflows required for the CLI

## Current Status

- Project structure is not yet established
- Development environment setup is pending
- Basic understanding of four.meme API flow has been gathered from reference file

## Active Decisions

### Architecture Decisions

1. **CLI Framework Selection**: Need to choose between Commander or Yargs for command-line parsing, leaning toward Commander with Ink for UI
2. **Image Handling**: Considering Sharp for Node.js-based image processing instead of browser-image-compression referenced in the four.meme code
3. **Authentication Flow**: Will implement SIWE (Sign-in with Ethereum) using ethers.js signatures

### Implementation Priorities

1. **Authentication Module**: First priority to establish a working connection with four.meme
2. **Image Upload Functionality**: Second priority to handle image selection and upload
3. **Token Creation Flow**: Build the token creation process after auth and image upload are working
4. **Purchase Strategy**: Implement the post-deployment purchase strategy last

## Next Steps

### Immediate Tasks

1. Set up basic project structure with TypeScript and Bun
2. Create a .env file template for configuration
3. Implement the authentication module (SIWE)
4. Set up the CLI command structure

### Short-term Goals

1. Complete a working prototype that can authenticate with four.meme
2. Implement image selection and upload functionality
3. Create a simple token with basic parameters

### Medium-term Goals

1. Implement the full token creation flow
2. Add the multi-wallet purchase strategy
3. Create a polished terminal UI with status indicators

## Open Questions

1. What are the exact parameters required for token creation on four.meme?
2. Are there rate limits on the four.meme API?
3. What are the optimal gas settings for quick token purchases post-deployment?
4. What are the specific image requirements for token logos?

## Resources

- four-meme-ref.js: Reference file containing API and contract interaction examples
- four.meme website for manual testing and verification
