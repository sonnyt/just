import dirGlob from 'dir-glob';
import * as glob from 'glob';
import fs from 'fs';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';

import * as file from '../../src/utils/file';

describe('file', () => {
  let cwd: jest.SpyInstance;

  beforeEach(() => {
    cwd = jest
      .spyOn(process, 'cwd')
      .mockReturnValue('/path/to/project');
  });

  afterEach(() => {
    cwd.mockRestore();
  });

  describe('createDirGlob', () => {
    it('returns an array of matching files without extensions', () => {
      const sync = jest
        .spyOn(dirGlob, 'sync')
        .mockReturnValue([
          'path/to/files/file1',
          'path/to/files/file2',
        ]);

      const result = file.createDirGlob('path/to/files/*');

      expect(sync).toHaveBeenCalledWith('path/to/files/*', {
        extensions: undefined,
        cwd: '/path/to/project',
      });

      expect(result).toEqual([
        'path/to/files/file1',
        'path/to/files/file2',
      ]);

      sync.mockRestore();
    });

    it('returns an array of matching files with extensions', () => {
      const sync = jest
        .spyOn(dirGlob, 'sync')
        .mockReturnValue([
          'path/to/files/*.ts',
          'path/to/files/*.tsx',
        ]);

      const result = file.createDirGlob('path/to/files/*');

      expect(sync).toHaveBeenCalledWith('path/to/files/*', {
        cwd: '/path/to/project',
      });

      expect(result).toEqual([
        'path/to/files/*.ts',
        'path/to/files/*.tsx',
      ]);

      sync.mockRestore();
    });
  });

  describe('createFileGlob', () => {
    it('returns an array of matching files', () => {
      const globSync = jest
        .spyOn(glob, 'globSync')
        .mockReturnValue([
          'path/to/files/*.ts',
          'path/to/files/*.tsx',
        ]);

      const result = file.createFileGlob(['path/to/files/*'], ['path/to/ignore/*']);

      expect(globSync).toHaveBeenCalledWith('path/to/files/*', {
        ignore: ['path/to/ignore/*'],
        nodir: true,
        dot: false,
        cwd: '/path/to/project',
      });

      expect(result).toEqual([
        'path/to/files/*.ts',
        'path/to/files/*.tsx',
      ]);

      globSync.mockRestore();
    });
  });

  describe('copyFile', () => {
    it('copies the file to the output path', async () => {
      const mkdir = jest
        .spyOn(fs.promises, 'mkdir')
        .mockResolvedValue(undefined);

      const copyFile = jest
        .spyOn(fs.promises, 'copyFile')
        .mockResolvedValue(undefined);

      await file.copyFile('path/to/file', 'path/to/output');

      expect(mkdir).toHaveBeenCalledWith('path/to', { recursive: true });
      expect(copyFile).toHaveBeenCalledWith('path/to/file', 'path/to/output');

      mkdir.mockRestore();
      copyFile.mockRestore();
    });
  });

  describe('debounce', () => {
    it('returns a function that debounces the callback', () => {
      jest.useFakeTimers();

      const callback = jest.fn();
      const debounced = file.debounce(callback, 100);

      debounced();
      debounced();
      debounced();

      jest.runAllTimers();

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('watchFiles', () => {
    let watch: jest.SpyInstance;
    const emitter = new EventEmitter();
    jest.useFakeTimers();

    beforeAll(() => {
      watch = jest
        .spyOn(chokidar, 'watch')
        .mockImplementation(() => {
          (emitter as any).close = jest.fn();
          return emitter as any;
        });
    });

    afterAll(() => {
      watch.mockRestore();
      emitter.removeAllListeners();
    });

    it('returns a watcher and utility functions', async () => {
      const watchFiles = file.watchFiles(['path/to/files/*'], ['path/to/ignore/*']);

      emitter.emit('ready');

      const result = await watchFiles;

      expect(result).toHaveProperty('watcher');
      expect(result).toHaveProperty('stop');
      expect(result).toHaveProperty('onChange');
    });

    it('stops the watcher', async () => {
      const watchFiles = file.watchFiles(['path/to/files/*'], ['path/to/ignore/*']);

      emitter.emit('ready');

      const result = await watchFiles;

      result.stop();

      expect((emitter as any).close).toHaveBeenCalled();
    });

    it('calls the onChange callback when a file is added or changed', async () => {
      const watchFiles = file.watchFiles(['path/to/files/*'], ['path/to/ignore/*']);

      emitter.emit('ready');

      const result = await watchFiles;

      const onChange = jest.fn();
      result.onChange(onChange);

      emitter.emit('add', 'path/to/file');
      emitter.emit('change', 'path/to/file');
      jest.runAllTimers();

      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('calls the onRemove callback when a file is removed', async () => {
      const watchFiles = file.watchFiles(['path/to/files/*'], ['path/to/ignore/*']);

      emitter.emit('ready');

      const result = await watchFiles;

      const onRemove = jest.fn();
      result.onRemove(onRemove);

      emitter.emit('unlink', 'path/to/file');
      jest.runAllTimers();

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('rejects the promise if the watcher emits an error', async () => {
      const watchFiles = file.watchFiles(['path/to/files/*'], ['path/to/ignore/*']);

      const error = new Error('Watcher error');
      emitter.emit('error', error);

      await expect(watchFiles).rejects.toThrow(error);
    });
  });
});