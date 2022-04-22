import ts from 'typescript';
import type { Diagnostic } from 'typescript';

import type TSConfig from './tsconfig';
import { error, timer } from '../utils/logger';

export default class TypeChecker {
  private tsconfig: TSConfig;

  constructor(tsconfig: TSConfig) {
    this.tsconfig = tsconfig;
  }

  check() {
    try {
      const time = timer();
      time.start('type checking...');

      const { files } = this.tsconfig;
      this.diagnostic(files);

      time.end('type checked successfully', `(${files.length} modules)`);
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

      time.end('type checked successfully');
    } catch (err: any) {
      this.formatError(err);
      error('type check failed');
      throw err;
    }
  }

  private compileJSON() {
    const { options, errors } = ts.convertCompilerOptionsFromJson(
      this.tsconfig.compilerOptions,
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
