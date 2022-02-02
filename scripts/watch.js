const glob = require('glob');

require('esbuild').build({
  format: 'cjs',
  entryPoints: glob.sync('./src/**/*.ts'),
  absWorkingDir: process.cwd(),
  platform: 'node',
  outdir: 'dist',
  watch: {
    onRebuild(error) {
      if (!error) {
        console.log('watch build succeeded');
      }
    },
  },
}).catch(() => process.exit(1))