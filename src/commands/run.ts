import color from 'colors/safe';

import { debug, error, info, timer, wait } from '../utils/logger';
import { resolveConfigPath } from '../libs/config';
import { isCommand, runCommand, runFile } from '../libs/server';

interface Options {
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (cmd: string, args: string[], options: Options) {
  if (options.debug) {
    process.env.JUST_DEBUG = 'TRUE';
    info('debugger is on');
  }

  if (!options.color) {
    color.disable();
  }

  const configPath = resolveConfigPath(options.config);

  const time = timer();

  if (isCommand(cmd)) {
    time.start('running command...');
    info(color.cyan(`${cmd} ${args.join(' ')}`));

    runCommand(cmd, args, configPath);
  } else {
    time.start('running file...');
    info(color.cyan(cmd));

    runFile(cmd, configPath);
  }

  time.end('done');

  process.on('SIGINT', () => {
    wait('shutting down...');
    process.exit(process.exitCode);
  });

  process.on('unhandledRejection', err => {
    if (process.env.JUST_DEBUG) {
      debug(err);
    } else {
      error('Oops! Something went wrong!');
    }

    process.exit(1);
  });
}
