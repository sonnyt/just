import { Command } from 'commander';
import color from 'colors/safe';

import Server from './utils/server';
import TSConfig from './utils/tsconfig';
import { wait } from './utils/logger';

interface Options {
  tsconfig: string;
  color: boolean;
}

const program = new Command();

program
  .option('--no-color', 'disable output color')
  .option(
    '-t, --tsconfig <tsconfig>',
    'typescript configuration file',
    'tsconfig.json'
  )
  .argument('<command>', 'command to run')
  .argument('[args...]')
  .passThroughOptions()
  .parse(process.argv);

const [cmd, ...args] = program.args;
const options: Options = program.opts();

if (!options.color) {
  color.disable();
}

const tsconfig = new TSConfig(options.tsconfig);
const server = new Server('', tsconfig);

process.on('SIGINT', () => {
  console.log('');
  wait('shutting down...');

  server.stop();

  process.exit(process.exitCode);
});

server.run(cmd, args);
