import { fork, spawnSync, ChildProcess, ForkOptions } from 'child_process';
import colors from 'colors/safe';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import stripJsonComments from 'strip-json-comments';

import { timer, event, wait, error, info } from './logger';
import TSConfig from './tsconfig';

export default class Server {
  private entry: string;
  private port?: string;
  private process?: ChildProcess;
  private tsconfig: TSConfig;

  constructor(entry: string, tsconfig: TSConfig, port?: string) {
    this.port = port ?? process.env.PORT;
    this.entry = entry;
    this.tsconfig = tsconfig;
  }

  private get options(): ForkOptions {
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

  static findEntryPath(path: string) {
    if (path) {
      return path;
    }

    info('entry path is not provided, using "main" in package.json');

    const packageFilePath = resolve(process.cwd(), 'package.json');
    let entry;

    if (existsSync(packageFilePath)) {
      const file = readFileSync(packageFilePath, 'utf-8');
      const content = stripJsonComments(file.toString());
      const json = JSON.parse(content);
      entry = json.main;
    }

    return entry;
  }

  validate() {
    if (!this.entry) {
      error('cannot find entry path');
      throw new Error('cannot find entry path');
    }

    if (!existsSync(this.entry)) {
      error('entry file not found');
      throw new Error('entry file not not found');
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
