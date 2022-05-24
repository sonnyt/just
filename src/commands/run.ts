import color from 'colors/safe';

import Server from '../libs/server';
import { error, info, wait } from '../utils/logger';
import { findConfigPath } from '../utils/file';

interface Options {
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (cmd: string, args: string[], options: Options) {
  if (options.debug) {
    info('debugger is on');
  }

  if (!options.color) {
    color.disable();
  }

  try {
    process.on('SIGINT', () => {
      wait('\nshutting down...');
      process.exit(process.exitCode);
    });

    const configPath = findConfigPath(options.config);
    const server = new Server(configPath);
    server.run(cmd, args);
  } catch (err) {
    if (options.debug) {
      error(err);
    }
  }
}
