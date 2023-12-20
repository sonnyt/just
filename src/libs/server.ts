import { resolve } from 'path';
import { fork, spawnSync } from 'child_process';
import getPort, { makeRange } from 'get-port';
import { sync as whichSync } from 'which';

import { debug } from '../utils/logger';

function getOptions(JUST_TSCONFIG: string, port?: string | number) {
  const flags = [
    process.env['NODE_OPTIONS'],
    `-r ${require.resolve('dotenv/config')}`,
    `-r ${__dirname}/register.js`,
    '--no-warnings',
  ];

  const NODE_OPTIONS = flags.filter((option) => !!option).join(' ');

  debug(`using NODE_OPTIONS: ${NODE_OPTIONS}`);
  debug(`using PORT: ${port}`);
  debug(`using JUST_TSCONFIG: ${JUST_TSCONFIG}`);

  const options = {
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env, NODE_OPTIONS, JUST_TSCONFIG }
  } as any;

  if (port) {
    options.env.PORT = Number(port);
  }

  return options;
}

export function resolveEntryPath(path?: string) {
  if (path) {
    debug(`using entry file: ${path}`);
    return resolve(process.cwd(), path);
  }

  if (process.env.npm_package_main) {
    debug(`using main entry file from package.json: ${process.env.npm_package_main}`);
    return resolve(process.cwd(), process.env.npm_package_main);
  }

  if (process.env.JUST_DEBUG) {
    throw new Error('entry path is not provided');
  }

  return undefined;
}

export async function resolvePort(port?: string | number) {
  if (port) {
    debug(`using PORT: ${port}`);
    return Number(port);
  }

  if (process.env.PORT) {
    debug(`using PORT: ${process.env.PORT}`);
    return Number(process.env.PORT);
  }

  if (process.env.npm_package_config_port) {
    debug(`using port from package.json: ${process.env.npm_package_config_port}`);
    return Number(process.env.npm_package_config_port);
  }

  debug('using random port');

  return getPort({ port: makeRange(3000, 3100) });
}

export function createServer(entryPath: string, port: number, configPath: string) {
  const entry = resolve(process.cwd(), entryPath);
  const options = getOptions(configPath, port);

  let childProcess = fork(entry, options);

  return {
    childProcess,
    stop() {
      childProcess.kill();
    },
    restart() {
      childProcess.kill();
      childProcess = fork(entry, options);
    },
    onExit(callback: (code: number) => void) {
      childProcess.on('exit', callback);
    }
  };
}

export function isCommand(command: string) {
  return whichSync(command, { nothrow: true });
}

export function runCommand(command: string, args: string[], configPath: string) {
  const options = getOptions(configPath);
  return spawnSync(command, args, options);
}

export function runFile(filePath: string, configPath: string) {
  const options = getOptions(configPath);
  return fork(filePath, options);
}
