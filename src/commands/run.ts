import color from 'colors/safe';

import * as log from '../utils/logger';
import { resolveConfigPath } from '../libs/config';
import { runCommand, runFile } from '../libs/server';
import { isFile } from '../utils/file';

interface Options {
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (cmd: string, args: string[], options: Options) {
  if (options.debug) {
    process.env.JUST_DEBUG = 'TRUE';
    log.info('debugger is on');
  }

  if (!options.color) {
    color.disable();
  }

  const configPath = resolveConfigPath(options.config);

  const time = log.timer();

  if (isFile(cmd)) {
    time.start('running file...');

    runFile(cmd, configPath);
  } else {
    time.start('running command...');

    runCommand(cmd, args, configPath);
  }

  time.end();

  process.on('SIGINT', () => {
    log.wait('shutting down...');

    process.exit(process.exitCode);
  });
}
