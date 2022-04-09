import { transformFileSync, transformSync, Options } from '@swc/core';
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join, relative, resolve } from 'path';
import { replaceTscAliasPaths } from 'tsc-alias';

import { timer, error } from './logger';
import type TSConfig from './tsconfig';

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
        noInterop: this.tsconfig.compilerOptions.esModuleInterop,
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

    if (
      map &&
      this.tsconfig.sourceMap &&
      this.tsconfig.sourceMap !== 'inline'
    ) {
      content += `\n//# sourceMappingURL=${outFile}.map`;
      writeFileSync(`${filename}.map`, map);
    }

    writeFileSync(filename, content);
  }

  private copy(filename: string, dest: string) {
    copyFileSync(filename, dest);
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

    // copy non .ts file
    if (!filename.endsWith('.ts')) {
      return this.copy(filename, outPath);
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

      this.tsconfig.files.forEach((file) => {
        this.transform(file);
      });

      if (this.tsconfig.hasPaths) {
        await replaceTscAliasPaths({
          configFile: this.tsconfig.filePath,
          outDir: this.tsconfig.outDir,
        });
      }

      time.end('build successfully', `(${this.tsconfig.files.length} modules)`);
    } catch (err) {
      error('build failed');
      throw err;
    }
  }
}
