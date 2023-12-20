import process from 'process';
import fs from 'fs';
import * as tsToSwcConfig from 'tsconfig-to-swcconfig';
import { parseConfig, resolveConfigPath, loadSWCConfig } from '../../src/libs/config';

describe('Config', () => {
  describe('parseConfig', () => {
    it('should parse outDir correctly', () => {
      const result = parseConfig({ compilerOptions: { outDir: 'build' } });
      expect(result.outDir).toEqual('build');
    });

    it('should parse default outDir correctly', () => {
      const result = parseConfig({ compilerOptions: {} });
      expect(result.outDir).toEqual('dist');
    });

    it('should parse include correctly', () => {
      const result = parseConfig({ include: ['src'] });
      expect(result.include).toEqual(['src/**']);
    });

    it('should parse default include correctly', () => {
      const result = parseConfig({});
      expect(result.include).toEqual(['**']);
    });

    it('should parse exclude correctly', () => {
      const result = parseConfig({ exclude: ['tests/**'] });
      expect(result.exclude).toEqual(['tests/**']);
    });

    it('should parse default exclude correctly', () => {
      const result = parseConfig({});
      expect(result.exclude).toEqual(['node_modules/**']);
    });
  });

  describe('resolveConfigPath', () => {
    it('should resolve the config path correctly', () => {
      const path = resolveConfigPath('/path/to/config/tsjson');
      expect(path).toBe('/path/to/config/tsjson');
    });

    it('should resolve the config path from the environment variable', () => {
      process.env.JUST_TSCONFIG = '/path/to/config/tsjson';

      const path = resolveConfigPath();
      expect(path).toBe('/path/to/config/tsjson');
      delete process.env.JUST_TSCONFIG;
    });

    it('should resolve the root tsconfig.json path', () => {
      const existsSync = jest
        .spyOn(fs, 'existsSync')
        .mockReturnValueOnce(true);

      const path = resolveConfigPath();
      expect(path).toBe('tsconfig.json');

      existsSync.mockRestore();
    });

    it('should resolve the root jsconfig.json path', () => {
      const existsSync = jest
        .spyOn(fs, 'existsSync')
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const path = resolveConfigPath();
      expect(path).toBe('jsconfig.json');

      existsSync.mockRestore();
    });

    it('should resolve the default config file path', () => {
      const existsSync = jest
        .spyOn(fs, 'existsSync')
        .mockReturnValue(false);

      const path = resolveConfigPath();
      expect(path).toContain('just.tsconfig.json');

      existsSync.mockRestore();
    });
  });

  describe('loadSWCConfig', () => {
    let cwd: any;

    beforeAll(() => {
      cwd = jest
        .spyOn(process, 'cwd')
        .mockReturnValue('/path/to/project');
    });

    afterAll(() => {
      cwd.mockRestore();
    });

    it('should load the SWC config correctly', () => {
      const convertTsConfig = jest
        .spyOn(tsToSwcConfig, 'convertTsConfig')
        .mockReturnValue({});

      const result = loadSWCConfig({});

      expect(result).toEqual({
        cwd: '/path/to/project',
        configFile: false,
        swcrc: false,
      });

      convertTsConfig.mockRestore();
    });

    it('should load the SWC config correctly with baseUrl', () => {
      const convertTsConfig = jest
        .spyOn(tsToSwcConfig, 'convertTsConfig')
        .mockReturnValue({ jsc: { baseUrl: 'src' } });

      const result = loadSWCConfig({});

      expect(result.jsc).toEqual({
        baseUrl: '/path/to/project/src'
      });

      convertTsConfig.mockRestore();
    });

    it('should load the SWC config correctly with paths', () => {
      const convertTsConfig = jest
        .spyOn(tsToSwcConfig, 'convertTsConfig')
        .mockReturnValue({
          jsc: {
            paths: {
              '@/*': ['src/*']
            }
          }
        });

      const result = loadSWCConfig({});

      expect(result.jsc).toEqual({
        paths: {
          '@/*': ['/path/to/project/src/*']
        }
      });

      convertTsConfig.mockRestore();
    });
  });

  describe('loadConfig', () => {
    // TODO: Add tests for loadConfig
  });
});
