import InternalModule from 'module';

import TSConfig from './tsconfig';

type ModuleType = InternalModule & {
  _extensions: Record<string, (mod: ModuleType, filename: string) => void>;
  _compile: (code: string, filename: string) => unknown;
};

const Module = InternalModule as unknown as ModuleType;

export class Transpiler {
  private tsconfig: TSConfig;
  private loaders: Record<string,> = {
    '.js': 'js',
    '.jsx': 'jsx',
    '.ts': 'ts',
    '.tsx': 'tsx',
    '.d.ts': 'ts',
    '.json': 'json',
  };

  constructor(tsconfig = 'tsconfig.json') {
    this.tsconfig = new TSConfig({
      filePath: tsconfig,
      isSilenced: !!process.env.JUST_TSCONFIG,
    });
  }

  private transpile(code: string, loader: Loader) {
    return transformSync(code, {
      loader,
      format: 'cjs',
      tsconfigRaw: {
        compilerOptions: this.tsconfig.compilerOptions,
      },
    });
  }

  loader() {
    const jsLoader = Module._extensions['.js'];

    Object.entries(this.loaders).forEach(([extension, loader]) => {
      const defaultLoader = Module._extensions[extension] ?? jsLoader;

      Module._extensions[extension] = (module: any, filename: string) => {
        const compile = module._compile;

        module._compile = (rawCode: string) => {
          const { code } = this.transpile(rawCode, loader);
          return compile.call(module, code, filename);
        };

        defaultLoader(module, filename);
      };
    });
  }
}

const transpiler = new Transpiler(process.env.JUST_TSCONFIG);
export default transpiler.loader();
