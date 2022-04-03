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

  start(callback: (...args: any) => Promise<void>) {
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

    return new Promise((resolve, reject) => {
      this.watcher?.on('all', async (...args) => {
        try {
          await callback(...args);
          resolve(null);
        } catch (err) {
          reject(err);
        }
      });

      this.watcher?.on('ready', async () => {
        try {
          await callback();
          resolve(null);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  stop() {
    if (!this.watcher) {
      return;
    }

    this.watcher.close();
  }
}
