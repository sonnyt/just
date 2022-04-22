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
import TSConfig from './tsconfig';

export default class Server {
  private entry: string;
  private port?: string;
  private process?: ChildProcess;
  private tsconfig: TSConfig;

  constructor(tsconfig: TSConfig, entry: string = '', port?: string) {
    this.port = port ?? process.env.PORT;
    this.entry = entry;
    this.tsconfig = tsconfig;
  }

  private get options(): ForkOptions | SpawnSyncOptions {
    const options = [
      process.env['NODE_OPTIONS'],
      `-r ${require.resolve('dotenv/config')}`,
      `-r ${__dirname}/transpiler.js`,
      '--no-warnings',
    ];

    if (this.tsconfig.hasPaths) {
      options.push(`-r ${require.resolve('tsconfig-paths/register')}`);
    }

    const NODE_OPTIONS = options.filter((option) => !!option).join(' ');

    return {
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        NODE_OPTIONS,
        PORT: this.port,
        JUST_TSCONFIG: this.tsconfig.filePath,
      },
    };
  }

  private spawn() {
    const entry = resolve(process.cwd(), this.entry);
    this.process = fork(entry, this.options);
  }

  private _start() {
    try {
      wait('starting server...');
      this.spawn();
    } catch {
      error('server failed');
    }
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

    return this._start();
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
