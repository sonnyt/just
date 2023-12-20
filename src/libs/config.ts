import { convertTsConfig } from 'tsconfig-to-swcconfig';
import { parseTsconfig, TsConfigJson } from 'get-tsconfig';
import { existsSync } from 'fs';
import { resolve } from 'path';

import { debug } from '../utils/logger';
import { createDirGlob } from '../utils/file';

/**
 * Configuration file names.
 */
const CONFIG_FILES = ['tsconfig.json', 'jsconfig.json'] as const;

/**
 * Returns an array of supported file extensions based on the provided compiler options.
 * @param compilerOptions - The compiler options object.
 * @returns An array of supported file extensions.
 */
export function supportedExtensions(compilerOptions: TsConfigJson.CompilerOptions = {}) {
  const extensions = ['ts', 'tsx'];

  if (compilerOptions.allowJs) {
    extensions.push('js', 'jsx');
  }

  if (compilerOptions.resolveJsonModule) {
    extensions.push('json');
  }

  return extensions;
}

/**
 * Parses the given TsConfigJson object and returns a parsed configuration object.
 * @param config The TsConfigJson object to parse.
 * @returns The parsed configuration object.
 */
export function parseConfig(config: TsConfigJson) {
  const extensions = supportedExtensions(config.compilerOptions);

  return {
    extensions,
    outDir: config.compilerOptions?.outDir ?? 'dist',
    include: createDirGlob(config.include ?? ['./'], extensions),
    exclude: createDirGlob(config.exclude ?? ['node_modules']),
  };
}

/**
 * Resolves the path to the configuration file.
 * If a path is provided, it will be used.
 * Otherwise, it will check for the environment variable JUST_TSCONFIG.
 * If neither a path nor an environment variable is found, it will search for a default configuration file.
 * If no configuration file is found, it will fallback to the default configuration file.
 * @param path - Optional path to the configuration file.
 * @returns The resolved path to the configuration file.
 */
export function resolveConfigPath(path?: string) {
  if (path) {
    debug(`using config file: ${path}`);
    return resolve(process.cwd(), path);
  }

  if (process.env.JUST_TSCONFIG) {
    debug(`using config file: ${process.env.JUST_TSCONFIG}`);
    return resolve(process.cwd(), process.env.JUST_TSCONFIG);
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
 * Loads the SWC configuration with optional compiler options.
 * 
 * @param compilerOptions - Optional compiler options to be used.
 * @returns The loaded SWC configuration.
 */
export function loadSWCConfig(compilerOptions: TsConfigJson.CompilerOptions = {}) {
  const config = convertTsConfig(compilerOptions);

  config.cwd = process.cwd();
  config.configFile = false;
  config.swcrc = false;

  if (config.jsc?.baseUrl) {
    config.jsc.baseUrl = resolve(process.cwd(), config.jsc.baseUrl);
  }

  if (config.jsc?.paths) {
    Object.entries(config.jsc.paths).forEach(([key, paths]) => {
      config.jsc!.paths![key] = paths.map((path) =>
        resolve(process.cwd(), path)
      );
    });
  }

  return config;
}

/**
 * Loads the configuration from the specified path.
 * @param path - The path to the configuration file.
 * @returns The loaded configuration object.
 */
export function loadConfig(path: string) {
  const ts = parseTsconfig(path);
  const swc = loadSWCConfig(ts.compilerOptions);
  const config = parseConfig(ts);
  return { ts, swc, ...config };
}
