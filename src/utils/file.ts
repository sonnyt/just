import { watch } from 'chokidar';
import dirGlob from 'dir-glob';
import { IgnoreLike, globSync } from 'glob';
import { dirname, extname } from 'path';
import { promises as fs } from "fs";

/**
 * Checks if the given path represents a file.
 * @param path - The path to check.
 * @returns True if the path represents a file, false otherwise.
 */
export function isFile(path: string) {
  return extname(path) !== '';
}

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
export function createFileGlob(paths: string[] = [], ignore: string | string[] | IgnoreLike = []) {
  const options = {
    ignore,
    dot: false,
    nodir: true,
    cwd: process.cwd(),
  };

  return paths.flatMap((path) => globSync(path, options));
}

/**
 * Copies a file to the specified output path.
 * @param fileName - The name of the file to be copied.
 * @param outputPath - The path where the file should be copied to.
 * @returns A promise that resolves when the file is successfully copied.
 */
export async function copyFile(fileName: string, outputPath: string) {
  const dirName = dirname(outputPath);
  await fs.mkdir(dirName, { recursive: true });
  return fs.copyFile(fileName, outputPath);
}

/**
 * Creates a debounced version of a function.
 * @param fn The function to debounce.
 * @param timeout The debounce timeout in milliseconds. Default is 500ms.
 * @returns The debounced function.
 */
export function debounce(fn: Function, timeout = 500) {
  let timer: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(null, args), timeout);
  };
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
      ['add', 'change'].forEach((type) => watcher.on(type, debounce(callback)));
    },
    onRemove(callback: (...args: any) => Promise<void> | void) {
      watcher.on('unlink', debounce(callback));
    },
  };

  return new Promise<typeof response>((resolve, reject) => {
    watcher.on('ready', () => resolve(response));
    watcher.on('error', (err) => reject(err));
  });
}