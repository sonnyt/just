import type { program as Program } from 'commander';
import nodemon from 'nodemon';
import { build } from 'esbuild';
import tsconfig from '../utils/tsconfig';

function action(entry: string, options: any) {
  const config = tsconfig(options.tsconfig);

  const server = nodemon({
    cwd: process.cwd(),
    colours: true,
    exec: `node ${entry}`,
    watch: config.dest,
    ignore: config.exclude
  });

  try {
    build({
      format: 'cjs',
      platform: 'node',
      entryPoints: config.include,
      absWorkingDir: process.cwd(),
      outdir: config.dest,
      watch: {
        onRebuild(error) {
          if (!error) {
            console.log('[Just] Build succeeded');
            server.restart();
          }
        },
      }
    });
  } catch {}
}

export default function(program: typeof Program) {
  program
    .command('serve')
    .description('serve project')
    .argument('entry', 'Server entry file')
    .option('-t, --tsconfig <tsconfig>', 'typescript configuration file', 'tsconfig.json')
    .action(action);
}