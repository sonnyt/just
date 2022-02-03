import { watch } from 'chokidar';

export default function(include: string[], callback: () => void) {
  watch(include, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 150
    },
    cwd: process.cwd(),
  })
  .on('ready', callback)
  .on('all', callback);
}