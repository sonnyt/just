import { watch } from 'chokidar';
import dirGlob from 'dir-glob';
import glob from 'glob';

export function createDirGlob(paths: string | string[], extensions?: string[]) {
  return dirGlob.sync(paths, {
    extensions,
    cwd: process.cwd(),
  });
}

export function createFileGlob(paths: string[] = [], ignore: string[] = []) {
  const options = {
    ignore,
    nodir: true,
    cwd: process.cwd(),
  };

  return paths.flatMap((path) => glob.sync(path, options));
}

export function watchFiles(paths: string[], ignored: string[]) {
  const watcher = watch(paths, {
    ignored,
    persistent: true,
    ignoreInitial: true,
    usePolling: true,
    useFsEvents: true,
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 10,
    },
    cwd: process.cwd(),
  });

  const response = {
    watcher,
    stop: () => watcher.close(),
    onChange(callback: (...args: any) => Promise<void> | void) {
      ['add', 'change'].forEach((type) => watcher.on(type, callback));
    },
    onRemove(callback: (...args: any) => Promise<void> | void) {
      watcher.on('unlink', callback);
    },
  };

  return new Promise<typeof response>((resolve, reject) => {
    watcher.on('ready', () => resolve(response));
    watcher.on('error', (err) => reject(err));
  });
}