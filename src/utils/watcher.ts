import { FSWatcher, watch } from 'chokidar';
import TSConfig from './tsconfig';

export default class Watcher {
  private ignored: string[];
  private include: string[];
  private watcher?: FSWatcher;

  constructor(tsconfig: InstanceType<typeof TSConfig>) {
    this.ignored = tsconfig.exclude;
    this.include = tsconfig.include;
  }

  start(callback: () => void) {
    this.watcher = watch(this.include, {
      persistent: true,
      ignoreInitial: true,
      ignored: this.ignored,
      usePolling: true,
      useFsEvents: true,
      awaitWriteFinish: {
        stabilityThreshold: 150,
      },
      cwd: process.cwd(),
    });

    this.watcher.on('all', callback);
    this.watcher.on('ready', callback);
  }

  stop() {
    if (!this.watcher) {
      return;
    }

    this.watcher.close();
  }
}
