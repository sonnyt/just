import color from 'colors/safe';

import * as log from '../utils/logger';
import { resolveConfigPath, loadConfig } from '../libs/config';
import { cleanOutDir, compileFiles, copyStaticFiles } from '../libs/swc';
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
    log.info('debugger is on');
  }

  if (!options.color) {
    color.disable();
  }

  const configPath = resolveConfigPath(options.config);
  const config = loadConfig(configPath);
  const compilablePaths = filePath ? [filePath] : config.compileFiles;
  const copyablePaths = config.staticFiles;

  if (!options.transpileOnly) {
    const time = log.timer();
    time.start('type checking...');

    const typeCheckError = checkFiles(compilablePaths, config.compilerOptions);

    time.end('type check');

    if (typeCheckError) {
      return;
    }
  }

  const time = log.timer();
  time.start('building...');

  await cleanOutDir(config.outDir);

  await Promise.all([
    compileFiles(compilablePaths, config.outDir, config.swc),
    copyStaticFiles(copyablePaths, config.outDir),
  ]);

  time.end('build');
}
