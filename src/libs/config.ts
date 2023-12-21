import ts from 'typescript';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { tsCompilerOptionsToSwcConfig } from '@swc-node/register/read-default-tsconfig';

import { debug } from '../utils/logger';
import { createDirGlob, createFileGlob } from '../utils/file';
import { Options } from '@swc/core';

/**
 * Configuration file names.
 */
const CONFIG_FILES = ['tsconfig.json', 'jsconfig.json'] as const;

/**
 * Resolves the path to the configuration file.
 * If a path is provided, it will be used.
 * Otherwise, it will check for the environment variable JUST_TSCONFIG.
 * If neither a path nor an environment variable is found, it will search for a default configuration file.
 * If no configuration file is found, it will fallback to the default configuration file.
 * @param path - Optional path to the configuration file.
 * @returns The resolved path to the configuration file.
 */
export function resolveConfigPath(path = process.env.JUST_TSCONFIG ?? process.env.TS_NODE_PROJECT) {
  if (path) {
    debug(`using config file: ${path}`);
    return resolve(process.cwd(), path);
  }

  const filePath = CONFIG_FILES.find((file) => {
    const resolvedPath = resolve(process.cwd(), file);
    return existsSync(resolvedPath);
  });

  if (filePath) {
    debug(`using config file: ${filePath}`);
    return filePath;
  }

  debug(
    `config file is missing, falling back to default configuration.`
  );

  return resolve(__dirname, '..', '..', 'just.tsconfig.json');
}

export function loadTSConfig(path: string) {
  const { config } = ts.readConfigFile(path, ts.sys.readFile);
  const { options, fileNames } = ts.parseJsonConfigFileContent(config, ts.sys, dirname(path));

  options.importHelpers = false;
  options.files = fileNames;

  const include = createDirGlob(config.include ?? ['./']);
  const exclude = createDirGlob(config.exclude ?? ['node_modules']);

  return {
    options, include, exclude,
    compileFiles: fileNames,
    outDir: options.outDir ?? 'dist',
    staticFiles: createFileGlob(include, fileNames)
  };
}

export function convertSWCConfig(options: ts.CompilerOptions): Options {
  const config = tsCompilerOptionsToSwcConfig(options, '');

  return {
    swcrc: false,
    configFile: false,
    cwd: process.cwd(),
    sourceMaps: config.sourcemap,
    module: {
      type: config.module!,
      noInterop: config.esModuleInterop,
      strictMode: options.strict || options.alwaysStrict || false,
    },
    jsc: {
      paths: config.paths,
      target: config.target,
      externalHelpers: false,
      baseUrl: config.baseUrl,
      keepClassNames: config.keepClassNames,
      parser: {
        tsx: config.jsx,
        dynamicImport: true,
        syntax: 'typescript',
        decorators: config.experimentalDecorators,
      },
      transform: {
        react: config.react,
        legacyDecorator: true,
        decoratorMetadata: config.emitDecoratorMetadata,
      },
    },
  };
}

/**
 * Loads the configuration from the specified path.
 * @param path - The path to the configuration file.
 * @returns The loaded configuration object.
 */
export function loadConfig(path: string) {
  const ts = loadTSConfig(path);
  const swc = convertSWCConfig(ts.options);

  return {
    swc,
    ts: ts.options,
    outDir: ts.outDir,
    include: ts.include,
    exclude: ts.exclude,
    staticFiles: ts.staticFiles,
    compileFiles: ts.compileFiles,
  };
}
