import ts from 'typescript';
import type { CompilerOptions, Diagnostic } from 'typescript';

import type TSConfig from './tsconfig';
import { error, timer } from './logger';

export default class TypeChecker {
  private compilerOptions: any;
  private files: string[];

  isFailed = false;

  constructor(tsconfig: TSConfig) {
    this.files = tsconfig.files;
    this.compilerOptions = tsconfig.compilerOptions;
  }

  start() {
    try {
      const time = timer();
      time.start('type checking...');

      this.isFailed = false;
      const options = this.compileJSON();
      this.diagnostic(options);

      time.end('type checked successfully', `(${this.files.length} modules)`);
    } catch (err: any) {
      this.formatError(err);
      this.isFailed = true;
      error('type check failed');
    }
  }

  private compileJSON() {
    const { options, errors } = ts.convertCompilerOptionsFromJson(
      this.compilerOptions,
      ''
    );

    if (errors.length) {
      throw errors;
    }

    return options;
  }

  private diagnostic(options: CompilerOptions) {
    const program = ts.createProgram(this.files, options);
    const errors = ts.getPreEmitDiagnostics(program);

    if (errors.length) {
      throw errors;
    }

    return program;
  }

  private formatError(errors: readonly Diagnostic[]) {
    const formattedError = ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: (fileName: any) => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => ts.sys.newLine,
    });

    console.log(formattedError);
  }
}
