import assert from 'assert';
import { join } from 'path';
import { existsSync, lstatSync } from 'fs';
import glob from 'glob';

function extractIncludes(include: string[] = []) {
  return include.reduce((entries, p: string) => {
    const path = join(process.cwd(), p);

    if (existsSync(path)) {
      if (lstatSync(path).isDirectory()) {
        const dir = glob.sync(`${path}/**/*.{ts,js}`);
        entries.push(...dir);
      } else {
        entries.push(path);
      }
    }

    return entries;
  }, [] as string[]);
}

export default function tsconfig(file: string) {
  const filePath = join(process.cwd(), file);
  const config = require(filePath);

  assert('include' in config, 'TypeScript config file does not have includes.');
  assert('outDir' in config?.compilerOptions, 'TypeScript config file does not have outDir.');

  return {
    exclude: config.exclude ?? [],
    include: extractIncludes(config.include),
    dest: config.compilerOptions.outDir,
    compilerOptions: config.compilerOptions
  };
}
