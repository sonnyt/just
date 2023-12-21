import color from 'colors/safe';

import * as log from '../utils/logger';
import { watchFiles } from '../utils/file';
import { loadConfig, resolveConfigPath } from '../libs/config';
import { checkFile, checkFiles } from '../libs/typescript';
import { createServer, resolveEntryPath, resolvePort } from '../libs/server';

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
    log.info('debugger is on');
  }

  if (!options.color) {
    color.disable();
  }

  const configPath = resolveConfigPath(options.config);
  const config = loadConfig(configPath);

  console.log(config.swc);

  const entryFilePath = resolveEntryPath(entryFile);

  if (!entryFilePath) {
    log.error('entry path is not provided');
    return;
  }

  if (options.typeCheck) {
    const time = log.timer();
    time.start('type checking...');

    const typeCheckError = checkFiles(config.compileFiles, config.ts);

    time.end('type check');

    if (typeCheckError) {
      return;
    }
  }

  const portNumber = await resolvePort(options.port);

  log.wait('starting server...');

  const server = createServer(entryFilePath, portNumber, configPath);

  log.event('server started on port: ' + portNumber);

  const watcher = await watchFiles(config.include, config.exclude);

  server.onExit((code) => {
    if (code === 0) {
      log.event('server stopped');

      server.stop();
      watcher.stop();
      process.exit(0);
    } else {
      log.error('server crashed');
    }
  });

  watcher.onChange(async (fileName) => {
    if (options.typeCheck) {
      const time = log.timer();
      time.start('type checking...');

      const typeCheckError = checkFile(fileName, config.ts);

      time.end('type check');

      if (typeCheckError) {
        return;
      }
    }

    const time = log.timer();
    time.start('restarting server...');

    server.restart();

    time.end('restarted server');
  });

  process.on('SIGINT', () => {
    log.wait('shutting down...');

    watcher.stop();
    server.stop();
    process.exit(process.exitCode);
  });
}
