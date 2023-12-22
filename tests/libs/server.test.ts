import { getOptions, resolveEntryPath, resolvePort } from '../../src/libs/server';
import * as log from '../../src/utils/logger';

describe('server', () => {
  describe('getOptions', () => {
    it('returns the options object for the server', () => {
      const result = getOptions('path/to/config.js');
      expect(result.env.JUST_TSCONFIG).toEqual('path/to/config.js');
    });

    it('returns the options object for the server with the specified port', () => {
      const result = getOptions('path/to/config.js', 8080);
      expect(result.env.PORT).toEqual(8080);
    });

    it('returns the options object for the server with the specified port as a number', () => {
      const result = getOptions('path/to/config.js', '8080');
      expect(result.env.PORT).toEqual(8080);
    });
  });

  describe('resolveEntryPath', () => {
    let cwd: jest.SpyInstance;

    beforeAll(() => {
      cwd = jest
        .spyOn(process, 'cwd')
        .mockReturnValue('/path/to/project');
    });

    afterAll(() => {
      cwd.mockRestore();
    });

    it('returns the resolved entry path when provided', () => {
      const result = resolveEntryPath('path/to/entry.js');
      expect(result).toEqual('/path/to/project/path/to/entry.js');
    });

    it('returns the resolved main entry path from package.json when entry path is not provided', () => {
      process.env.npm_package_main = 'src/index.js';
      const result = resolveEntryPath();
      expect(result).toEqual('/path/to/project/src/index.js');
      delete process.env.npm_package_main;
    });

    it('throws an error when entry path is not provided and JUST_DEBUG environment variable is set', () => {
      process.env.JUST_DEBUG = 'TRUE';

      const error = jest
        .spyOn(log, 'error')
        .mockReturnValueOnce(undefined);

      expect(() => {
        resolveEntryPath();
      }).toThrow('entry path is not provided');

      expect(error).toHaveBeenCalledWith('entry path is not provided');

      delete process.env.JUST_DEBUG;
      error.mockRestore();
    });

    it('returns undefined when entry path is not provided and JUST_DEBUG environment variable is not set', () => {
      delete process.env.JUST_DEBUG;

      const error = jest
        .spyOn(log, 'error')
        .mockReturnValueOnce(undefined);

      const result = resolveEntryPath();
      expect(result).toBeUndefined();
      expect(error).toHaveBeenCalledWith('entry path is not provided');

      error.mockRestore();
    });
  });

  describe('resolvePort', () => {
    it('returns the provided port number when it is specified', async () => {
      const result = await resolvePort('8080');
      expect(result).toEqual(8080);
    });

    it('returns the PORT environment variable when it is set', async () => {
      process.env.PORT = '3000';
      const result = await resolvePort();
      expect(result).toEqual(3000);
      delete process.env.PORT;
    });

    it('returns the port specified in package.json when PORT environment variable is not set', async () => {
      process.env.npm_package_config_port = '4000';
      const result = await resolvePort();
      expect(result).toEqual(4000);
      delete process.env.npm_package_config_port;
    });

    it('returns a random port within the range 3000-3100 when neither port nor PORT environment variable is set', async () => {
      const result = await resolvePort();
      expect(result).toBeGreaterThanOrEqual(3000);
      expect(result).toBeLessThanOrEqual(3100);
    });
  });
});