import dirGlob from 'dir-glob';
import { readFileSync, existsSync } from 'fs';
import glob from 'glob';
import { resolve } from 'path';
import stripJsonComments from 'strip-json-comments';

import { error, info } from './logger';

export function readJSONFile(path: string) {
  if (!existsSync(path)) {
    throw new Error(`${path} not found`);
  }

  const file = readFileSync(path, 'utf-8');
  const content = stripJsonComments(file.toString());

  return JSON.parse(content);
}

export function findConfigPath(path?: string) {
  if (path) {
    return path;
  }

  if (process.env.JUST_TSCONFIG) {
    return process.env.JUST_TSCONFIG;
  }

  const filePath = ['tsconfig.json', 'jsconfig.json'].find((file) => {
    const resolvedPath = resolve(process.cwd(), file);
    return existsSync(resolvedPath);
  });

  if (filePath) {
    return resolve(process.cwd(), filePath);
  }

  info(
    'tsconfig.json or jsconfig.json files are missing, using the default settings'
  );

  return resolve(__dirname, '..', '..', 'just.tsconfig.json');
}

export function findEntryPath(path: string) {
  if (path) {
    return path;
  }

  info('entry path is not provided, using "main" in package.json');

  const packageFilePath = resolve(process.cwd(), 'package.json');

  const json = readJSONFile(packageFilePath);

  if (!json.main) {
    error('entry path is not found');
    throw new Error("package doesn't contain main property");
  }

  return json.main;
}

export function createDirGlob(paths: string, extensions: string[] = []) {
  return dirGlob.sync(paths, {
    extensions,
    cwd: process.cwd(),
  });
}

export function createFileGlob(paths: string[] = [], ignore: string[] = []) {
  return paths.flatMap((path: string) => {
    return glob.sync(path, { nodir: true, ignore });
  });
}
