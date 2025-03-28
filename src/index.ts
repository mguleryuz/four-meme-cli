#!/usr/bin/env node

import { CLI } from './cli';

/**
 * Entry point for the Four Meme CLI
 */
async function main() {
  try {
    const cli = new CLI();
    cli.parse(process.argv);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main(); 