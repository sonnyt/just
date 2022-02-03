import { Command } from 'commander';

import TSConfig from './utils/tsconfig';
import Server from './utils/server';
import Build from './utils/build';
import watch from './utils/watch';
import TypeCheck from './utils/typecheck';

interface Options {
  tsconfig: string;
  transpileOnly?: boolean;
}

const program = new Command();

program
  .argument('entry', 'Server entry file')
  .option('--transpile-only', 'Does not type check')
  .option('--tsconfig <tsconfig>', 'Typescript configuration file', 'tsconfig.json')
  .parse(process.argv);

const [ entry ] = program.args;
const options: Options = program.opts();

const tsconfig = new TSConfig(options.tsconfig);
const build = new Build(tsconfig);
const typeCheck = new TypeCheck(tsconfig);
const server = new Server(entry);

watch(tsconfig.config.include, () => {
  try {
    if (!options.transpileOnly) {
      typeCheck.run();
    }

    build.run();
    server.start();
  } catch(err) {
    console.error('[Just] Error:', err);
  }
});