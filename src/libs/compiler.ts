import { transformFileSync, transformSync, Options } from '@swc/core';
import { replaceTscAliasPaths } from 'tsc-alias';
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { basename, dirname, join, relative, resolve, extname } from 'path';

import { timer, error } from '../utils/logger';

export const EXTENSIONS = ['.ts', '.tsx'];

function writeFile(fileName: string, content: string, map?: string) {
  const outDir = dirname(fileName);

  mkdirSync(outDir, { recursive: true });

  if (map) {
    const outFile = basename(fileName);
    content += `\n//# sourceMappingURL=${outFile}.map`;
    writeFileSync(`${fileName}.map`, map);
  }

  writeFileSync(fileName, content);
}

function isCompilable(fileName: string) {
  const extension = extname(fileName);
  return EXTENSIONS.includes(extension);
}

function resolveOutPath(fileName: string, outDir: string) {
  const relativePath = relative(process.cwd(), fileName);

  const components = relativePath.split('/').slice(1);

  if (!components.length) {
    return join(outDir, fileName);
  }

  while (components[0] === '..') {
    components.shift();
  }

  return join(outDir, ...components);
}

function cleanOutDir(outDir: string) {
  const path = resolve(process.cwd(), outDir);

  if (!existsSync(path)) {
    return;
  }

  return rmSync(path, { recursive: true, force: true });
}

export function replaceAliasPaths(configFile: string, outDir: string) {
  return replaceTscAliasPaths({ configFile, outDir });
}

export function compileFiles(
  fileNames: string[] = [],
  options: Options,
  outDir: string
) {
  try {
    const time = timer();
    time.start('building...');

    cleanOutDir(outDir);

    fileNames.forEach((fileName) => {
      // ignore .d.ts file
      if (fileName.endsWith('.d.ts')) {
        return;
      }

      let outputPath = resolveOutPath(fileName, outDir);

      // copy non-compilable files
      if (!isCompilable(fileName)) {
        return copyFileSync(fileName, outputPath);
      }

      outputPath = outputPath.replace(/\.\w*$/, '.js');
      const sourceFileName = relative(dirname(outputPath), fileName);

      const { map, code } = transformFileSync(fileName, {
        sourceFileName,
        outputPath,
        ...options,
      });

      const mapContent = options.sourceMaps === true ? map : undefined;

      writeFile(outputPath, code, mapContent);
    });

    time.end('build successfully', `(${fileNames.length} modules)`);
  } catch (err) {
    error('build failed');
    throw err;
  }
}

export function compileCode(code: string, options: Options) {
  return transformSync(code, options);
}
