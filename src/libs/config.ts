import { convertTsConfig } from 'tsconfig-to-swcconfig';
import { parseTsconfig, TsConfigJson } from 'get-tsconfig';
import { existsSync } from 'fs';
import { resolve } from 'path';

import { debug } from '../utils/logger';
import { createDirGlob } from '../utils/file';

const CONFIG_FILES = ['tsconfig.json', 'jsconfig.json'] as const;

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

export function parseConfig(config: TsConfigJson) {
  const extensions = supportedExtensions(config.compilerOptions);

  return {
    extensions,
    outDir: config.compilerOptions?.outDir ?? 'dist',
    include: createDirGlob(config.include ?? ['./'], extensions),
    exclude: createDirGlob(config.exclude ?? ['node_modules']),
  };
}

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

export function loadConfig(path: string) {
  const ts = parseTsconfig(path);
  const swc = loadSWCConfig(ts.compilerOptions);
  const config = parseConfig(ts);
  return { ts, swc, ...config };
}
