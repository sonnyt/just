import type { program as Program } from 'commander';
import { buildSync } from 'esbuild';

import tsconfig from '../utils/tsconfig';
import tsc from '../utils/tsc';

function action(options: any) {
  const config = tsconfig(options.tsconfig);

  try {
    tsc(config.include, config.compilerOptions);

    buildSync({
      format: 'cjs',
      platform: 'node',
      entryPoints: config.include,
      absWorkingDir: process.cwd(),
      outdir: config.dest
    });
  } catch{}
}

export default function(program: typeof Program) {
  program
    .command('build')
    .description('build project')
    .option('-t, --tsconfig <tsconfig>', 'typescript configuration file', 'tsconfig.json')
    .action(action);
}