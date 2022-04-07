import { FSWatcher, watch } from 'chokidar';
import TSConfig from './tsconfig';

export default class Watcher {
  private ignored: string[];
  private include: string[];
  private watcher: FSWatcher;

  constructor(tsconfig: InstanceType<typeof TSConfig>) {
    this.ignored = tsconfig.exclude;
    this.include = tsconfig.include;

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
  }

  private addMethod(
    types: string[],
    callback: (...args: any) => Promise<void>
  ) {
    return new Promise((resolve, reject) => {
      types.forEach((type) => {
        this.watcher.on(type, async (...args) => {
          try {
            await callback(...args);
            resolve(null);
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  }

  ready(callback: (...args: any) => Promise<void>) {
    return this.addMethod(['ready'], callback);
  }

  change(callback: (...args: any) => Promise<void>) {
    return this.addMethod(['add', 'change'], callback);
  }

  remove(callback: (...args: any) => Promise<void>) {
    return this.addMethod(['unlink'], callback);
  }

  stop() {
    if (!this.watcher) {
      return;
    }

    this.watcher.close();
  }
}
