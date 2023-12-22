import ts from 'typescript';

import { dirname } from 'path';
import * as log from '../utils/logger';

/**
 * Loads the TypeScript configuration from the specified path.
 * 
 * @param path - The path to the TypeScript configuration file.
 * @returns An object containing the loaded configuration, file names, and compiler options.
 */
export function loadTSConfig(path: string) {
  const { config } = ts.readConfigFile(path, ts.sys.readFile);
  const { options: compilerOptions, fileNames, errors } = ts.parseJsonConfigFileContent(config, ts.sys, dirname(path));

  if (errors.length) {
    log.error('failed to load tsconfig.json');

    if (process.env.JUST_DEBUG) {
      throw errors;
    }
  }

  compilerOptions.importHelpers = false;
  compilerOptions.files = fileNames;

  return { config, fileNames, compilerOptions };
}

/**
 * Checks the specified files for TypeScript errors using the provided compiler options.
 * 
 * @param fileNames - An array of file names to check.
 * @param options - The TypeScript compiler options.
 * @returns Returns `false` if there are no errors, otherwise returns `true`.
 */
export function checkFiles(fileNames: string[] = [], options: ts.CompilerOptions = {}) {
  const program = ts.createProgram(fileNames, options);
  const errors = ts.getPreEmitDiagnostics(program);

  if (!errors.length) {
    return false;
  }

  const formatedError = ts.formatDiagnosticsWithColorAndContext(errors, {
    getCanonicalFileName: (fileName: any) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => ts.sys.newLine,
  });

  log.error('type error \n\n' + formatedError);

  return true;
}

/**
 * Checks a single TypeScript file using the specified compiler options.
 * @param fileName - The path of the TypeScript file to check.
 * @param options - The compiler options to use for checking the file.
 * @returns A result indicating whether the file passed the check or not.
 */
export function checkFile(fileName: string, options: ts.CompilerOptions = {}) {
  return checkFiles([fileName], options);
}