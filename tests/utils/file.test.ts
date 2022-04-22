import colors from 'colors/safe';
import fs from 'fs';
import * as file from '../../src/utils/file';
import { getError, NoErrorThrownError } from '../helpers';

describe('file', () => {
  beforeEach(() => {
    colors.disable();
  });

  describe('reads JSON file', () => {
    it('fails', async () => {
      const mockFile = 'no_file.json';
      const existsMock = jest.spyOn(fs, 'existsSync').mockImplementation();

      const error = await getError(() => file.readJSONFile(mockFile));

      expect(existsMock).toBeCalledWith(mockFile);
      expect(error).not.toBeInstanceOf(NoErrorThrownError);
      expect(error.message).toBe('no_file.json not found');

      existsMock.mockRestore();
    });

    it('loads file', () => {
      const mockFile = 'file.json';
      const mockData = { data: 'test' };

      const existsMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const readFileMock = jest.spyOn(fs, 'readFileSync').mockImplementation(
        () =>
          ({
            toString: () => JSON.stringify(mockData),
          } as any)
      );

      const content = file.readJSONFile('file.json');

      expect(existsMock).toBeCalledWith(mockFile);
      expect(readFileMock).toBeCalledWith(mockFile, 'utf-8');
      expect(content).toStrictEqual(mockData);

      existsMock.mockRestore();
      readFileMock.mockRestore();
    });
  });
});
