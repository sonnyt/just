import ts from 'typescript';
import type { CompilerOptions, Diagnostic } from 'typescript';

import type TSConfig from './tsconfig';

export default class TypeCheck {
  private compilerOptions: any;
  private files: string[];

  constructor(tsconfig: InstanceType<typeof TSConfig>) {
    this.files = tsconfig.files();
    this.compilerOptions = tsconfig.compilerOptions;
  }

  run() {
    const options = this.compileJSON();
    this.diagnostic(options);
  }

  private compileJSON() {
    const { options, errors } = ts.convertCompilerOptionsFromJson(this.compilerOptions, '');

    if (errors.length) {
      throw this.formatError(errors);
    }

    return options;
  }

  private diagnostic(options: CompilerOptions) {
    const program = ts.createProgram(this.files, options);
    const errors = ts.getPreEmitDiagnostics(program);

    if (errors.length) {
      throw this.formatError(errors);
    }
  }

  private formatError(errors: readonly Diagnostic[]) {
    return ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: (fileName: any) => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => ts.sys.newLine,
    });
  }
}
