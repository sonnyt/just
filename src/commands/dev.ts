import color from 'colors/safe';

import { watchFiles } from '../utils/file';
import { error, event, info, timer, wait } from '../utils/logger';
import { loadConfig, resolveConfigPath } from '../libs/config';
import { checkFile, checkFiles } from '../libs/typescript';
import { createServer, resolveEntryPath, resolvePort } from '../libs/server';
import { resolveSourcePaths } from '../libs/swc';

interface Options {
  typeCheck: boolean;
  port?: string;
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (entryFile: string, options: Options) {
  if (options.debug) {
    process.env.JUST_DEBUG = 'TRUE';
    info('debugger is on');
  }

  if (!options.color) {
    color.disable();
  }

  const configPath = resolveConfigPath(options.config);
  const config = loadConfig(configPath);

  let typeCheckError = false;

  if (options.typeCheck) {
    const filePaths = resolveSourcePaths(config.include, config.exclude);
    typeCheckError = checkFiles(filePaths.compile, config.ts.compilerOptions);
  }

  if (typeCheckError) {
    return;
  }

  const entryFilePath = resolveEntryPath(entryFile);

  if (!entryFilePath) {
    error('entry path is not provided');
    return;
  }

  const portNumber = await resolvePort(options.port);

  wait('starting server...');

  const server = createServer(entryFilePath, portNumber, configPath);

  event('server started on port: ' + portNumber);

  const watcher = await watchFiles(config.include, config.exclude);

  server.onExit((code) => {
    if (code === 0) {
      event('server stopped');
      server.stop();
      watcher.stop();
      process.exit(0);
    } else {
      error('server crashed');
    }
  });

  watcher.onChange(async (fileName) => {
    let typeCheckError = false;

    if (options.typeCheck) {
      typeCheckError = checkFile(fileName, config.ts.compilerOptions);
    }

    if (typeCheckError) {
      return;
    }

    const time = timer();
    time.start('restarting server...');
    server.restart();
    time.end('restarted server');
  });

  process.on('SIGINT', () => {
    wait('shutting down...');
    watcher.stop();
    server.stop();
    process.exit(process.exitCode);
  });
}
