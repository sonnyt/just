import glob from 'glob';
import dirGlob from 'dir-glob';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';
import stripJsonComments from 'strip-json-comments';

import { error, warning } from './logger';

export default class TSConfig {
  private _outDir?: string;
  private _include: string[] | null;
  private isSilenced: boolean;

  filePath: string;
  config: any;

  constructor(
    filePath: string,
    silence: boolean = false,
    include?: string,
    outDir?: string
  ) {
    this._outDir = outDir;
    this._include = include ? [include] : null;
    this.filePath = resolve(process.cwd(), filePath);
    this.isSilenced = silence;

    this.load();
  }

  load() {
    if (!existsSync(this.filePath)) {
      if (!this.isSilenced) {
        warning('tsconfig.json file is missing, using default settings');
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
