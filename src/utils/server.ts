import { fork, spawnSync, ChildProcess, ForkOptions } from 'child_process';
import colors from 'colors/safe';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import stripJsonComments from 'strip-json-comments';

import { timer, event, wait, error } from './logger';
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
    const modules = resolve(__dirname, '..', '..', 'node_modules');

    const options = [
      process.env['NODE_OPTIONS'],
      `-r ${__dirname}/transpiler.js`,
      `-r ${modules}/dotenv/config`,
      '--no-warnings',
    ];

    if (this.tsconfig.hasPaths) {
      options.push(`-r ${modules}/tsconfig-paths/register`);
    }

    const NODE_OPTIONS = options.filter((option) => !!option).join(' ');

    return {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS,
        PORT: this.port,
        DOTENV_CONFIG_PATH: process.cwd(),
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

  get entryExists() {
    return existsSync(this.entry);
  }

  static findEntryPath() {
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
