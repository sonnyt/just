import {
  transformFileSync,
  transformSync,
  Options,
  DEFAULT_EXTENSIONS,
} from '@swc/core';
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { basename, dirname, join, relative, resolve, extname } from 'path';
import { replaceTscAliasPaths } from 'tsc-alias';

import { timer, error } from '../utils/logger';
import type TSConfig from './tsconfig';

export const EXTENSIONS = DEFAULT_EXTENSIONS.map((ext) => `.${ext}`);

export default class Builder {
  private tsconfig: TSConfig;

  constructor(tsconfig: TSConfig) {
    this.tsconfig = tsconfig;
  }

  private clean() {
    const path = resolve(process.cwd(), this.tsconfig.outDir);

    if (!existsSync(path)) {
      return;
    }

    return rmSync(path, { recursive: true, force: true });
  }

  private get options(): Options {
    return {
      swcrc: false,
      minify: false,
      isModule: true,
      configFile: false,
      cwd: process.cwd(),
      inlineSourcesContent: true,
      jsc: this.tsconfig.jsc,
      sourceMaps: this.tsconfig.sourceMap,
      module: {
        type: 'commonjs',
        noInterop: !this.tsconfig.noInterop,
      },
    };
  }

  private outPath(filename: string) {
    const relativePath = relative(process.cwd(), filename);

    const components = relativePath.split('/').slice(1);

    if (!components.length) {
      return filename;
    }

    while (components[0] === '..') {
      components.shift();
    }

    return join(this.tsconfig.outDir, ...components);
  }

  private write(filename: string, content: string, map?: string) {
    const outDir = dirname(filename);
    const outFile = basename(filename);

    mkdirSync(outDir, { recursive: true });

    if (map && this.tsconfig.fileSourceMap) {
      content += `\n//# sourceMappingURL=${outFile}.map`;
      writeFileSync(`${filename}.map`, map);
    }

    writeFileSync(filename, content);
  }

  private isCompilable(filename: string) {
    const extension = extname(filename);
    return EXTENSIONS.includes(extension);
  }

  transformCode(code: string) {
    return transformSync(code, this.options);
  }

  async transform(filename: string) {
    // ignore .d.ts file
    if (filename.endsWith('.d.ts')) {
      return;
    }

    let outPath = this.outPath(filename);

    // copy non compilable files
    if (!this.isCompilable(filename)) {
      return copyFileSync(filename, outPath);
    }

    outPath = outPath.replace(/\.\w*$/, '.js');
    const sourceFileName = relative(dirname(outPath), filename);

    const options = {
      ...this.options,
      sourceFileName,
      outputPath: outPath,
    };

    const { map, code } = transformFileSync(filename, options);

    return this.write(outPath, code, map);
  }

  async build() {
    try {
      const time = timer();
      time.start('building...');

      this.clean();

      const { files } = this.tsconfig;

      files.forEach((file) => this.transform(file));

      if (this.tsconfig.hasPaths) {
        await replaceTscAliasPaths({
          configFile: this.tsconfig.filePath,
          outDir: this.tsconfig.outDir,
        });
      }

      time.end('build successfully', `(${files.length} modules)`);
    } catch (err) {
      error('build failed');
      throw err;
    }
  }
}
