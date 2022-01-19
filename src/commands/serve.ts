import type { program as Program } from 'commander';
import config from '../utils/config';

export default function(program: typeof Program) {
  program
    .command('serve')
    .description('serve project')
    .option('-p, --port <port>', 'port', '3000')
    .option('-t, --tsconfig <tsconfig>')
    .action((options) => {
      const swcConfig = config(options.tsconfig);
    })
}