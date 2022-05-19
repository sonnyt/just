import InternalModule from 'module';
import { findConfigPath } from 'utils/file';
import Builder, { EXTENSIONS } from './builder';

import TSConfig from './tsconfig';

type ModuleType = InternalModule & {
  _extensions: Record<string, (mod: ModuleType, filename: string) => void>;
  _compile: (code: string, filename: string) => unknown;
};

const Module = InternalModule as unknown as ModuleType;

export class Transpiler {
  private builder: Builder;

  constructor() {
    const filePath = findConfigPath(process.env.JUST_TSCONFIG as string);
    const tsconfig = new TSConfig({ filePath });
    this.builder = new Builder(tsconfig);
  }

  private transpile(code: string) {
    const response = this.builder.transformCode(code);
    return response.code;
  }

  loader() {
    const jsLoader = Module._extensions['.js'];

    EXTENSIONS.forEach((ext) => {
      Module._extensions[ext] = (module: any, filename: string) => {
        const compile = module._compile;

        module._compile = (jsCode: string) => {
          const code = this.transpile(jsCode);
          return compile.call(module, code, filename);
        };

        jsLoader(module, filename);
      };
    });
  }
}

const transpiler = new Transpiler();
export default transpiler.loader();
