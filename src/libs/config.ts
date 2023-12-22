import ts from 'typescript';
import { existsSync } from 'fs';
import { resolve } from 'path';

import { debug } from '../utils/logger';
import { createDirGlob, createFileGlob } from '../utils/file';
import { Options, JscConfig } from '@swc/core';
import { loadTSConfig } from './typescript';

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

/**
 * Converts a TypeScript script target to a string representation.
 * @param target - The TypeScript script target.
 * @returns The string representation of the script target.
 */
export function toTsTarget(target: ts.ScriptTarget) {
  switch (target) {
    case ts.ScriptTarget.ES3:
      return 'es3'
    case ts.ScriptTarget.ES5:
      return 'es5'
    case ts.ScriptTarget.ES2015:
      return 'es2015'
    case ts.ScriptTarget.ES2016:
      return 'es2016'
    case ts.ScriptTarget.ES2017:
      return 'es2017'
    case ts.ScriptTarget.ES2018:
      return 'es2018'
    case ts.ScriptTarget.ES2019:
      return 'es2019'
    case ts.ScriptTarget.ES2020:
      return 'es2020'
    case ts.ScriptTarget.ES2021:
      return 'es2021'
    case ts.ScriptTarget.ES2022:
    case ts.ScriptTarget.ESNext:
    case ts.ScriptTarget.Latest:
      return 'es2022'
    case ts.ScriptTarget.JSON:
      return 'es5'
  }
}

/**
 * Converts a TypeScript module kind to a string representation.
 * @param moduleKind - The TypeScript module kind.
 * @returns The string representation of the module kind.
 */
export function toModule(moduleKind: ts.ModuleKind) {
  switch (moduleKind) {
    case ts.ModuleKind.CommonJS:
      return 'commonjs'
    case ts.ModuleKind.UMD:
      return 'umd'
    case ts.ModuleKind.AMD:
      return 'amd'
    case ts.ModuleKind.ES2015:
    case ts.ModuleKind.ES2020:
    case ts.ModuleKind.ES2022:
    case ts.ModuleKind.ESNext:
    case ts.ModuleKind.Node16:
    case ts.ModuleKind.NodeNext:
    case ts.ModuleKind.None:
      return 'es6'
    case ts.ModuleKind.System:
      throw new TypeError('Do not support system kind module')
  }
}

/**
 * Formats the paths object by resolving each path relative to the base URL.
 * @param paths - The paths object to be formatted.
 * @param baseUrl - The base URL to resolve the paths against.
 * @returns The formatted paths object with resolved paths.
 */
export function formatPaths(paths = {}, baseUrl: string) {
  return Object
    .entries(paths)
    .reduce((paths, [key, value]) => {
      paths![key] = (value as string[] ?? []).map((path) => resolve(baseUrl, path));
      return paths;
    }, {} as Record<string, string[]>);
}

/**
 * Converts TypeScript compiler options to SWC configuration options.
 * 
 * @param options - TypeScript compiler options.
 * @returns SWC configuration options.
 */
export function convertSWCConfig(options: ts.CompilerOptions): Options {
  const target = options.target ?? ts.ScriptTarget.ES2018;

  return {
    swcrc: false,
    minify: false,
    isModule: true,
    configFile: false,
    cwd: process.cwd(),
    sourceMaps: options.sourceMap && options.inlineSourceMap ? 'inline' : Boolean(options.sourceMap),
    module: {
      noInterop: !options.esModuleInterop,
      type: toModule(options.module ?? ts.ModuleKind.ES2015)!,
      strictMode: options.strict || options.alwaysStrict || false,
    },
    jsc: {
      keepClassNames: true,
      externalHelpers: false,
      target: toTsTarget(target),
      baseUrl: resolve(options.baseUrl ?? './'),
      paths: formatPaths(options.paths, options.baseUrl ?? './') as any,
      parser: {
        tsx: !!options.jsx,
        dynamicImport: true,
        syntax: 'typescript',
        decorators: options.experimentalDecorators ?? false,
      },
      transform: {
        legacyDecorator: true,
        decoratorMetadata: options.emitDecoratorMetadata ?? false,
      },
      minify: {
        compress: false,
        mangle: false
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
  const { compilerOptions, config, fileNames: compileFiles } = loadTSConfig(path);
  const swc = convertSWCConfig(compilerOptions);

  const include = createDirGlob(config.include ?? ['./']);
  const exclude = createDirGlob(config.exclude ?? ['node_modules']);
  const outDir = compilerOptions.outDir ?? 'dist';
  const staticFiles = createFileGlob(include, compileFiles);

  return { swc, outDir, include, exclude, staticFiles, compilerOptions, compileFiles };
}
