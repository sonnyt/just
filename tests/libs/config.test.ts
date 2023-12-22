import ts from 'typescript';
import path from 'path';
import fs from 'fs';
import { resolveConfigPath, toTsTarget, toModule, formatPaths, convertSWCConfig } from '../../src/libs/config';

describe('Config', () => {
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

  describe('toTsTarget', () => {
    it('should convert the target to a string', () => {
      const target = toTsTarget(ts.ScriptTarget.ES2015);
      expect(target).toBe('es2015');

      const target2 = toTsTarget(ts.ScriptTarget.ES2016);
      expect(target2).toBe('es2016');

      const target3 = toTsTarget(ts.ScriptTarget.ES2017);
      expect(target3).toBe('es2017');
    });
  });

  describe('toModule', () => {
    it('should convert the module to a string', () => {
      const module = toModule(ts.ModuleKind.CommonJS);
      expect(module).toBe('commonjs');

      const module2 = toModule(ts.ModuleKind.ES2015);
      expect(module2).toBe('es6');

      const module3 = toModule(ts.ModuleKind.ES2020);
      expect(module3).toBe('es6');
    });
  });

  describe('formatPaths', () => {
    it('should format the paths correctly', () => {
      const resolve = jest
        .spyOn(path, 'resolve')
        .mockImplementation((...args) => args.join('/'));

      const paths = formatPaths({
        '@/*': ['src/*'],
        'test/*': ['test/*'],
      }, '/path/to/project');

      expect(paths).toEqual({
        '@/*': ['/path/to/project/src/*'],
        'test/*': ['/path/to/project/test/*'],
      });

      resolve.mockRestore();
    });
  });

  describe('convertSWCConfig', () => {
    it('should convert the SWC config correctly', () => {
      const resolve = jest
        .spyOn(path, 'resolve')
        .mockImplementation((...args) => args.join('/'));

      const cwd = jest
        .spyOn(process, 'cwd')
        .mockReturnValue('/path/to/project');

      const options = {
        target: ts.ScriptTarget.ES2018,
        module: ts.ModuleKind.ES2015,
        sourceMap: true,
        inlineSourceMap: true,
        esModuleInterop: true,
        emitDecoratorMetadata: true,
        experimentalDecorators: true,
        strict: true,
        alwaysStrict: true,
        baseUrl: './',
        paths: {
          '@/*': ['src/*'],
          'test/*': ['test/*'],
        },
      };

      const result = convertSWCConfig(options);

      expect(result).toEqual({
        swcrc: false,
        minify: false,
        isModule: true,
        configFile: false,
        cwd: '/path/to/project',
        sourceMaps: 'inline',
        module: {
          noInterop: false,
          type: 'es6',
          strictMode: true,
        },
        jsc: {
          keepClassNames: true,
          externalHelpers: false,
          target: 'es2018',
          baseUrl: './',
          paths: {
            '@/*': ['.//src/*'],
            'test/*': ['.//test/*'],
          },
          parser: {
            tsx: false,
            dynamicImport: true,
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          minify: {
            compress: false,
            mangle: false,
          },
        },
      });

      resolve.mockRestore();
      cwd.mockRestore();
    });
  });

  describe('loadConfig', () => {
    // TODO: Add tests for loadConfig
  });
});
