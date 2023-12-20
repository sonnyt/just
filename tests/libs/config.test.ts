import process from 'process';
import fs from 'fs';
import * as tsToSwcConfig from 'tsconfig-to-swcconfig';
import { supportedExtensions, parseConfig, resolveConfigPath, loadSWCConfig } from '../../src/libs/config';

describe('Config', () => {
  describe('supportedExtensions', () => {
    it('should return TypeScript extensions', () => {
      const result = supportedExtensions({});
      expect(result).toEqual(['ts', 'tsx']);
    });

    it('should return TypeScript and JavaScript extensions', () => {
      const result = supportedExtensions({ allowJs: true });
      expect(result).toEqual(['ts', 'tsx', 'js', 'jsx']);
    });

    it('should return TypeScript and JSON extensions', () => {
      const result = supportedExtensions({ resolveJsonModule: true });
      expect(result).toEqual(['ts', 'tsx', 'json']);
    });

    it('should return TypeScript, JavaScript and JSON extensions', () => {
      const result = supportedExtensions({ allowJs: true, resolveJsonModule: true });
      expect(result).toEqual(['ts', 'tsx', 'js', 'jsx', 'json']);
    });
  });

  describe('parseConfig', () => {
    it('should parse extensions correctly', () => {
      const result = parseConfig({ compilerOptions: {} });
      expect(result.extensions).toEqual(['ts', 'tsx']);
    });

    it('should parse outDir correctly', () => {
      const result = parseConfig({ compilerOptions: { outDir: 'build' } });
      expect(result.outDir).toEqual('build');
    });

    it('should parse default outDir correctly', () => {
      const result = parseConfig({ compilerOptions: {} });
      expect(result.outDir).toEqual('dist');
    });

    it('should parse include correctly', () => {
      const result = parseConfig({ include: ['src/**/*.ts'] });
      expect(result.include).toEqual(['src/**/*.ts']);
    });

    it('should parse default include correctly', () => {
      const result = parseConfig({});
      expect(result.include).toEqual(['**/*.{ts,tsx}']);
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
    it('should load the SWC config correctly', () => {
      const convertTsConfig = jest
        .spyOn(tsToSwcConfig, 'convertTsConfig')
        .mockReturnValue({});

      const cwd = jest
        .spyOn(process, 'cwd')
        .mockReturnValue('/path/to/project');

      const result = loadSWCConfig({});

      expect(result).toEqual({
        cwd: '/path/to/project',
        configFile: false,
        swcrc: false,
      });

      convertTsConfig.mockRestore();
      cwd.mockRestore();
    });

    it('should load the SWC config correctly with baseUrl', () => {
      const convertTsConfig = jest
        .spyOn(tsToSwcConfig, 'convertTsConfig')
        .mockReturnValue({ jsc: { baseUrl: 'src' } });

      const cwd = jest
        .spyOn(process, 'cwd')
        .mockReturnValue('/path/to/project');

      const result = loadSWCConfig({});

      expect(result.jsc).toEqual({
        baseUrl: '/path/to/project/src'
      });

      convertTsConfig.mockRestore();
      cwd.mockRestore();
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

      const cwd = jest
        .spyOn(process, 'cwd')
        .mockReturnValue('/path/to/project');

      const result = loadSWCConfig({});

      expect(result.jsc).toEqual({
        paths: {
          '@/*': ['/path/to/project/src/*']
        }
      });

      convertTsConfig.mockRestore();
      cwd.mockRestore();
    });
  });

  describe('loadConfig', () => {
    // TODO: Add tests for loadConfig
  });
});