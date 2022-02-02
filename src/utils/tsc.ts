import ts from 'typescript';

function getFormatDiagnosticsHost() {
  return {
      getCanonicalFileName: fileName => fileName,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => ts.sys.newLine,
  };
}

export default function compile(fileNames: string[], compilerOptions: any): void {
  const { options } = ts.convertCompilerOptionsFromJson(compilerOptions, '');

  const program = ts.createProgram(fileNames, options);
  const diagnostics = ts.getPreEmitDiagnostics(program);

  if (diagnostics.length) {
    const error = ts.formatDiagnosticsWithColorAndContext(diagnostics, getFormatDiagnosticsHost());
    console.log(error);
    throw error;
  }
}