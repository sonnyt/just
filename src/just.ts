#! /usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .version('0.0.1')
  .command('build', 'build project')
  .command('serve', 'serve project')
  .command('lint', 'lint project')
  .parse();