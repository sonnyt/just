import InternalModule from 'module';

import { EXTENSIONS, compileCode } from './compiler';
import { loadConfig } from './config';
import { findConfigPath } from './../utils/file';

type ModuleType = InternalModule & {
  _extensions: Record<string, (mod: ModuleType, fileName: string) => void>;
  _compile: (code: string, fileName: string) => unknown;
};

const Module = InternalModule as unknown as ModuleType;

export function register(path?: string) {
  const filePath = findConfigPath(path);
  const config = loadConfig(filePath);

  const jsLoader = Module._extensions['.js'];

  EXTENSIONS.forEach((ext) => {
    Module._extensions[ext] = (module: any, fileName: string) => {
      const compile = module._compile;

      module._compile = (jsCode: string) => {
        const { code } = compileCode(jsCode, config.swcOptions);
        return compile.call(module, code, fileName);
      };

      jsLoader(module, fileName);
    };
  });
}

export default register();
