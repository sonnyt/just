import color from 'colors/safe';

import TSConfig from '../libs/tsconfig';
import Server from '../libs/server';
import TypeChecker from '../libs/typechecker';
import Watcher from '../libs/watcher';
import { error, info, wait } from '../utils/logger';

interface Options {
  typeCheck: boolean;
  port?: string;
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (entry: string, options: Options) {
  try {
    if (options.debug) {
      info('debugger is on');
    }

    // disable colors
    if (!options.color) {
      color.disable();
    }

    const tsconfig = new TSConfig({ filePath: options.config });
    const typeChecker = new TypeChecker(tsconfig);
    const server = new Server(tsconfig, entry, options.port);
    const watcher = new Watcher(tsconfig);

    process.on('SIGINT', () => {
      console.log('');
      wait('shutting down...');

      server.stop();
      watcher.stop();

      process.exit(process.exitCode);
    });

    await watcher.ready(() => {
      if (options.typeCheck) {
        typeChecker.check();
      }

      server.start();
    });

    await watcher.change((filename) => {
      if (options.typeCheck) {
        typeChecker.checkFile(filename);
      }

      server.restart();
    });
  } catch (err) {
    if (options.debug) {
      error(err);
    }
  }
}
