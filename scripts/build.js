const glob = require('glob');

require('esbuild')
  .build({
    format: 'cjs',
    entryPoints: glob.sync('./src/**/*.ts'),
    absWorkingDir: process.cwd(),
    platform: 'node',
    outdir: 'dist',
  })
  .catch(() => process.exit(1));
