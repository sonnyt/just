import { FSWatcher, watch } from 'chokidar';

export default class Watcher {
  private watcher: FSWatcher;

  constructor(include: string[], ignored: string[]) {
    this.watcher = watch(include, {
      ignored,
      persistent: true,
      ignoreInitial: true,
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
    callback: (...args: any) => Promise<void> | void
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

  ready(callback: (...args: any) => Promise<void> | void) {
    return this.addMethod(['ready'], callback);
  }

  change(callback: (...args: any) => Promise<void> | void) {
    return this.addMethod(['add', 'change'], callback);
  }

  remove(callback: (...args: any) => Promise<void> | void) {
    return this.addMethod(['unlink'], callback);
  }

  stop() {
    if (!this.watcher) {
      return;
    }

    this.watcher.close();
  }
}
