# Just
Zero config TypeScript build and development toolkit.

## Features
- Fast ESBuild transpiler
- TypeScript type check support
- Live reload
- `.env` file support
- Path alias support
- Typescript script runner
- REPL support

## Install
```shell
# Locally in your project.
npm install -D @sonnyt/just

# Or globally
npm install -g @sonnyt/just
```

## Commands

### Build
`just build`

Compiles the application for production deployment.

**Options**
|Option|Default|Description|
|---|---|---|
|`--transpile-only`|off|disables type checking|
|`--out-dir <outDir>`|`compilerOptions.outDir`|output folder for all emitted files|
|`--no-color`|off|disables output color|
|`-t, --tsconfig <tsconfig>`|`tsconfig.json`|path to typescript configuration file. If not found default config will be used|

### Dev

`just dev`

Starts the application in development mode.

### Run

`just run`

Runs typescript scripts.

## Programmatic
You can include just runner outside of CLI programmatically.
```shell
node -r @sonnyt/just/register myscript.ts
```

## Default TypeScript Config
If `tsconfig.json` file is not provided or not found. Just fallsback to using a default settings.

```JSON
{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ESNext",
    "moduleResolution": "Node",
    "inlineSourceMap": true,
    "strict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "importHelpers": true,
    "outDir": "dist",
    "paths": {}
  },
  "include": ["./"],
  "exclude": ["node_modules"]
}
```

## Roadmap
- ESLint support
- Prettier support
- Smart type checking
