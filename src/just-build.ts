import { Command } from 'commander';
import color from 'colors/safe';

import TSConfig from './utils/tsconfig';
import TypeChecker from './utils/typechecker';
import Builder from './utils/builder';

interface Options {
  tsconfig: string;
  transpileOnly: boolean;
  color: boolean;
  outDir?: string;
}

const program = new Command();

program
  .argument('[files]', 'files to compile')
  .option('--transpile-only', 'disable type checking')
  .option('--out-dir <outDir>', 'output folder for all emitted files')
  .option('--no-color', 'output color')
  .option(
    '-t, --tsconfig <tsconfig>',
    'typescript configuration file',
    'tsconfig.json'
  )
  .parse(process.argv);

const [files] = program.args;
const options: Options = program.opts();

if (!options.color) {
  color.disable();
}

const tsconfig = new TSConfig(options.tsconfig, false, files, options.outDir);
const builder = new Builder(tsconfig);
const typeChecker = new TypeChecker(tsconfig);

(async () => {
  if (!options.transpileOnly) {
    typeChecker.start();

    if (typeChecker.isFailed) {
      return;
    }
  }

  await builder.build();
})();
