import glob from 'glob';
import assert from 'assert';
import { join } from 'path';
import { existsSync, lstatSync } from 'fs';

export default class TSConfig {
  private filePath: string;
  config: any;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  load() {
    const filePath = join(process.cwd(), this.filePath);
    const config = require(filePath);

    assert('include' in config, 'TSConfig include property is required');
    assert('outDir' in config?.compilerOptions, 'TSConfig outDir is requred');

    this.config = config;
  }

  files(): string[] {
    return this.config.include.reduce((entries: string[], p: string) => {
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
    }, []);
  }

  get compilerOptions() {
    return this.config.compilerOptions;
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

  get outDir(): string {
    return this.compilerOptions.outDir;
  }

  get paths() {
    return this.compilerOptions.paths ?? {};
  }
}
