import { Command } from 'commander';

import TSConfig from './utils/tsconfig';
import Build from './utils/build';
import TypeCheck from './utils/typecheck';

interface Options {
  tsconfig: string;
  transpileOnly?: boolean;
}

const program = new Command();

program
  .option('--transpile-only', 'Does not type check')
  .option('-t, --tsconfig <tsconfig>', 'typescript configuration file', 'tsconfig.json')
  .parse(process.argv);

const options: Options = program.opts();

const tsconfig = new TSConfig(options.tsconfig);
const build = new Build(tsconfig);
const typeCheck = new TypeCheck(tsconfig);

try {
  if (!options.transpileOnly) {
    typeCheck.run();
  }

  build.run();
} catch(err) {
  console.error('[Just] Error:', err);
}