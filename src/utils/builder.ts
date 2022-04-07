import { transformFileSync, Options } from '@swc/core';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { basename, dirname, resolve } from 'path';

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
      jsc: this.tsconfig.jsc,
      sourceMaps: this.tsconfig.sourceMap,
      inlineSourcesContent: true,
      module: {
        type: 'commonjs',
        noInterop: this.tsconfig.compilerOptions.esModuleInterop,
      },
    };
  }

  private write(file: string, content: string, map?: string) {
    const destDir = resolve(this.tsconfig.outDir, dirname(file));
    const fileName = basename(file).replace(/\.\w*$/, '.js');
    const destFile = resolve(destDir, fileName);

    mkdirSync(destDir, { recursive: true });

    if (
      map &&
      this.tsconfig.sourceMap &&
      this.tsconfig.sourceMap !== 'inline'
    ) {
      content += `\n//# sourceMappingURL=${fileName}.map`;
      writeFileSync(`${destFile}.map`, map);
    }

    writeFileSync(destFile, content);
  }

  transform(file: string) {
    const { map, code } = transformFileSync(file, this.options);
    this.write(file, code, map);
  }

  buildFile(file: string) {
    try {
      const time = timer();
      time.start('building', file, '...');

      this.transform(file);

      time.end('build successfully');
    } catch (err) {
      error('build failed');
      throw err;
    }
  }

  build() {
    try {
      const time = timer();
      time.start('building...');

      this.clean();

      this.tsconfig.files.forEach((file) => this.transform(file));

      time.end('build successfully', `(${this.tsconfig.files.length} modules)`);
    } catch (err) {
      error('build failed');
      throw err;
    }
  }
}
