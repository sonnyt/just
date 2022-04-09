import InternalModule from 'module';
import Builder from './builder';

import TSConfig from './tsconfig';

type ModuleType = InternalModule & {
  _extensions: Record<string, (mod: ModuleType, filename: string) => void>;
  _compile: (code: string, filename: string) => unknown;
};

const Module = InternalModule as unknown as ModuleType;

export class Transpiler {
  private builder: Builder;

  constructor(tsconfigPath = 'tsconfig.json') {
    const tsconfig = new TSConfig({
      filePath: tsconfigPath,
      isSilenced: !!process.env.JUST_TSCONFIG,
    });

    this.builder = new Builder(tsconfig);
  }

  private transpile(code: string) {
    const response = this.builder.transformCode(code);
    return response.code;
  }

  loader() {
    const jsLoader = Module._extensions['.js'];

    Module._extensions['.ts'] = (module: any, filename: string) => {
      const compile = module._compile;

      module._compile = (jsCode: string) => {
        const code = this.transpile(jsCode);
        return compile.call(module, code, filename);
      };

      jsLoader(module, filename);
    };
  }
}

const transpiler = new Transpiler(process.env.JUST_TSCONFIG);
export default transpiler.loader();
