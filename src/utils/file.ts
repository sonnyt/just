import { InvalidArgumentError } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import stripJsonComments from 'strip-json-comments';

import { info } from './logger';

export function readJSONFile(path: string) {
  if (!existsSync(path)) {
    throw new Error(`${path} not found`);
  }

  const file = readFileSync(path, 'utf-8');
  const content = stripJsonComments(file.toString());

  return JSON.parse(content);
}

export function findEntryPath(path: string) {
  if (path) {
    return path;
  }

  info('entry path is not provided, using "main" in package.json');

  const packageFilePath = resolve(process.cwd(), 'package.json');

  try {
    const json = readJSONFile(packageFilePath);

    if (!json.main) {
      throw new Error('Missing main property');
    }

    return json.main;
  } catch {
    throw new InvalidArgumentError('Entry path is not found');
  }
}

export function findConfigPath(path: string) {
  if (path) {
    return path;
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
