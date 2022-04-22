import color from 'colors/safe';

import Server from '../libs/server';
import TSConfig from '../libs/tsconfig';
import { error, info, wait } from '../utils/logger';

interface Options {
  tsconfig: string;
  color: boolean;
}

export default async function (cmd: string, args: string[], options: Options) {
  console.log(cmd, args);

  try {
    if (process.env.JUST_DEBUG) {
      info('debugger is on');
    }

    // disable colors
    if (!options.color) {
      color.disable();
    }

    const tsconfig = new TSConfig({
      isSilenced: false,
      filePath: options.tsconfig,
    });

    const server = new Server(tsconfig);

    process.on('SIGINT', () => {
      console.log('');
      wait('shutting down...');

      server.stop();

      process.exit(process.exitCode);
    });

    server.run(cmd, args);
  } catch (err) {
    if (process.env.JUST_DEBUG) {
      error(err);
    }
  }
}
