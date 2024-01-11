import { resolve } from 'path';
import { fork, spawnSync } from 'child_process';
import getPort, { makeRange } from 'get-port';
import { sync as whichSync } from 'which';

import * as log from '../utils/logger';
import { existsSync } from 'fs';

/**
 * Retrieves the options for the server.
 * 
 * @param JUST_TSCONFIG - The path to the JUST_TSCONFIG file.
 * @param port - The port number for the server (optional).
 * @returns The options object for the server.
 */
export function getOptions(JUST_TSCONFIG: string, port?: string | number) {
  const flags = [
    process.env['NODE_OPTIONS'],
    `-r ${require.resolve('dotenv/config')}`,
    `-r ${__dirname}/register.js`,
    '--no-warnings',
  ];

  const NODE_OPTIONS = flags.filter((option) => !!option).join(' ');

  log.debug(`using NODE_OPTIONS: ${NODE_OPTIONS}`);
  log.debug(`using PORT: ${port}`);
  log.debug(`using JUST_TSCONFIG: ${JUST_TSCONFIG}`);

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

/**
 * Loads the package.json file from the current working directory.
 * @returns The content of the package.json file, or undefined if it cannot be loaded.
 */
export function loadPackageJson() {
  const path = resolve(process.cwd(), 'package.json');

  let content;

  try {
    content = require(path);
  } catch (error) { }

  return content;
}

/**
 * Resolves the entry path for the server.
 * 
 * @param path - Optional path to the entry file.
 * @returns The resolved entry path or undefined if not provided.
 * @throws Error if entry path is not provided and JUST_DEBUG environment variable is set.
 */
export function resolveEntryPath(path?: string) {
  if (path) {
    log.debug(`using entry file: ${path}`);
    return resolve(process.cwd(), path);
  }

  const packageJson = loadPackageJson();

  if (packageJson?.main) {
    log.debug(`using main entry file from package.json: ${packageJson.main}`);
    return resolve(process.cwd(), packageJson.main);
  }

  log.error('entry path is not provided');

  if (process.env.JUST_DEBUG) {
    throw new Error('entry path is not provided');
  }

  return undefined;
}

/**
 * Resolves the port number to be used by the server.
 * If a specific port is provided, it will be used.
 * Otherwise, it checks for the PORT environment variable.
 * If not found, it checks for the port specified in package.json.
 * If still not found, it uses a random port within the range 3000-3100.
 * 
 * @param port - Optional port number to be used.
 * @returns The resolved port number.
 */
export async function resolvePort(port = process.env.PORT) {
  if (port) {
    log.debug(`using PORT: ${port}`);
    return Number(port);
  }

  if (process.env.npm_package_config_port) {
    log.debug(`using port from package.json: ${process.env.npm_package_config_port}`);
    return Number(process.env.npm_package_config_port);
  }

  const randomPort = await getPort({ port: makeRange(3000, 3100) });

  log.debug('using PORT: ' + randomPort);

  return randomPort;
}

/**
 * Creates a server by forking a child process with the specified entry path, port, and config path.
 * @param entryPath - The path to the entry file for the server.
 * @param port - The port number on which the server should listen.
 * @param configPath - The path to the configuration file for the server.
 * @returns An object with methods to control the server:
 *   - `childProcess`: The child process created by forking.
 *   - `stop()`: Stops the server by killing the child process.
 *   - `restart()`: Restarts the server by killing the current child process and forking a new one.
 *   - `onExit(callback)`: Registers a callback function to be called when the child process exits.
 */
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

/**
 * Checks if a command exists in the system.
 * @param command - The command to check.
 * @returns True if the command exists, false otherwise.
 */
export function isCommand(command: string) {
  return whichSync(command, { nothrow: true });
}

/**
 * Runs a command with the specified arguments and configuration path.
 * @param command - The command to run.
 * @param args - The arguments to pass to the command.
 * @param configPath - The path to the configuration file.
 * @returns The result of the command execution.
 */
export function runCommand(command: string, args: string[], configPath: string) {
  if (!isCommand(command)) {
    log.error(`command ${command} does not exist`);
    return;
  }

  const options = getOptions(configPath);
  return spawnSync(command, args, options);
}

/**
 * Runs a file with the specified configuration.
 * 
 * @param filePath - The path of the file to run.
 * @param configPath - The path of the configuration file.
 * @returns A forked process.
 */
export function runFile(filePath: string, configPath: string) {
  if (!existsSync(filePath)) {
    log.error(`file ${filePath} does not exist`);
    return;
  }

  const options = getOptions(configPath);
  return fork(filePath, options);
}
