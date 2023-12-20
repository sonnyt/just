import InternalModule from 'module';

import { loadConfig, resolveConfigPath } from './config';
import { compileCode, DEFAULT_EXTENSIONS } from './swc';

type ModuleType = InternalModule & {
  _extensions: Record<string, (mod: ModuleType, fileName: string) => void>;
  _compile: (code: string, fileName: string) => unknown;
};

const Module = InternalModule as unknown as ModuleType;

export function register() {
  const filePath = resolveConfigPath();
  const config = loadConfig(filePath);

  const jsLoader = Module._extensions['.js'];

  DEFAULT_EXTENSIONS.forEach((ext) => {
    Module._extensions[ext] = (module: any, fileName: string) => {
      const compile = module._compile;

      module._compile = (jsCode: string) => {
        const { code } = compileCode(jsCode, fileName, config.swc);
        return compile.call(module, code, fileName);
      };

      jsLoader(module, fileName);
    };
  });
}

export default register();
