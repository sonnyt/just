import { promisify } from "util";
import { existsSync, mkdir, rmSync, writeFile } from "fs";
import { basename, dirname, extname, join, relative, resolve } from "path";
import { DEFAULT_EXTENSIONS, Options, transformFile, transformSync } from "@swc/core";

import { createFileGlob } from "../utils/file";
import { debug, error } from "../utils/logger";

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

function resolveSourceFilePath(outputPath: string, fileName: string) {
  return relative(dirname(outputPath), fileName);
}

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

export function isCompilable(fileName: string) {
  const extension = extname(fileName);
  return DEFAULT_EXTENSIONS.includes(extension);
}

export function cleanOutDir(outDir: string) {
  const path = resolve(process.cwd(), outDir);

  if (!existsSync(path)) {
    return;
  }

  debug(`cleaning outDir: ${outDir}`);
  return rmSync(path, { recursive: true, force: true });
}

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

export function compileFiles(fileNames: string[], outDir: string, options: Options) {
  return Promise.all(fileNames.map((fileName) => compileFile(fileName, outDir, options)));
}

export function compileCode(code: string, filename: string, options: Options) {
  return transformSync(code, { filename, ...options });
}