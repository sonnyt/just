import ts from 'typescript';
import type { CompilerOptions, Diagnostic } from 'typescript';

import type TSConfig from './tsconfig';
import { error, timer } from './logger';

export default class TypeChecker {
  private compilerOptions: any;
  private files: string[];

  constructor(tsconfig: TSConfig) {
    this.files = tsconfig.files;
    this.compilerOptions = tsconfig.compilerOptions;
  }

  check() {
    try {
      const time = timer();
      time.start('type checking...');

      this.diagnostic(this.files);

      time.end('type checked successfully', `(${this.files.length} modules)`);
    } catch (err: any) {
      this.formatError(err);
      error('type check failed');
      throw err;
    }
  }

  checkFile(file: string) {
    try {
      const time = timer();
      time.start('type checking', file, '...');

      this.diagnostic([file]);

      time.end('type checked successfully', `(${this.files.length} modules)`);
    } catch (err: any) {
      this.formatError(err);
      error('type check failed');
      throw err;
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

  private diagnostic(files: string[]) {
    const options = this.compileJSON();
    const program = ts.createProgram(files, options);
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
