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
