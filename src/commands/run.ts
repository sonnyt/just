import color from 'colors/safe';

import Server from '../libs/server';
import TSConfig from '../libs/tsconfig';
import { error, info, wait } from '../utils/logger';

interface Options {
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (cmd: string, args: string[], options: Options) {
  try {
    if (options.debug) {
      info('debugger is on');
    }

    // disable colors
    if (!options.color) {
      color.disable();
    }

    const tsconfig = new TSConfig({ filePath: options.config });
    const server = new Server(tsconfig);

    process.on('SIGINT', () => {
      console.log('');
      wait('shutting down...');

      server.stop();

      process.exit(process.exitCode);
    });

    server.run(cmd, args);
  } catch (err) {
    if (options.debug) {
      error(err);
    }
  }
}
