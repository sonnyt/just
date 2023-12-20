import type { TsConfigJson } from 'get-tsconfig';
import ts, { type Diagnostic, type CompilerOptions } from 'typescript';

import { error } from '../utils/logger';

function diagnoseFiles(fileNames: string[], options: CompilerOptions) {
  const program = ts.createProgram(fileNames, options);
  const errors = ts.getPreEmitDiagnostics(program);
  return errors;
}

function formatError(errors: readonly Diagnostic[]) {
  return ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: (fileName: any) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => ts.sys.newLine,
  });
}

export function checkFiles(fileNames: string[] = [], options: TsConfigJson.CompilerOptions) {
  const compilerOptions = ts.convertCompilerOptionsFromJson(options, process.cwd());
  const errors = diagnoseFiles(fileNames, compilerOptions.options);

  if (!errors.length) {
    return false;
  }

  error('type error \n\n' + formatError(errors));

  return true;
}

export function checkFile(fileName: string, options: TsConfigJson.CompilerOptions) {
  return checkFiles([fileName], options);
}