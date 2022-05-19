import color from 'colors/safe';

import TSConfig from '../libs/tsconfig';
import TypeChecker from '../libs/typechecker';
import Builder from '../libs/builder';
import { error, info } from '../utils/logger';

interface Options {
  transpileOnly: boolean;
  outDir?: string;
  config: string;
  color: boolean;
  debug: boolean;
}

export default async function (files: string, options: Options) {
  try {
    if (options.debug) {
      info('debugger is on');
    }

    // disable colors
    if (!options.color) {
      color.disable();
    }

    const tsconfig = new TSConfig({
      include: files,
      outDir: options.outDir,
      filePath: options.config,
    });

    const builder = new Builder(tsconfig);
    const typeChecker = new TypeChecker(tsconfig);

    if (!options.transpileOnly) {
      typeChecker.check();
    }

    await builder.build();
  } catch (err) {
    if (options.debug) {
      error(err);
    }
  }
}
