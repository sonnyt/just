import color from 'colors/safe';

import TSConfig from '../libs/tsconfig';
import TypeChecker from '../libs/typechecker';
import Builder from '../libs/builder';
import { error, info } from '../utils/logger';

interface Options {
  tsconfig: string;
  transpileOnly: boolean;
  color: boolean;
  outDir?: string;
}

export default async function (files: string, options: Options) {
  try {
    if (process.env.JUST_DEBUG) {
      info('debugger is on');
    }

    // disable colors
    if (!options.color) {
      color.disable();
    }

    const tsconfig = new TSConfig({
      include: files,
      isSilenced: false,
      outDir: options.outDir,
      filePath: options.tsconfig,
    });

    const builder = new Builder(tsconfig);
    const typeChecker = new TypeChecker(tsconfig);

    if (!options.transpileOnly) {
      typeChecker.check();
    }

    await builder.build();
  } catch (err) {
    if (process.env.JUST_DEBUG) {
      error(err);
    }
  }
}
