import glob from 'glob';
import dirGlob from 'dir-glob';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { JscConfig } from '@swc/core';

import { error, info } from '../utils/logger';
import { readJSONFile } from '../utils/file';

interface TSConfigOptions {
  filePath: string;
  isSilenced: boolean;
  include?: string;
  outDir?: string;
}

export default class TSConfig {
  private _outDir?: string;
  private _include: string[] | null;
  private isSilenced: boolean;

  filePath: string;
  config: any;

  constructor(options: TSConfigOptions) {
    this._outDir = options.outDir;
    this._include = options.include ? [options.include] : null;
    this.filePath = resolve(process.cwd(), options.filePath);
    this.isSilenced = options.isSilenced;

    this.load();
  }

  load() {
    if (!existsSync(this.filePath)) {
      if (!this.isSilenced) {
        info('tsconfig.json file is missing, using default settings');
      }

      this.filePath = resolve(__dirname, '..', '..', 'just.tsconfig.json');
    }

    try {
      this.config = readJSONFile(this.filePath);
    } catch {
      error('failed to load the tsconfig.json file');
    }
  }

  private dir(paths: string[] | string, extensions?: string[]) {
    return dirGlob.sync(paths, {
      extensions,
      cwd: process.cwd(),
    });
  }

  get files(): string[] {
    return this.include.flatMap((path: string) => {
      return glob.sync(path, {
        nodir: true,
        ignore: this.exclude,
      });
    });
  }

  get compilerOptions() {
    return this.config.compilerOptions;
  }

  get extensions() {
    const extensions = ['ts', 'tsx', 'd.ts'];

    if (this.allowJS) {
      extensions.concat(['js', 'jsx']);
    }

    if (this.allowJSON) {
      extensions.push('json');
    }

    return extensions;
  }

  get allowJS(): boolean {
    return this.compilerOptions.allowJs;
  }

  get allowJSON(): boolean {
    return this.compilerOptions.resolveJsonModule;
  }

  get sourceMap() {
    if (this.compilerOptions.inlineSourceMap) {
      return 'inline';
    }

    if (this.compilerOptions.sourceMap) {
      return true;
    }

    return false;
  }

  get jsc(): JscConfig {
    return {
      keepClassNames: true,
      baseUrl: this.compilerOptions.baseUrl,
      target: this.compilerOptions.target.toLowerCase(),
      parser: {
        syntax: 'typescript',
        decorators: this.compilerOptions.experimentalDecorators,
        dynamicImport: this.compilerOptions.dynamicImport,
      },
      transform: {
        legacyDecorator: this.compilerOptions.experimentalDecorators,
        decoratorMetadata: this.compilerOptions.emitDecoratorMetadata,
      },
      minify: {
        compress: false,
        mangle: false,
      },
    };
  }

  get inlineSourceMap() {
    return this.sourceMap === 'inline';
  }

  get fileSourceMap() {
    return this.sourceMap && this.sourceMap !== 'inline';
  }

  get hasPaths() {
    return Object.keys(this.compilerOptions.paths ?? {}).length > 0;
  }

  get include(): string[] {
    const paths = this._include ?? this.config.include ?? ['./'];
    return this.dir(paths, this.extensions);
  }

  get exclude(): string[] {
    const paths = this.config.exclude ?? ['node_modules'];
    return this.dir(paths);
  }

  get outDir(): string {
    return this._outDir ?? this.compilerOptions.outDir ?? 'dist';
  }

  get noInterop(): boolean {
    return !(this.compilerOptions.esModuleInterop ?? true);
  }
}
