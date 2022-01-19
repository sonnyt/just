#! /usr/bin/env node

import { Command } from 'commander';
import register from './utils/register';

(async function() {
  const program = new Command();
  program.version('0.0.1');

  await register(program);

  program.parse();
}());