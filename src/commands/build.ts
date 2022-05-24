import color from 'colors/safe';

import { loadConfig } from '../libs/config';
import { compileFiles, replaceAliasPaths } from '../libs/compiler';
import { error, info } from '../utils/logger';
import { checkFiles } from '../libs/typechecker';
import { createFileGlob } from '../utils/file';

interface Options {
  transpileOnly: boolean;
  outDir?: string;
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (filePaths: string, options: Options) {
  if (options.debug) {
    info('debugger is on');
  }

  if (!options.color) {
    color.disable();
  }

  try {
    const config = loadConfig(options.config);

    const paths = filePaths ? [filePaths] : config.include;
    const fileNames = createFileGlob(paths, config.exclude);

    if (!options.transpileOnly) {
      checkFiles(fileNames, config.compilerOptions);
    }

    const outDir = options.outDir ?? config.compilerOptions.outDir ?? 'dist';

    compileFiles(fileNames, config.swcOptions, outDir);

    const hasPaths = Object.keys(config.compilerOptions.paths ?? {}).length > 0;

    if (hasPaths) {
      await replaceAliasPaths(options.config, outDir);
    }
  } catch (err) {
    if (options.debug) {
      error(err);
    }
  }
}
