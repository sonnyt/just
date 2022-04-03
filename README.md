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

## Roadmap
- ESLint support
- Prettier support
- Smart type checking
