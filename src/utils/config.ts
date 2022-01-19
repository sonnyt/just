import type { Options } from '@swc/core';
import { resolve } from 'path';

export default async function (tsConfigFile?: string) {
  const defaultOptions = {
    swcrc: false,
    sourceMaps: 'inline',
    minify: false,
    exclude: ['.*\\.d\\.ts$'],
    module: {
      type: 'commonjs',
      noInterop: false,
    },
    jsc: {
      baseUrl: './src',
      target: 'es2017',
      loose: false,
      keepClassNames: true,
      paths: {},
      parser: {
        syntax: 'typescript',
        tsx: false,
        decorators: true,
        dynamicImport: true,
      },
      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
      },
      minify: {
        compress: false,
        mangle: false,
      },
    },
  };

  if (tsConfigFile) {
    const path = resolve(process.cwd(), tsConfigFile);
    const options = await import(path);

    defaultOptions.module.type = options.compilerOptions?.module ?? defaultOptions.module.type;
    defaultOptions.module.noInterop = !options.compilerOptions?.esModuleInterop ?? defaultOptions.module.noInterop;
    defaultOptions.jsc.baseUrl = options.compilerOptions?.baseUrl;
    defaultOptions.jsc.paths = options.compilerOptions?.paths;
  }

  return defaultOptions;
}
