import type { TsConfigJson } from 'get-tsconfig';
import ts, { type Diagnostic, type CompilerOptions } from 'typescript';

import { error } from '../utils/logger';

/**
 * Diagnoses the given files using the TypeScript compiler.
 * @param fileNames - An array of file names to diagnose.
 * @param options - Compiler options to use for the diagnosis.
 * @returns An array of diagnostic errors.
 */
function diagnoseFiles(fileNames: string[], options: CompilerOptions) {
  const program = ts.createProgram(fileNames, options);
  const errors = ts.getPreEmitDiagnostics(program);
  return errors;
}

/**
 * Formats the given errors into a string with color and context.
 * 
 * @param errors - The array of diagnostics to format.
 * @returns The formatted string representation of the errors.
 */
function formatError(errors: readonly Diagnostic[]) {
  return ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: (fileName: any) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => ts.sys.newLine,
  });
}

/**
 * Checks the specified files for TypeScript errors using the provided compiler options.
 * 
 * @param fileNames - An array of file names to check.
 * @param options - The TypeScript compiler options.
 * @returns Returns `false` if there are no errors, otherwise returns `true`.
 */
export function checkFiles(fileNames: string[] = [], options: TsConfigJson.CompilerOptions = {}) {
  const compilerOptions = ts.convertCompilerOptionsFromJson(options, process.cwd());
  const errors = diagnoseFiles(fileNames, compilerOptions.options);

  if (!errors.length) {
    return false;
  }

  error('type error \n\n' + formatError(errors));

  return true;
}

/**
 * Checks a single TypeScript file using the specified compiler options.
 * @param fileName - The path of the TypeScript file to check.
 * @param options - The compiler options to use for checking the file.
 * @returns A result indicating whether the file passed the check or not.
 */
export function checkFile(fileName: string, options: TsConfigJson.CompilerOptions = {}) {
  return checkFiles([fileName], options);
}