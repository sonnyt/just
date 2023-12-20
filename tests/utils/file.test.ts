import colors from 'colors/safe';
import dirGlob from 'dir-glob';

import * as file from '../../src/utils/file';

describe('file', () => {
  beforeEach(() => {
    colors.disable();
  });

  describe('createDirGlob', () => {
    it('returns an array of matching file paths', () => {
      const mockPaths = ['path/to/files/*.txt', 'path/to/files/*.md'];
      const mockExtensions = ['txt', 'md'];
      const mockGlobResult = ['path/to/files/file1.txt', 'path/to/files/file2.md'];

      const dirGlobMock = jest.spyOn(dirGlob, 'sync').mockReturnValue(mockGlobResult);

      const result = file.createDirGlob(mockPaths, mockExtensions);

      expect(dirGlobMock).toHaveBeenCalledWith(mockPaths, {
        extensions: mockExtensions,
        cwd: process.cwd(),
      });
      expect(result).toEqual(mockGlobResult);

      dirGlobMock.mockRestore();
    });

    it('returns an empty array when no matching file paths are found', () => {
      const mockPaths = 'path/to/files/*.txt';
      const mockExtensions = ['txt'];
      const mockGlobResult: string[] = [];

      const dirGlobMock = jest.spyOn(dirGlob, 'sync').mockReturnValue(mockGlobResult);

      const result = file.createDirGlob(mockPaths, mockExtensions);

      expect(dirGlobMock).toHaveBeenCalledWith(mockPaths, {
        extensions: mockExtensions,
        cwd: process.cwd(),
      });

      expect(result).toEqual(mockGlobResult);

      dirGlobMock.mockRestore();
    });
  });
});