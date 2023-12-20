import { promisify } from "util";
import { existsSync, mkdir, rmSync, writeFile } from "fs";
import { basename, dirname, extname, join, relative, resolve } from "path";
import { DEFAULT_EXTENSIONS, Options, transformFile, transformSync } from "@swc/core";

import { createFileGlob } from "../utils/file";
import { debug, error } from "../utils/logger";

/**
 * Resolves the source paths based on the provided paths and ignore patterns.
 * 
 * @param paths - An array of source paths.
 * @param ignore - An array of patterns to ignore.
 * @returns An object containing all the resolved paths, paths to be copied, and paths to be compiled.
 */
export function resolveSourcePaths(paths: string[] = [], ignore: string[] = []) {
  const all = createFileGlob(paths, ignore);
  const copy: string[] = [];
  const compile: string[] = [];

  all.forEach((path: string) => {
    if (isCompilable(path)) {
      compile.push(path);
    } else {
      copy.push(path);
    }
  });

  return { all, copy, compile };
}

/**
 * Resolves the output path for a given file name and output directory.
 * 
 * @param fileName - The name of the file.
 * @param outDir - The output directory.
 * @returns The resolved output path.
 */
function resolveOutPath(fileName: string, outDir: string) {
  const relativePath = relative(process.cwd(), fileName);
  const [, ...components] = relativePath.split('/');

  if (!components.length) {
    return join(outDir, fileName);
  }

  while (components[0] === '..') {
    components.shift();
  }

  return join(outDir, ...components).replace(/\.\w*$/, '.js');
}

/**
 * Resolves the source file path relative to the output path.
 * 
 * @param outputPath - The output path.
 * @param fileName - The file name.
 * @returns The resolved source file path.
 */
function resolveSourceFilePath(outputPath: string, fileName: string) {
  return relative(dirname(outputPath), fileName);
}

/**
 * Writes the content to a file with the specified file name.
 * If a source map is provided, it will be appended to the content and saved as well.
 * @param fileName - The name of the file to write.
 * @param content - The content to write to the file.
 * @param map - The source map to append to the content (optional).
 */
async function writeOutFile(fileName: string, content: string, map?: string) {
  const outDir = dirname(fileName);

  const mkdirAsync = promisify(mkdir);
  await mkdirAsync(outDir, { recursive: true });

  const writeFileAsync = promisify(writeFile);

  if (map) {
    const outFile = basename(fileName);
    content += `\n//# sourceMappingURL=${outFile}.map`;
    await writeFileAsync(`${fileName}.map`, map);
  }

  await writeFileAsync(fileName, content);
}

/**
 * Checks if a file is compilable based on its extension.
 * @param fileName - The name of the file.
 * @returns A boolean indicating if the file is compilable.
 */
export function isCompilable(fileName: string) {
  const extension = extname(fileName);
  return DEFAULT_EXTENSIONS.includes(extension);
}

/**
 * Cleans the specified output directory by removing all files and directories inside it.
 * If the directory does not exist, nothing happens.
 * 
 * @param outDir - The path to the output directory.
 */
export function cleanOutDir(outDir: string) {
  const path = resolve(process.cwd(), outDir);

  if (!existsSync(path)) {
    return;
  }

  debug(`cleaning outDir: ${outDir}`);
  return rmSync(path, { recursive: true, force: true });
}

/**
 * Compiles a file using SWC (a JavaScript/TypeScript compiler).
 * @param fileName - The name of the file to compile.
 * @param outDir - The output directory for the compiled file.
 * @param options - Additional options for the compilation process.
 * @returns A promise that resolves when the file is successfully compiled.
 */
export async function compileFile(fileName: string, outDir: string, options: Options) {
  const outputPath = resolveOutPath(fileName, outDir);
  const sourceFileName = resolveSourceFilePath(outputPath, fileName);

  debug(`compiling ${fileName} to ${outputPath}`);

  try {
    const { map, code } = await transformFile(fileName, {
      filename: fileName,
      sourceFileName,
      outputPath,
      ...options,
    });

    const mapContent = options.sourceMaps === true ? map : undefined;
    await writeOutFile(outputPath, code, mapContent);
  } catch (err) {
    error(`failed to compile ${fileName}`);

    if (process.env.JUST_DEBUG) {
      throw err;
    }
  }
}

/**
 * Compiles an array of files using the specified options and outputs the result to the specified directory.
 * @param fileNames - An array of file names to compile.
 * @param outDir - The output directory for the compiled files.
 * @param options - The options to use for compilation.
 * @returns A promise that resolves when all files have been compiled.
 */
export function compileFiles(fileNames: string[], outDir: string, options: Options) {
  return Promise.all(fileNames.map((fileName) => compileFile(fileName, outDir, options)));
}

/**
 * Compiles the given code using SWC.
 * 
 * @param code - The code to compile.
 * @param filename - The name of the file being compiled.
 * @param options - The options for the compilation.
 * @returns The transformed code.
 */
export function compileCode(code: string, filename: string, options: Options) {
  return transformSync(code, { filename, ...options });
}