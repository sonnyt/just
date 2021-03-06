import color from 'colors/safe';
import { createFileGlob, findConfigPath, findEntryPath } from '../utils/file';
import { loadConfig } from '../libs/config';
import Server from '../libs/server';
import { checkFile, checkFiles } from '../libs/typechecker';
import Watcher from '../libs/watcher';
import { error, info, wait } from '../utils/logger';

interface Options {
  typeCheck: boolean;
  port?: string;
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (entry: string, options: Options) {
  if (options.debug) {
    info('debugger is on');
  }

  if (!options.color) {
    color.disable();
  }

  try {
    const configPath = findConfigPath(options.config);
    const config = loadConfig(configPath);

    if (options.typeCheck) {
      const fileNames = createFileGlob(config.include, config.exclude);
      checkFiles(fileNames, config.compilerOptions);
    }

    const entryPath = findEntryPath(entry);
    const server = new Server(configPath, entryPath, options.port);

    const watcher = new Watcher(config.include, config.exclude);

    process.on('SIGINT', () => {
      wait('\nshutting down...');

      server.stop();
      watcher.stop();

      process.exit(process.exitCode);
    });

    await watcher.ready(() => server.start());

    await watcher.change((fileName) => {
      if (options.typeCheck) {
        checkFile(fileName, config.compilerOptions);
      }

      server.restart();
    });
  } catch (err) {
    if (options.debug) {
      error(err);
    }
  }
}
