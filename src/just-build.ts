import { Command } from 'commander';
import color from 'colors/safe';

import TSConfig from './utils/tsconfig';
import TypeChecker from './utils/typechecker';
import Builder from './utils/builder';
import { error, info } from './utils/logger';

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

async function main() {
  try {
    if (process.env.JUST_DEBUG) {
      info('debugger is on');
    }

    // disable colors
    if (!options.color) {
      color.disable();
    }

    const tsconfig = new TSConfig({
      include: files,
      isSilenced: false,
      outDir: options.outDir,
      filePath: options.tsconfig,
    });

    const builder = new Builder(tsconfig);
    const typeChecker = new TypeChecker(tsconfig);

    if (!options.transpileOnly) {
      typeChecker.check();
    }

    await builder.build();
  } catch (err) {
    if (process.env.JUST_DEBUG) {
      error(err);
    }
  }
}

main();
