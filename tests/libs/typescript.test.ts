import ts from 'typescript';

import { loadTSConfig, checkFiles } from '../../src/libs/typescript';
import * as log from '../../src/utils/logger';

jest.mock('typescript', () => ({
  readConfigFile: jest.fn(),
  parseJsonConfigFileContent: jest.fn(),
  createProgram: jest.fn(),
  getPreEmitDiagnostics: jest.fn(),
  formatDiagnosticsWithColorAndContext: jest.fn(),
  sys: {
    readFile: jest.fn(),
  },
}));

describe('typescript', () => {
  describe('loadTSConfig', () => {
    it('should load the TypeScript configuration from the specified path', () => {
      (ts.readConfigFile as jest.Mock).mockReturnValueOnce({ config: {}, error: undefined });
      (ts.parseJsonConfigFileContent as jest.Mock).mockReturnValueOnce({ options: {}, fileNames: [], errors: [] });
      const result = loadTSConfig('tsconfig.json');

      expect(ts.readConfigFile).toHaveBeenCalledWith('tsconfig.json', expect.any(Function));
      expect(ts.parseJsonConfigFileContent).toHaveBeenCalledWith({}, expect.anything(), expect.any(String));
      expect(result).toEqual({
        config: {},
        fileNames: [],
        compilerOptions: {
          importHelpers: false,
          files: [],
        }
      });
    });

    it('should throw an error if the configuration file contains errors', () => {
      process.env.JUST_DEBUG = 'TRUE';

      const error = jest
        .spyOn(log, 'error')
        .mockReturnValueOnce(undefined);

      (ts.readConfigFile as jest.Mock).mockReturnValueOnce({ config: {}, error: undefined });
      (ts.parseJsonConfigFileContent as jest.Mock).mockReturnValueOnce({ options: {}, fileNames: [], errors: ['error'] });

      expect(() => loadTSConfig('tsconfig.json')).toThrow('error');
      expect(error).toHaveBeenCalledWith('failed to load tsconfig.json');

      delete process.env.JUST_DEBUG;
      error.mockRestore();
    });
  });

  describe('checkFiles', () => {
    it('should return false if there are no errors', () => {
      (ts.getPreEmitDiagnostics as jest.Mock).mockReturnValueOnce([]);

      expect(checkFiles()).toBe(false);
      expect(ts.createProgram).toHaveBeenCalledWith([], {});
      expect(ts.getPreEmitDiagnostics).toHaveBeenCalled();
    });

    it('should return true if there are errors', () => {
      const error = jest
        .spyOn(log, 'error')
        .mockReturnValueOnce(undefined);

      (ts.getPreEmitDiagnostics as jest.Mock).mockReturnValueOnce(['error']);
      (ts.formatDiagnosticsWithColorAndContext as jest.Mock).mockReturnValueOnce('error');

      expect(checkFiles()).toBe(true);
      expect(ts.createProgram).toHaveBeenCalledWith([], {});
      expect(ts.getPreEmitDiagnostics).toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith('type error \n\nerror');

      error.mockRestore();
    });
  });
});