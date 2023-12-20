import { existsSync, promises as fs } from "fs";
import { basename, dirname, extname, join, relative, resolve } from "path";
import { DEFAULT_EXTENSIONS, Options, transformFile, transformSync } from "@swc/core";
export { DEFAULT_EXTENSIONS } from "@swc/core";

import { copyFile, createFileGlob } from "../utils/file";
import { debug, error } from "../utils/logger";

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
export function resolveOutPath(fileName: string, outDir: string, extension?: string) {
  const relativePath = relative(process.cwd(), fileName);
  const [, ...components] = relativePath.split('/');

  if (!components.length) {
    return join(outDir, fileName);
  }

  while (components[0] === '..') {
    components.shift();
  }

  const outPath = join(outDir, ...components);

  if (extension) {
    return outPath.replace(/\.\w*$/, `.${extension}`);
  }

  return outPath;
}

/**
 * Resolves the source file path relative to the output path.
 * 
 * @param outputPath - The output path.
 * @param fileName - The file name.
 * @returns The resolved source file path.
 */
export function resolveSourceFilePath(outputPath: string, fileName: string) {
  return relative(dirname(outputPath), fileName);
}

/**
 * Writes the content to a file with the specified file name.
 * If a source map is provided, it will be appended to the content and saved as well.
 * @param fileName - The name of the file to write.
 * @param content - The content to write to the file.
 * @param map - The source map to append to the content (optional).
 */
export async function writeOutputFile(fileName: string, content: string, map?: string) {
  const outDir = dirname(fileName);

  await fs.mkdir(outDir, { recursive: true });

  const writes = [];

  if (map) {
    const outFile = basename(fileName);
    content += `\n//# sourceMappingURL=${outFile}.map`;

    writes.push(fs.writeFile(`${fileName}.map`, map));
  }

  writes.push(fs.writeFile(fileName, content));

  return Promise.all(writes);
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
  return fs.rm(path, { recursive: true, force: true });
}

/**
 * Copies file to the specified output directory.
 * 
 * @param fileName - The name of the file to be copied.
 * @param outDir - The output directory where the file will be copied to.
 * @returns A promise that resolves when the file is successfully copied.
 */
export async function copyStaticFile(fileName: string, outDir: string) {
  const outputPath = resolveOutPath(fileName, outDir);

  debug(`copying ${fileName} to ${outDir}`);

  return copyFile(fileName, outputPath);
}

/**
 * Copies files to the specified output directory.
 * @param fileNames - An array of file names to be copied.
 * @param outDir - The output directory where the files will be copied to.
 * @returns A promise that resolves when all files have been copied.
 */
export async function copyStaticFiles(fileNames: string[], outDir: string) {
  return Promise.all(fileNames.map((fileName) => copyStaticFile(fileName, outDir)));
}

/**
 * Compiles a file using SWC (a JavaScript/TypeScript compiler).
 * @param fileName - The name of the file to compile.
 * @param outDir - The output directory for the compiled file.
 * @param options - Additional options for the compilation process.
 * @returns A promise that resolves when the file is successfully compiled.
 */
export async function compileFile(fileName: string, outDir: string, options: Options) {
  const outputPath = resolveOutPath(fileName, outDir, 'js');
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
    await writeOutputFile(outputPath, code, mapContent);
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