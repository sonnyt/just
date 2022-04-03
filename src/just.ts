#! /usr/bin/env node
import { Command } from 'commander';
import { version } from '../package.json';

const program = new Command();

program
  .name('just')
  .version(version)
  .command('run', 'runs typescript scripts')
  .command('dev', 'starts the application in development mode')
  .command('build', 'compiles the application for production deployment')
  .parse(process.argv);
