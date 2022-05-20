import ts from 'typescript';
import type { Diagnostic, CompilerOptions } from 'typescript';

import { error, timer } from '../utils/logger';

export function checkFiles(fileNames: string[] = [], options: CompilerOptions) {
  try {
    const time = timer();
    time.start('type checking...');

    createProgram(fileNames, options);

    time.end('type checked successfully', `(${fileNames.length} modules)`);
  } catch (err: any) {
    formatError(err);
    error('type check failed');
    throw err;
  }
}

export function checkFile(fileName: string, options: CompilerOptions) {
  try {
    const time = timer();
    time.start('type checking', fileName, '...');

    createProgram([fileName], options);

    time.end('type checked successfully');
  } catch (err: any) {
    formatError(err);
    error('type check failed');
    throw err;
  }
}

function createProgram(fileNames: string[], options: CompilerOptions) {
  const program = ts.createProgram(fileNames, options);
  const errors = ts.getPreEmitDiagnostics(program);

  if (errors.length) {
    throw errors;
  }

  return program;
}

function formatError(errors: readonly Diagnostic[]) {
  const formattedError = ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: (fileName: any) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => ts.sys.newLine,
  });

  console.log(formattedError);
}
