import glob from 'glob';
import dirGlob from 'dir-glob';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import stripJsonComments from 'strip-json-comments';

import { error, info } from './logger';

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
      const file = readFileSync(this.filePath, 'utf-8');
      const config = stripJsonComments(file.toString());
      this.config = JSON.parse(config);
    } catch {
      error('failed to load the tsconfig.json file');
    }
  }

  private dir(paths: string[] | string) {
    return dirGlob.sync(paths, {
      extensions: this.extensions,
      cwd: process.cwd(),
      files: ['*'],
    });
  }

  get files(): string[] {
    return this.include.flatMap((path: string) =>
      glob.sync(path, { ignore: this.exclude })
    );
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

  get include(): string[] {
    const paths = this._include ?? this.config.include ?? ['./'];
    return this.dir(paths);
  }

  get exclude(): string[] {
    const paths = this.config.exclude ?? ['node_modules'];
    return this.dir(paths);
  }

  get outDir(): string {
    return this._outDir ?? this.compilerOptions.outDir;
  }

  get hasPaths() {
    return Object.keys(this.compilerOptions.paths ?? {}).length > 0;
  }
}
