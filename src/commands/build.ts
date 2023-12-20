import color from 'colors/safe';

import { debug, error, info, timer } from '../utils/logger';
import { resolveConfigPath, loadConfig } from '../libs/config';
import { cleanOutDir, resolveSourcePaths, compileFiles } from '../libs/swc';
import { checkFiles } from '../libs/typescript';

interface Options {
  transpileOnly: boolean;
  outDir?: string;
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (filePath: string, options: Options) {
  if (options.debug) {
    process.env.JUST_DEBUG = 'TRUE';
    info('debugger is on');
  }

  if (!options.color) {
    color.disable();
  }

  const configPath = resolveConfigPath(options.config);
  const config = loadConfig(configPath);
  const filePaths = resolveSourcePaths(filePath ? [filePath] : config.include, config.exclude);

  let typeCheckError = false;

  if (!options.transpileOnly) {
    const time = timer();
    time.start('type checking...');

    typeCheckError = checkFiles(filePaths.compile, config.ts.compilerOptions!);

    time.end('type check');
  }

  if (typeCheckError) {
    return;
  }

  const time = timer();
  time.start('building...');

  cleanOutDir(config.outDir);
  await compileFiles(filePaths.compile, config.outDir, config.swc);

  time.end('build');

  process.on('unhandledRejection', err => {
    if (process.env.JUST_DEBUG) {
      debug(err);
    } else {
      error('Oops! Something went wrong!');
    }

    process.exit(1);
  });
}
