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

### Dev

`just dev`

### Run

`just run`

## Programmatic
You can include just runner outside of CLI programmatically.
```shell
node -r @sonnyt/just/register myscript.ts
```
