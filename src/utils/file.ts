import { watch } from 'chokidar';
import dirGlob from 'dir-glob';
import glob from 'glob';

/**
 * Creates a directory glob pattern and returns matching file paths.
 * @param paths - The path or paths to search for files.
 * @param extensions - Optional array of file extensions to filter the search.
 * @returns An array of file paths that match the directory glob pattern.
 */
export function createDirGlob(paths: string | string[], extensions?: string[]) {
  return dirGlob.sync(paths, {
    extensions,
    cwd: process.cwd(),
  });
}

/**
 * Creates a file glob by matching the specified paths against the file system.
 * 
 * @param paths - An array of paths to match against the file system.
 * @param ignore - An array of patterns to ignore during the matching process.
 * @returns An array of matched file paths.
 */
export function createFileGlob(paths: string[] = [], ignore: string[] = []) {
  const options = {
    ignore,
    nodir: true,
    cwd: process.cwd(),
  };

  return paths.flatMap((path) => glob.sync(path, options));
}

/**
 * Watches the specified files and directories for changes.
 * 
 * @param paths - An array of file or directory paths to watch.
 * @param ignored - An array of file or directory paths to ignore.
 * @returns A promise that resolves to an object containing the watcher and utility functions.
 */
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