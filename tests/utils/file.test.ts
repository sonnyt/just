import dirGlob from 'dir-glob';
import * as glob from 'glob';
import fs from 'fs';

import * as file from '../../src/utils/file';

describe('file', () => {
  let cwd: any;

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

  describe('watchFiles', () => {
    beforeAll(() => {
      jest.mock('chokidar', () => ({
        watch: jest.fn(() => ({
          on: jest.fn(),
          close: jest.fn(),
        })),
      }));
    });

    afterAll(() => {
      jest.unmock('chokidar');
    });

    it('returns a watcher and utility functions', async () => {
      const result = await file.watchFiles(['path/to/files/*'], ['path/to/ignore/*']);

      expect(result).toHaveProperty('watcher');
      expect(result).toHaveProperty('stop');
      expect(result).toHaveProperty('onChange');
    });
  });
});