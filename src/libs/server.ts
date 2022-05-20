import {
  fork,
  spawnSync,
  ChildProcess,
  ForkOptions,
  SpawnSyncOptions,
} from 'child_process';
import colors from 'colors/safe';
import { resolve } from 'path';

import { timer, event, wait, error } from '../utils/logger';

export default class Server {
  private entry?: string;
  private config: string;
  private port?: string;
  private process?: ChildProcess;

  constructor(config: string, entry?: string, port?: string) {
    this.port = port ?? process.env.PORT;
    this.config = config;
    this.entry = entry;
  }

  private get options(): ForkOptions | SpawnSyncOptions {
    const options = [
      process.env['NODE_OPTIONS'],
      `-r ${require.resolve('dotenv/config')}`,
      `-r ${require.resolve('tsconfig-paths/register')}`,
      `-r ${__dirname}/transpiler.js`,
      '--no-warnings',
    ];

    const NODE_OPTIONS = options.filter((option) => !!option).join(' ');

    return {
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        NODE_OPTIONS,
        PORT: this.port,
        JUST_TSCONFIG: this.config,
      },
    };
  }

  private spawn() {
    if (!this.entry) {
      const err = 'entry file is not provided';
      error(err);
      throw err;
    }

    const entry = resolve(process.cwd(), this.entry);
    this.process = fork(entry, this.options);
  }

  run(command: string, args: string[]) {
    try {
      const time = timer();
      time.start('running script...');

      event(colors.cyan(`${command} ${args.join(' ')}`));
      spawnSync(command, args, this.options);

      time.end('ran script successfully');
    } catch {
      error('script failed');
    }
  }

  start() {
    if (this.process && !this.process.killed) {
      return this.restart();
    }

    try {
      wait('starting server...');
      this.spawn();
    } catch {
      error('server failed');
    }
  }

  stop() {
    if (!this.process) {
      return;
    }

    this.process.kill(process.exitCode);
  }

  restart() {
    try {
      wait('restarting server...');

      this.stop();
      this.spawn();
    } catch {
      error('server failed');
    }
  }
}
