# Just ![GitHub tag (latest SemVer pre-release)](https://img.shields.io/github/v/tag/sonnyt/just?include_prereleases) ![GitHub](https://img.shields.io/github/license/sonnyt/just)
Zero config TypeScript build and development toolkit.

## Features
- Fast [SWC](https://swc.rs/) compiler
- TypeScript type check support
- Live reload support
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

## Usage
To start a dev server in the root of your project just (😉) run:
```shell
just dev
```

To build:
```shell
just build
```

## Commands

### Build
`just build [options] [files]`

Compiles the application for production deployment.

**Arguments**
- `files` - glob file path to compile. If not present, `includes` from config.json is used.

**Options**
|Option|Default|Description|
|:--|:--|:--|
|`--transpile-only`|off|disables type checking|
|`--out-dir <outDir>`|`compilerOptions.outDir`|output folder for all emitted files|
|`--no-color`|off|disables output color|
|`--debug`|false|enables debug logging|
|`-c, --config <config>`|[default](#default-typescript-config)|path to typescript configuration file|

### Dev

`just dev [options] [entry]`

Starts the application in development mode. Watches for any file changes and live reloads the server.

**Arguments**
- `entry` - server entry path to start. If not present, `main` from package.json is used.

**Options**
|Option|Default|Description|
|:--|:--|:--|
|`-p, --port <port>`|null|server port used in `process.env.PORT`|
|`--type-check`|false|enables type checking|
|`--no-color`|off|disables output color|
|`--debug`|false|enables debug logging|
|`-c, --config <config>`|[default](#default-typescript-config)|path to typescript configuration file|

### Run
`just run [options] <command> [args...]`

Runs `.ts` file scripts.

**Arguments**
- `<command>` - script/command to run.
- `[args...]` - arguments passed to the script/command.

**Options**
|Option|Default|Description|
|:--|:--|:--|
|`--no-color`|off|disables output color|
|`--debug`|false|enables debug logging|
|`-c, --config <config>`|[default](#default-typescript-config)|path to typescript configuration file|

## Programmatic
You can require Just runner programmatically two ways:

Import Just as early as possible in your application code.
```JS
require('@sonnyt/just/register');
```

Or you can use the `--require` (`-r`) [command line option](https://nodejs.org/api/cli.html#-r---require-module) to preload Just. By doing this, you do not need to require and load Just in your application code.

```shell
node -r @sonnyt/just/register myscript.ts
```

Please note that runner does not support type checking.

## Default Config File
Just automatically finds and loads `tsconfig.json` or `jsconfig.json`. By default, this search is performed relative to the entrypoint script. If neither file is found nor the file is not provided as an argument. Just falls back to using default settings shown below.

```JSON
{
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2021",
    "moduleResolution": "Node",
    "inlineSourceMap": true,
    "strict": true,
    "baseUrl": "./",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "importHelpers": true,
    "outDir": "dist",
    "paths": {}
  },
  "include": [
    "./"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

## Environment Variables
When using the [dev](#dev) or [run](#run) commands. Just automatically finds and loads environment variables from a `.env` file into `process.env`. By default, this search is performed relative to the entrypoint script.

## Path Alias
Based on the `paths` [configuration](https://www.typescriptlang.org/tsconfig#paths), Just replaces all alias paths with relative paths after typescript compilation.

## FAQ
### Does Just work with ES Modules?
Currently, Just only supports building ES Module files.

### What's the REPL use case?
Just REPL enables you to execute TypeScript files on Node.js directly without precompiling. It serves as a replacement for [ts-node](https://www.npmjs.com/package/ts-node).

### Does Just compile alias paths?
Out of the box, Just supports build and runtime path aliases. All output file alias imports are replaced with relative paths.

### What happens to my non-JavaScript/TypeScript files?
If your source directory includes non-compilable files (i.e., JSON, SVG, etc.), Just automatically copies them into your output directory.

### How can I help?
If you would like to contribute, please see the issues labeled as [help-wanted](https://github.com/sonnyt/just/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22).

## Roadmap
- Build watch option [#7](https://github.com/sonnyt/just/issues/7)
- Init option - copy over the default config file to the working directory [#5](https://github.com/sonnyt/just/issues/5)
- [TypeScript ESLint](https://typescript-eslint.io/) support [#6](https://github.com/sonnyt/just/issues/6)
- [Prettier](https://www.npmjs.com/package/prettier-eslint) support
- REPL ES module support
- ~~`jsconfig.json` support~~
- `.swcrc` support
