import { Options } from '@swc/core';

import { error } from '../utils/logger';
import { createDirGlob, readJSONFile } from '../utils/file';
import { CompilerOptions, convertCompilerOptionsFromJson } from 'typescript';

export const TARGETS = [
  'es3',
  'es5',
  'es2015',
  'es2016',
  'es2017',
  'es2018',
  'es2019',
  'es2020',
  'es2021',
  'es2022',
];

function loadFile(fileName: string) {
  try {
    return readJSONFile(fileName);
  } catch (err) {
    error('failed to load the config file');
    throw err;
  }
}

function validateTarget(target: string) {
  const optionTarget = target.toLowerCase();

  if (!TARGETS.includes(optionTarget)) {
    const err = `target must be one of: ${TARGETS.join(',')}`;
    error(err);
    throw err;
  }
}

function convertCompilerOptions(compilerOptions: any) {
  const { options, errors } = convertCompilerOptionsFromJson(
    compilerOptions,
    ''
  );

  if (errors.length) {
    error('failed to parse the config option');
    console.log(errors);
    throw errors;
  }

  return options;
}

function convertSWCOptions(compilerOptions: any): Options {
  let sourceMaps: boolean | 'inline' = false;

  if (compilerOptions.inlineSourceMap) {
    sourceMaps = 'inline';
  }

  if (compilerOptions.sourceMap) {
    sourceMaps = true;
  }

  return {
    swcrc: false,
    minify: false,
    isModule: true,
    configFile: false,
    cwd: process.cwd(),
    inlineSourcesContent: true,
    sourceMaps,
    jsc: {
      keepClassNames: true,
      baseUrl: compilerOptions.baseUrl,
      target: compilerOptions.target.toLowerCase(),
      parser: {
        syntax: 'typescript',
        decorators: compilerOptions.experimentalDecorators,
        dynamicImport: compilerOptions.dynamicImport,
      },
      transform: {
        legacyDecorator: compilerOptions.experimentalDecorators,
        decoratorMetadata: compilerOptions.emitDecoratorMetadata,
      },
      minify: {
        compress: false,
        mangle: false,
      },
    },
    module: {
      type: 'commonjs',
      noInterop: !(compilerOptions.esModuleInterop ?? true),
    },
  };
}

function fileExtensions(compilerOptions: CompilerOptions) {
  const extensions = ['ts', 'tsx'];

  if (compilerOptions?.allowJs) {
    extensions.concat(['js', 'jsx']);
  }

  if (compilerOptions?.resolveJsonModule) {
    extensions.push('json');
  }

  return extensions;
}

export function loadConfig(fileName: string) {
  const options = loadFile(fileName);

  validateTarget(options?.compilerOptions?.target);

  const compilerOptions = convertCompilerOptions(options?.compilerOptions);
  const swcOptions = convertSWCOptions(options?.compilerOptions);
  const extensions = fileExtensions(compilerOptions);

  return {
    swcOptions,
    compilerOptions,
    include: createDirGlob(options.include ?? ['./'], extensions),
    exclude: createDirGlob(options.exclude ?? ['node_modules']),
  };
}
