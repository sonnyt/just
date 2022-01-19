import type { program as Program } from 'commander';
import * as swc from '@swc/core';
import config from '../utils/config';

export default function(program: typeof Program) {
  program
    .command('build')
    .description('build project')
    .option('-t, --tsconfig <tsconfig>')
    .action((options) => {
      const swcConfig = config(options.tsconfig);
      swc.transformSync('', swcConfig);
    });
}