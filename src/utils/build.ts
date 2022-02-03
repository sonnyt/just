import { build } from 'esbuild';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

import type TSConfig from './tsconfig';

export default class Build {
  private tsconfig: InstanceType<typeof TSConfig>;

  constructor(tsconfig: InstanceType<typeof TSConfig>) {
    this.tsconfig = tsconfig;
  }

  private clean() {
    const path = join(process.cwd(), this.tsconfig.outDir);

    if (!existsSync(path)) {
      return;
    }

    return rmSync(path, { recursive: true, force: true });
  }

  private build() {
    build({
      format: 'cjs',
      platform: 'node',
      absWorkingDir: process.cwd(),
      entryPoints: this.tsconfig.files(),
      sourcemap: this.tsconfig.sourceMap,
      outdir: this.tsconfig.outDir,
    });
  }

  run() {
    try {
      console.time('[Just] Build');

      this.clean();
      this.build();

      console.timeLog('[Just] Build', 'success');
    } finally {
      console.timeEnd('[Just] Build');
    }
  }
}
