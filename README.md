# Just
Zero config TypeScript build and development toolkit.

## Features
- Fast SWC transpiler
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
`just build [options] [files]`

Compiles the application for production deployment.

**Arguments**
- `files` - glob file path to compile. If not present, `includues` from tsconfig.json is used.

**Options**
|Option|Default|Description|
|:--|:--|:--|
|`--transpile-only`|off|disables type checking|
|`--out-dir <outDir>`|`compilerOptions.outDir`|output folder for all emitted files|
|`--no-color`|off|disables output color|
|`-t, --tsconfig <tsconfig>`|`tsconfig.json`|path to typescript configuration file. If not found default config will be used|

### Dev

`just dev [options] [entry]`

Starts the application in development mode.

**Arguments**
- `entry` - server entry path to start. If not present, `main` from package.json is used.

**Options**
|Option|Default|Description|
|:--|:--|:--|
|`-p, --port <port>`|null|server port used in `process.env.PORT`|
|`--type-check`|false|enables type checking|
|`--no-color`|off|disables output color|
|`-t, --tsconfig <tsconfig>`|`tsconfig.json`|path to typescript configuration file. If not found default config will be used|

### Run

`just run [options] <command> [args...]`

Runs typescript scripts.

**Arguments**
- `<command>` - script/command to run.
- `[args...]` - arguments passed to script/command.

**Options**
|Option|Default|Description|
|:--|:--|:--|
|`--no-color`|off|disables output color|
|`-t, --tsconfig <tsconfig>`|`tsconfig.json`|path to typescript configuration file. If not found default config will be used|

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
    "target": "ES2021",
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

## FAQ
...

## Roadmap
- Watch command
- [TypeScript ESLint](https://typescript-eslint.io/) support
- [Prettier](https://www.npmjs.com/package/prettier-eslint) support
- `jsconfig.json` support
- `.swcrc` support
