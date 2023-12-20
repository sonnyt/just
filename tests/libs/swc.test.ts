import fs from 'fs';
import process from 'process';

import { isCompilable, resolveSourcePaths, resolveOutPath, resolveSourceFilePath, writeOutputFile, cleanOutDir, copyStaticFile, copyStaticFiles } from '../../src/libs/swc';
import * as file from '../../src/utils/file';

describe('swc', () => {
  describe('isCompilable', () => {
    it('returns true for a compilable file', () => {
      const result = isCompilable('path/to/file.ts');
      expect(result).toBe(true);
    });

    it('returns false for a non-compilable file', () => {
      const result = isCompilable('path/to/file.json');
      expect(result).toBe(false);
    });
  });

  describe('resolveSourcePaths', () => {
    it('returns an object containing all the resolved paths, paths to be copied, and paths to be compiled', () => {
      const createFileGlob = jest.spyOn(file, 'createFileGlob').mockReturnValue([
        'path/to/files/file1.ts',
        'path/to/files/file2.json',
      ]);

      const result = resolveSourcePaths([
        'path/to/files/*',
        'path/to/files/*',
      ]);

      expect(result).toEqual({
        copy: [
          'path/to/files/file2.json',
        ],
        compile: [
          'path/to/files/file1.ts',
        ],
      });

      createFileGlob.mockRestore();
    });
  });

  describe('resolveOutPath', () => {
    it('returns the resolved output path', () => {
      const result = resolveOutPath('path/to/output.ts', 'path/to/dist');
      expect(result).toEqual('path/to/dist/to/output.ts');
    });

    it('returns the resolved output path with the specified extension', () => {
      const result = resolveOutPath('path/to/output.ts', 'path/to/dist', 'js');
      expect(result).toEqual('path/to/dist/to/output.js');
    });

    it('returns the resolved output path when the output directory is the current directory', () => {
      const result = resolveOutPath('path/to/output.ts', '.');
      expect(result).toEqual('to/output.ts');
    });

    it('returns the resolved output path when the output directory is the parent directory', () => {
      const result = resolveOutPath('path/to/output.ts', '..');
      expect(result).toEqual('../to/output.ts');
    });
  });

  describe('resolveSourceFilePath', () => {
    it('returns the resolved source file path', () => {
      const result = resolveSourceFilePath('path/to/output.ts', 'path/to/output.ts');
      expect(result).toEqual('output.ts');
    });
  });

  describe('writeOutputFile', () => {
    it('writes the content to the output file', async () => {
      const mkdir = jest
        .spyOn(fs.promises, 'mkdir')
        .mockResolvedValue(undefined);

      const writeFile = jest
        .spyOn(fs.promises, 'writeFile')
        .mockResolvedValue(undefined);

      await writeOutputFile('path/to/output.ts', 'console.log("Hello World!")');

      expect(mkdir).toHaveBeenCalledWith('path/to', {
        recursive: true,
      });

      expect(writeFile).toHaveBeenCalledWith('path/to/output.ts', 'console.log("Hello World!")');

      mkdir.mockRestore();
      writeFile.mockRestore();
    });

    it('writes the content and source map to the output file', async () => {
      const mkdir = jest
        .spyOn(fs.promises, 'mkdir')
        .mockResolvedValue(undefined);

      const writeFile = jest
        .spyOn(fs.promises, 'writeFile')
        .mockResolvedValue(undefined);

      await writeOutputFile('path/to/output.js', 'console.log("Hello World!")', '{"version":3,"file":"output.js","sourceRoot":"","sources":["output.ts"],"names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC"}');

      expect(mkdir).toHaveBeenCalledWith('path/to', {
        recursive: true,
      });

      expect(writeFile).toHaveBeenNthCalledWith(1, 'path/to/output.js.map', '{"version":3,"file":"output.js","sourceRoot":"","sources":["output.ts"],"names":[],"mappings":"AAAA,IAAI,CAAC,GAAG,CAAC,CAAC,CAAC,CAAC"}');
      expect(writeFile).toHaveBeenNthCalledWith(2, 'path/to/output.js', 'console.log("Hello World!")\n//# sourceMappingURL=output.js.map');

      mkdir.mockRestore();
      writeFile.mockRestore();
    });
  });

  describe('cleanOutDir', () => {
    it('removes the output directory', async () => {
      const cwd = jest
        .spyOn(process, 'cwd')
        .mockReturnValue('/path/to/project');

      const existsSync = jest
        .spyOn(fs, 'existsSync')
        .mockReturnValue(true);

      const rm = jest
        .spyOn(fs.promises, 'rm')
        .mockResolvedValue(undefined);

      await cleanOutDir('path/to/dist');

      expect(rm).toHaveBeenCalledWith('/path/to/project/path/to/dist', {
        force: true,
        recursive: true,
      });

      cwd.mockRestore();
      rm.mockRestore();
      existsSync.mockRestore();
    });

    it('does not remove the output directory when it does not exist', async () => {
      const cwd = jest
        .spyOn(process, 'cwd')
        .mockReturnValue('/path/to/project');

      const existsSync = jest
        .spyOn(fs, 'existsSync')
        .mockReturnValue(false);

      const rm = jest
        .spyOn(fs.promises, 'rm')
        .mockResolvedValue(undefined);

      await cleanOutDir('path/to/dist');

      expect(rm).not.toHaveBeenCalled();

      cwd.mockRestore();
      rm.mockRestore();
      existsSync.mockRestore();
    });
  });

  describe('copyStaticFile', () => {
    it('copies the file to the specified output directory', async () => {
      const copyFile = jest
        .spyOn(file, 'copyFile')
        .mockResolvedValue(undefined);

      await copyStaticFile('path/to/file.json', 'path/to/dist');

      expect(copyFile).toHaveBeenCalledWith('path/to/file.json', 'path/to/dist/to/file.json');

      copyFile.mockRestore();
    });
  });

  describe('copyStaticFiles', () => {
    it('copies the files to the specified output directory', async () => {
      const copyFile = jest
        .spyOn(file, 'copyFile')
        .mockResolvedValue(undefined);

      await copyStaticFiles([
        'path/to/file1.json',
        'path/to/file2.json',
      ], 'path/to/dist');

      expect(copyFile).toHaveBeenCalledWith('path/to/file1.json', 'path/to/dist/to/file1.json');
      expect(copyFile).toHaveBeenCalledWith('path/to/file2.json', 'path/to/dist/to/file2.json');

      copyFile.mockRestore();
    });
  });
});