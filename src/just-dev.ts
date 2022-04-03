import { Command } from 'commander';
import color from 'colors/safe';

import TSConfig from './utils/tsconfig';
import Server from './utils/server';
import Builder from './utils/builder';
import TypeChecker from './utils/typechecker';
import Watcher from './utils/watcher';
import { error, wait } from './utils/logger';

interface Options {
  tsconfig: string;
  typeCheck: boolean;
  color: boolean;
  port?: string;
}

const program = new Command();

program
  .argument('[entry]', 'server entry file', Server.findEntryPath())
  .option('-p, --port <port>', 'server port')
  .option('--type-check', 'enable type checking')
  .option('--no-color', 'disable output color')
  .option(
    '-t, --tsconfig <tsconfig>',
    'typescript configuration file',
    'tsconfig.json'
  )
  .parse(process.argv);

const [entry] = program.processedArgs;
const options: Options = program.opts();

if (!options.color) {
  color.disable();
}

const tsconfig = new TSConfig(options.tsconfig);
const builder = new Builder(tsconfig);
const typeChecker = new TypeChecker(tsconfig);
const server = new Server(entry, tsconfig, options.port);
const watcher = new Watcher(tsconfig);

process.on('SIGINT', () => {
  console.log('');
  wait('shutting down...');

  server.stop();
  builder.stop();
  watcher.stop();

  process.exit(process.exitCode);
});

(async () => {
  if (!server.entryExists) {
    error('entry file not found');
    return;
  }

  watcher.start(async () => {
    if (options.typeCheck) {
      typeChecker.start();
    }

    if (typeChecker.isFailed) {
      return;
    }

    await builder.start();

    if (builder.isFailed) {
      return;
    }

    server.start();
  });
})();
