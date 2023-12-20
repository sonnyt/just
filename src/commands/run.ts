import color from 'colors/safe';

import { info, timer, wait } from '../utils/logger';
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

  if (isCommand(cmd)) {
    const time = timer();
    time.start('running command...');

    info(color.cyan(`${cmd} ${args.join(' ')}`));
    runCommand(cmd, args, configPath);

    time.end();
  } else {
    const time = timer();
    time.start('running file...');

    info(color.cyan(cmd));
    runFile(cmd, configPath);

    time.end();
  }

  process.on('SIGINT', () => {
    wait('shutting down...');
    process.exit(process.exitCode);
  });
}
